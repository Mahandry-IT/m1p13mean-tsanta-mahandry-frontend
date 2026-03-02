import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { ApiError } from '../../../core/models/api-error.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { ResourceListService } from '../../../core/services/resource-list.service';

/**
 * Variante de ResourceCards dédiée aux produits avec prix (storeData).
 * Différences:
 * - Affiche un prix (dernier prix connu pour le store, sinon prix par défaut)
 * - Peut charger une liste via un endpoint distinct (ex: /products/my-stores)
 * - Gère la galerie d'images comme ResourceCards
 */
@Component({
  selector: 'app-store-product-cards',
  templateUrl: './store-product-cards.component.html',
  styleUrls: ['./store-product-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class StoreProductCardsComponent<TItem extends Record<string, any>> implements OnChanges, OnInit {
  /** endpoint de liste (GET pageable). Ex: /products/my-stores */
  @Input({ required: true }) listEndpoint!: string;

  /** endpoint base pour actions (GET by id, PATCH, DELETE). Ex: /products */
  @Input({ required: true }) endpoint!: string;

  /** clé du tableau dans data (si auto-détection impossible) */
  @Input() itemsKey: string | null = null;

  /** champ titre */
  @Input({ required: true }) titleField!: string;

  /**
   * Field contenant les images (ex: 'images')
   * Supporte string | {link} | array
   */
  @Input() imageField: string | null = null;

  /** storeId à utiliser pour sélectionner le prix dans storeData */
  @Input() storeId: string | null = null;

  /** prix par défaut si aucun storeData ne matche */
  @Input() defaultPrice: number | null = null;

  /** Params supplémentaires */
  @Input() filters: Record<string, string | number | boolean | null | undefined> = {};

  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() pageSize = 20;

  /** Sort serveur */
  @Input() enableServerSort = true;
  @Input() sortByParam = 'sortBy';
  @Input() sortDirParam = 'sortDir';

  /** Actions */
  @Input() isEditable = false;
  @Input() isDeletable = false;
  @Input() isInfonable = false;
  @Input() isAddable = false;

  @Output() edit = new EventEmitter<TItem>();
  @Output() delete = new EventEmitter<TItem>();
  @Output() info = new EventEmitter<TItem>();
  @Output() add = new EventEmitter<void>();

  searchCtrl = new FormControl<string>('', { nonNullable: true });

  loading = false;
  error?: ApiError;

  items: TItem[] = [];
  pagination: PaginationMeta = {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
  };

  sort: Sort = { active: '', direction: '' };

  /** id de ligne -> url image sélectionnée */
  private selectedImageByRowId = new Map<string, string>();

  constructor(
    private readonly resourceList: ResourceListService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.searchCtrl.valueChanges
      .pipe(startWith(this.searchCtrl.value), debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pagination = { ...this.pagination, page: 1 };
        this.load();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['listEndpoint'] || changes['endpoint'] || changes['filters'] || changes['itemsKey'] || changes['storeId']) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  ngOnInit(): void {
    if (this.listEndpoint) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  load(): void {
    if (!this.listEndpoint) return;

    const isBrowser = typeof (globalThis as any).window !== 'undefined';
    if (!isBrowser) return;

    this.loading = true;
    this.error = undefined;

    const sortParams: Record<string, string | number | boolean | null | undefined> = {};
    if (this.enableServerSort && this.sort.active && this.sort.direction) {
      sortParams[this.sortByParam] = this.sort.active;
      sortParams[this.sortDirParam] = this.sort.direction;
    }

    this.resourceList
      .fetchPage<TItem>({
        endpoint: this.listEndpoint,
        page: this.pagination.page,
        limit: this.pagination.limit,
        q: this.searchCtrl.value,
        filters: { ...(this.filters ?? {}), ...sortParams },
        itemsKey: this.itemsKey,
      })
      .subscribe({
        next: (res) => {
          this.items = res.items;
          this.pagination = res.pagination;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: ApiError) => {
          this.error = err;
          this.items = [];
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onPage(event: any): void {
    this.pagination = { ...this.pagination, page: event.pageIndex + 1, limit: event.pageSize };
    this.load();
  }

  onSortChange(sort: Sort): void {
    this.sort = sort;
    this.pagination = { ...this.pagination, page: 1 };
    this.load();
  }

  titleOf(row: TItem): string {
    const v = row?.[this.titleField];
    return (v == null ? '' : String(v)).trim();
  }

  /**
   * Prix affiché:
   * - si storeId fourni: cherche storeData[].storeId === storeId
   * - sinon: prend le dernier storeData avec currentPrice
   * - sinon: defaultPrice
   */
  priceOf(row: TItem): number | null {
    const storeData = (row as any)?.storeData;
    const list = Array.isArray(storeData) ? storeData : [];

    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    if (this.storeId) {
      const match = list.find((x: any) => String(x?.storeId ?? '') === String(this.storeId));
      const p = toNum(match?.currentPrice);
      if (p !== null) return p;
    }

    // fallback: dernier item qui a un currentPrice
    for (let i = list.length - 1; i >= 0; i--) {
      const p = toNum(list[i]?.currentPrice);
      if (p !== null) return p;
    }

    return this.defaultPrice;
  }

  formatPrice(price: number | null): string {
    if (price === null) return '—';
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    } catch {
      return `${price} €`;
    }
  }

  private rowIdOf(row: TItem): string {
    return String((row as any)?._id ?? (row as any)?.id ?? '');
  }

  imageUrlsOf(row: TItem, max = 8): string[] {
    if (!this.imageField) return [];

    const val = (row as any)?.[this.imageField];
    if (val == null) return [];

    const urls: string[] = [];
    const add = (u: any) => {
      if (typeof u === 'string') {
        const s = u.trim();
        if (s) urls.push(s);
        return;
      }
      if (u && typeof u === 'object') {
        const link = String((u as any)?.link ?? '').trim();
        if (link) urls.push(link);
      }
    };

    if (Array.isArray(val)) {
      for (const it of val) add(it);
    } else {
      add(val);
    }

    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const u of urls) {
      if (seen.has(u)) continue;
      seen.add(u);
      uniq.push(u);
    }

    return uniq.slice(0, Math.max(0, max));
  }

  getSelectedImageUrl(row: TItem): string | null {
    const id = this.rowIdOf(row);
    const sel = id ? this.selectedImageByRowId.get(id) : undefined;
    if (sel) return sel;

    const first = this.imageUrlsOf(row, 1)[0];
    return first ?? null;
  }

  selectImage(row: TItem, url: string): void {
    const id = this.rowIdOf(row);
    if (!id) return;
    this.selectedImageByRowId.set(id, url);
    this.cdr.markForCheck();
  }

  isSelectedImage(row: TItem, url: string): boolean {
    const id = this.rowIdOf(row);
    if (!id) return false;
    return this.selectedImageByRowId.get(id) === url;
  }

  onAdd(): void {
    this.add.emit();
  }

  trackById = (_: number, row: TItem) => (row as any)?._id ?? (row as any)?.id ?? _;
}
