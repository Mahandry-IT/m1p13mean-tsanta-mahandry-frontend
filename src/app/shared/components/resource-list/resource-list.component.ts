import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ResourceListService } from '../../../core/services/resource-list.service';
import { ApiError } from '../../../core/models/api-error.model';
import { PaginatedResponse, PaginationMeta } from '../../../core/models/pagination.model';
import { Sort } from '@angular/material/sort';

export interface ResourceListColumn {
  key: string;
  header: string;
  /** si absent, on affiche row[key] */
  cell?: (row: any) => string;
}

@Component({
  selector: 'app-resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourceListComponent<TItem extends Record<string, any>> implements OnChanges, OnInit {
  @Input({ required: true }) endpoint!: string;

  /** clé du tableau dans data (ex: users/products). Si non fourni, auto-détection. */
  @Input() itemsKey: string | null = null;

  @Input() isEditable = false;
  @Input() isDeletable = false;
  @Input() isInfonable = false;

  /** true => cartes; false => table */
  @Input() isAList = false;

  /** filtres fixes envoyés au backend (ex: { status: 'active' }) */
  @Input() filters: Record<string, string | number | boolean | null | undefined> = {};

  /** colonnes ka table; si vide => auto à partir des clés du 1er item */
  @Input() columns: ResourceListColumn[] = [];

  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() pageSize = 20;

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

  displayedColumns: string[] = [];

  sort: Sort = { active: '', direction: '' };

  constructor(
    private readonly resourceList: ResourceListService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.searchCtrl.valueChanges
      .pipe(startWith(this.searchCtrl.value), debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        // reset sur page 1
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
    // Si la donnée n'a pas été chargée via ngOnChanges (cas edge), on charge une première fois.
    if (!this.items.length && this.endpoint) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  load(): void {
    if (!this.endpoint) return;

    // SSR/hydration: pas de localStorage => pas de token => on évite les appels protégés côté serveur.
    const isBrowser = typeof (globalThis as any).window !== 'undefined';
    if (!isBrowser) return;

    this.loading = true;
    this.error = undefined;

    this.resourceList
      .fetchPage<TItem>({
        endpoint: this.endpoint,
        page: this.pagination.page,
        limit: this.pagination.limit,
        q: this.searchCtrl.value,
        filters: this.filters,
        itemsKey: this.itemsKey,
      })
      .subscribe({
        next: (res: PaginatedResponse<TItem>) => {
          this.items = res.items;
          this.pagination = res.pagination;
          this.syncColumns();
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
    this.applyClientSort();
    this.cdr.markForCheck();
  }

  private applyClientSort(): void {
    const { active, direction } = this.sort;
    if (!active || !direction) return;

    const dir = direction === 'asc' ? 1 : -1;
    const get = (row: TItem) => (row as any)[active];

    this.items = [...this.items].sort((a, b) => {
      const av = get(a);
      const bv = get(b);

      // nulls last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      // numbers
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;

      // dates
      const ad = Date.parse(av);
      const bd = Date.parse(bv);
      if (!Number.isNaN(ad) && !Number.isNaN(bd)) return (ad - bd) * dir;

      // strings
      return String(av).localeCompare(String(bv)) * dir;
    });
  }

  private syncColumns(): void {
    const base = this.columns?.length
      ? this.columns.map((c) => c.key)
      : (this.items[0] ? Object.keys(this.items[0]) : []);

    const actions: string[] = (this.isInfonable || this.isEditable || this.isDeletable) ? ['actions'] : [];
    this.displayedColumns = [...base, ...actions];
  }

  cellValue(colKey: string, row: TItem): string {
    const col = this.columns.find((c) => c.key === colKey);
    if (col?.cell) return col.cell(row);
    const v = (row as any)[colKey];
    if (v === null || v === undefined) return '';
    return String(v);
  }

  cardValue(col: ResourceListColumn, row: TItem): string {
    if (typeof col.cell === 'function') return col.cell(row);
    const v = (row as any)[col.key];
    if (v === null || v === undefined) return '';
    return String(v);
  }

  headerLabel(colKey: string): string {
    if (colKey === 'actions') return 'Actions';
    const col = this.columns.find((c) => c.key === colKey);
    return col?.header ?? colKey;
  }

  trackByIndex(i: number): number {
    return i;
  }
}
