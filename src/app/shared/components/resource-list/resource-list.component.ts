import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { ResourceListService } from '../../../core/services/resource-list.service';
import { ApiError } from '../../../core/models/api-error.model';
import { PaginatedResponse, PaginationMeta } from '../../../core/models/pagination.model';
import { Sort } from '@angular/material/sort';
import { ApiService } from '../../../core/services/api.service';

export interface ResourceListColumn {
  key: string;
  header: string;
  /** si absent, on affiche row[key] */
  cell?: (row: any) => string;
}

export interface ResourceResolveConfig {
  /** champ dans la ligne qui contient l'id (ex: roleId) */
  field: string;
  /** endpoint à appeler pour récupérer la liste des entités (ex: '/roles') */
  endpoint: string;
  /** clé id dans la ressource retournée (défaut: '_id' puis 'id') */
  idField?: string;
  /** clé label à afficher (défaut: 'label' puis 'name' puis 'title') */
  labelField?: string;
}

// 👇 AJOUTER cette interface
export interface CustomAction {
  label: string;
  icon?: string;
  callback: (row: any) => void;
  color?: 'primary' | 'accent' | 'warn';
  disabled?: (row: any) => boolean;
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
  @Input() isAddable = false;

  /** affichage en table ou en list de card */
  @Input() isAList = false;

  /** body envoyé au POST `${endpoint}/` quand on clique sur Ajouter */
  @Input() addBody: Record<string, any> | null = null;

  /** filtres fixes envoyés au backend (ex: { status: 'active' }) */
  @Input() filters: Record<string, string | number | boolean | null | undefined> = {};

  /** colonnes ka table; si vide => auto à partir des clés du 1er item */
  @Input() columns: ResourceListColumn[] = [];

  /**
   * Permet de remplacer l'affichage d'un champ ID par un label lisible.
   * Exemple: [{ field: 'roleId', endpoint: '/roles', labelField: 'label' }]
   */
  @Input() resolves: ResourceResolveConfig[] = [];

  // 👇 AJOUTER cet Input
  @Input() customActions: CustomAction[] = [];

  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() pageSize = 20;

  @Output() edit = new EventEmitter<TItem>();
  @Output() delete = new EventEmitter<TItem>();
  @Output() info = new EventEmitter<TItem>();

  /** Permet au parent de surcharger le comportement add (ex: ouvrir un form) */
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

  displayedColumns: string[] = [];

  sort: Sort = { active: '', direction: '' };

  /** field -> (id -> label) */
  private resolveMaps = new Map<string, Map<string, string>>();

  constructor(
    private readonly resourceList: ResourceListService,
    private readonly api: ApiService,
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

    if (changes['resolves']) {
      this.loadResolves();
    }
  }

  ngOnInit(): void {
    this.loadResolves();

    // Si la donnée n'a pas été chargée via ngOnChanges (cas edge), on charge une première fois.
    if (!this.items.length && this.endpoint) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  private loadResolves(): void {
    const isBrowser = typeof (globalThis as any).window !== 'undefined';
    if (!isBrowser) return;

    const resolves = this.resolves ?? [];
    if (!Array.isArray(resolves) || resolves.length === 0) return;

    for (const r of resolves) {
      if (!r?.field || !r?.endpoint) continue;

      this.api.get<any>(r.endpoint).subscribe({
        next: (res) => {
          const data = res?.data ?? res;
          const list = Array.isArray(data)
            ? data
            : (Array.isArray(data?.items) ? data.items
              : (Array.isArray(data?.data) ? data.data
                : []));

          const idField = (r.idField ?? '_id').trim();
          const fallbackIdField = 'id';
          const labelField = (r.labelField ?? 'label').trim();

          const mapForField = new Map<string, string>();
          for (const item of list) {
            const id = String(item?.[idField] ?? item?.[fallbackIdField] ?? '').trim();
            if (!id) continue;
            const label = String(item?.[labelField] ?? item?.name ?? item?.title ?? id).trim();
            mapForField.set(id, label);
          }

          this.resolveMaps.set(r.field, mapForField);
          this.cdr.markForCheck();
        },
        error: () => {
          // on ignore: pas bloquant pour la liste
        },
      });
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

  // 👇 MODIFIER cette méthode
  private syncColumns(): void {
    const base = this.columns?.length
      ? this.columns.map((c) => c.key)
      : (this.items[0] ? Object.keys(this.items[0]) : []);

    const actions: string[] = (this.isInfonable || this.isEditable || this.isDeletable || this.customActions.length > 0) ? ['actions'] : [];
    this.displayedColumns = [...base, ...actions];
  }

  private tryResolveValue(colKey: string, raw: unknown): string | null {
    const mapForField = this.resolveMaps.get(colKey);
    if (!mapForField) return null;

    const id = String(raw ?? '').trim();
    if (!id) return '';

    return mapForField.get(id) ?? id;
  }

  cellValue(colKey: string, row: TItem): string {
    const col = this.columns.find((c) => c.key === colKey);
    if (col?.cell) return col.cell(row);

    const v = (row as any)[colKey];

    const resolved = this.tryResolveValue(colKey, v);
    if (resolved !== null) return resolved;

    if (v === null || v === undefined) return '';
    return String(v);
  }

  cardValue(col: ResourceListColumn, row: TItem): string {
    if (typeof col.cell === 'function') return col.cell(row);

    const v = (row as any)[col.key];
    const resolved = this.tryResolveValue(col.key, v);
    if (resolved !== null) return resolved;

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

  onAdd(): void {
    // Si le parent a branché (add), on lui laisse gérer (ouvrir dialog, etc.)
    if (this.add.observed) {
      this.add.emit();
      return;
    }

    if (!this.endpoint) return;

    const isBrowser = typeof (globalThis as any).window !== 'undefined';
    if (!isBrowser) return;

    this.loading = true;
    this.error = undefined;

    const url = this.endpoint.endsWith('/') ? this.endpoint : `${this.endpoint}/`;

    this.api.post<any>(url, this.addBody ?? {}).subscribe({
      next: () => {
        this.loading = false;
        this.load();
      },
      error: (err: ApiError) => {
        this.error = err;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
