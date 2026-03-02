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
 * Composant générique d'affichage en cards.
 * - Pagination côté serveur via page/limit/q (+ filters)
 * - Sort via MatSort (envoie sortBy/sortDir si configuré)
 */
@Component({
  selector: 'app-resource-cards',
  templateUrl: './resource-cards.component.html',
  styleUrls: ['./resource-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourceCardsComponent<TItem extends Record<string, any>> implements OnChanges, OnInit {
  @Input({ required: true }) endpoint!: string;

  /** clé du tableau dans data (si auto-détection impossible) */
  @Input() itemsKey: string | null = null;

  /** Field utilisé comme titre du card (ex: 'name') */
  @Input({ required: true }) titleField!: string;

  /** Field utilisé comme description du card (ex: 'description') */
  @Input() descriptionField: string | null = null;

  /**
   * Field contenant les images. Ex: 'images'
   * Supporte:
   * - string (url)
   * - { link: string }
   * - Array<string | { link: string }>
   */
  @Input() imageField: string | null = null;

  /** Params supplémentaires (ex: { status:'active', categoryId: '...' }) */
  @Input() filters: Record<string, string | number | boolean | null | undefined> = {};

  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() pageSize = 20;

  /** Active MatSort => envoi sortBy/sortDir au backend */
  @Input() enableServerSort = true;

  /** Nom des query params pour le sort */
  @Input() sortByParam = 'sortBy';
  @Input() sortDirParam = 'sortDir';

  /** Actions optionnelles (icônes uniquement) */
  @Input() isEditable = false;
  @Input() isDeletable = false;
  @Input() isInfonable = false;

  @Output() edit = new EventEmitter<TItem>();
  @Output() delete = new EventEmitter<TItem>();
  @Output() info = new EventEmitter<TItem>();

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
    if (changes['endpoint'] || changes['filters'] || changes['itemsKey']) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  ngOnInit(): void {
    if (this.endpoint) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  load(): void {
    if (!this.endpoint) return;

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
        endpoint: this.endpoint,
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

  descriptionOf(row: TItem): string {
    if (!this.descriptionField) return '';
    const v = (row as any)?.[this.descriptionField];
    return (v == null ? '' : String(v)).trim();
  }

  imageUrlOf(row: TItem): string | null {
    if (!this.imageField) return null;

    const val = (row as any)?.[this.imageField];
    if (!val) return null;

    // string
    if (typeof val === 'string') return val;

    // {link}
    if (typeof val === 'object' && !Array.isArray(val)) {
      const link = (val as any)?.link;
      return typeof link === 'string' && link.trim() ? link.trim() : null;
    }

    // array
    if (Array.isArray(val) && val.length) {
      const first = val[0];
      if (typeof first === 'string') return first;
      const link = (first as any)?.link;
      return typeof link === 'string' && link.trim() ? link.trim() : null;
    }

    return null;
  }

  trackById = (_: number, row: TItem) => (row as any)?._id ?? (row as any)?.id ?? _;
}

