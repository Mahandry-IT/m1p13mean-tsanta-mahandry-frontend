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
import { ApiService } from '../../../core/services/api.service';

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

  /**
   * Filtres UI (en plus de la recherche q).
   * Chaque filtre est envoyé comme query param (filtre.param = value).
   */
  @Input() filterControls: ResourceCardsFilterControl[] = [];

  /** param -> ctrl */
  filterForm = new Map<string, FormControl<any>>();

  /** options calculées (param -> options) */
  private selectOptions = new Map<string, ResourceCardsFilterOption[]>();
  /** statut chargement options (param -> boolean) */
  private selectOptionsLoading = new Map<string, boolean>();

  constructor(
    private readonly resourceList: ResourceListService,
    private readonly api: ApiService,
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
    if (changes['filterControls']) {
      this.setupFilterControls();
      this.loadRemoteOptions();
    }

    if (changes['endpoint'] || changes['filters'] || changes['itemsKey']) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  ngOnInit(): void {
    this.setupFilterControls();
    this.loadRemoteOptions();

    if (this.endpoint) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
      this.load();
    }
  }

  private setupFilterControls(): void {
    // Ne pas recréer si déjà initialisé avec les mêmes params
    this.filterForm.clear();

    const ctrls = Array.isArray(this.filterControls) ? this.filterControls : [];
    for (const f of ctrls) {
      if (!f?.param) continue;

      const shouldStartDisabled = this.shouldDisableFilterAtStart(f);
      const fc = new FormControl<any>({ value: f.defaultValue ?? null, disabled: shouldStartDisabled });
      this.filterForm.set(f.param, fc);

      fc.valueChanges.pipe(debounceTime(150), distinctUntilChanged()).subscribe(() => {
        this.onDependencyChanged(f.param);

        this.pagination = { ...this.pagination, page: 1 };
        this.load();
      });
    }

    // appliquer disable/enable après création pour tous (au cas où l'ordre des filtres change)
    this.refreshDependentDisabledStates();
  }

  private shouldDisableFilterAtStart(f: ResourceCardsFilterControl): boolean {
    if (f.type !== 'select') return false;
    if (!f.disabledWhenMissingDeps) return false;
    const deps = f.remoteOptions?.dependsOn;
    if (!deps?.length) return false;
    return this.isMissingDeps(deps);
  }

  private refreshDependentDisabledStates(): void {
    const ctrls = Array.isArray(this.filterControls) ? this.filterControls : [];
    for (const f of ctrls) {
      if (f.type !== 'select') continue;
      if (!f.disabledWhenMissingDeps) continue;
      const deps = f.remoteOptions?.dependsOn;
      if (!deps?.length) continue;

      const ctrl = this.getFilterCtrl(f.param);
      const shouldDisable = this.isMissingDeps(deps);

      if (shouldDisable && ctrl.enabled) {
        ctrl.disable({ emitEvent: false });
        ctrl.setValue(null, { emitEvent: false });
      }
      if (!shouldDisable && ctrl.disabled) {
        ctrl.enable({ emitEvent: false });
      }
    }
  }

  private onDependencyChanged(changedParam: string): void {
    // 1) Mettre à jour disable/enable des champs dépendants en premier
    this.refreshDependentDisabledStates();

    const ctrls = Array.isArray(this.filterControls) ? this.filterControls : [];
    for (const f of ctrls) {
      const ro = f.remoteOptions;
      if (f.type !== 'select' || !ro?.dependsOn?.length) continue;
      if (!ro.dependsOn.includes(changedParam)) continue;

      // si la dépendance manque, reset la valeur
      if (f.disabledWhenMissingDeps && this.isMissingDeps(ro.dependsOn)) {
        this.getFilterCtrl(f.param).setValue(null, { emitEvent: false });
      }

      // reload options pour ce select
      this.loadRemoteOptionsFor(f);
    }


    this.cdr.markForCheck();
  }

  private isMissingDeps(dependsOn: string[]): boolean {
    for (const dep of dependsOn) {
      const v = this.getFilterCtrl(dep).value;
      if (v === null || v === undefined || v === '') return true;
    }
    return false;
  }

  private loadRemoteOptions(): void {
    const ctrls = Array.isArray(this.filterControls) ? this.filterControls : [];
    for (const f of ctrls) {
      if (f.type !== 'select') continue;
      if (!f.remoteOptions?.endpoint) continue;
      this.loadRemoteOptionsFor(f);
    }
  }

  private loadRemoteOptionsFor(f: ResourceCardsFilterControl): void {
    const ro = f.remoteOptions;
    if (!ro?.endpoint) return;

    // dépendances manquantes => options vides (et facultativement disabled)
    if (ro.dependsOn?.length && this.isMissingDeps(ro.dependsOn)) {
      this.selectOptions.set(f.param, []);
      this.selectOptionsLoading.set(f.param, false);
      this.cdr.markForCheck();
      return;
    }

    this.selectOptionsLoading.set(f.param, true);
    this.cdr.markForCheck();

    const params: Record<string, string | number | boolean | null | undefined> = {
      ...(ro.params ?? {}),
    };

    // injecter dépendances en query params
    if (ro.dependsOn?.length) {
      for (const dep of ro.dependsOn) {
        params[dep] = this.getFilterCtrl(dep).value;
      }
    }

    // pagination large par défaut si non spécifiée
    if (params['page'] === undefined) params['page'] = 1;
    if (params['limit'] === undefined) params['limit'] = 200;

    this.api.get<any>(ro.endpoint, params).subscribe({
      next: (res) => {
        const data = res?.data ?? res;

        // trouver le tableau
        let items: any[] = [];
        if (ro.itemsKey && Array.isArray(data?.[ro.itemsKey])) {
          items = data[ro.itemsKey];
        } else if (Array.isArray(data?.items)) {
          items = data.items;
        } else {
          // fallback: première propriété array
          for (const [, v] of Object.entries(data ?? {})) {
            if (Array.isArray(v)) {
              items = v as any[];
              break;
            }
          }
        }

        const valueField = (ro.valueField ?? '_id').trim();
        const labelField = (ro.labelField ?? 'name').trim();

        const opts: ResourceCardsFilterOption[] = (items ?? [])
          .map((it) => {
            const value = it?.[valueField] ?? it?.id;
            const label = it?.[labelField] ?? it?.label ?? it?.title ?? value;
            if (value === undefined || value === null) return null;
            return {
              value: value as any,
              label: String(label ?? '').trim() || String(value),
            };
          })
          .filter(Boolean) as ResourceCardsFilterOption[];

        this.selectOptions.set(f.param, opts);
        this.selectOptionsLoading.set(f.param, false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.selectOptions.set(f.param, []);
        this.selectOptionsLoading.set(f.param, false);
        this.cdr.markForCheck();
      },
    });
  }

  getSelectOptions(param: string, fallback?: ResourceCardsFilterOption[]): ResourceCardsFilterOption[] {
    return this.selectOptions.get(param) ?? (fallback ?? []);
  }

  isSelectOptionsLoading(param: string): boolean {
    return this.selectOptionsLoading.get(param) ?? false;
  }


  clearFilters(): void {
    for (const ctrl of this.filterForm.values()) {
      ctrl.setValue(null, { emitEvent: false });
    }
    this.pagination = { ...this.pagination, page: 1 };
    this.load();
    this.loadRemoteOptions();
    this.cdr.markForCheck();
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

    const uiFilters = this.uiFilterParams();

    this.resourceList
      .fetchPage<TItem>({
        endpoint: this.endpoint,
        page: this.pagination.page,
        limit: this.pagination.limit,
        q: this.searchCtrl.value,
        filters: { ...(this.filters ?? {}), ...uiFilters, ...sortParams },
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

  /** Permet au parent de forcer un rechargement */
  refresh(): void {
    this.load();
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
    if (val === null || val === undefined) return null;

    // string direct
    if (typeof val === 'string') {
      const s = val.trim();
      return s ? s : null;
    }

    // array (0..n)
    if (Array.isArray(val)) {
      if (val.length === 0) return null;
      const first = val.find((x) => x != null);
      if (!first) return null;

      if (typeof first === 'string') {
        const s = first.trim();
        return s ? s : null;
      }

      const link = (first as any)?.link;
      if (typeof link === 'string' && link.trim()) return link.trim();
      return null;
    }

    // objet { link }
    if (typeof val === 'object') {
      const link = (val as any)?.link;
      if (typeof link === 'string' && link.trim()) return link.trim();
      return null;
    }

    return null;
  }

  getFilterCtrl(param: string): FormControl<any> {
    const existing = this.filterForm.get(param);
    if (existing) return existing;

    const fc = new FormControl<any>(null);
    this.filterForm.set(param, fc);
    return fc;
  }

  private uiFilterParams(): Record<string, string | number | boolean | null | undefined> {
    const out: Record<string, string | number | boolean | null | undefined> = {};
    for (const [param, ctrl] of this.filterForm.entries()) {
      const v = ctrl.value;
      if (v === null || v === undefined || v === '') continue;
      out[param] = v;
    }
    return out;
  }

  trackById = (_: number, row: TItem) => (row as any)?._id ?? (row as any)?.id ?? _;

  onAdd(): void {
    this.add.emit();
  }
}

export interface ResourceCardsFilterOption {
  label: string;
  value: string | number | boolean;
}

export type ResourceCardsFilterType = 'select' | 'number' | 'text';

export interface ResourceCardsRemoteOptionsConfig {
  endpoint: string;
  /** clé du tableau dans data si nécessaire (défaut: 'items', sinon auto) */
  itemsKey?: string | null;
  /** mapping option.value (défaut: '_id' puis 'id') */
  valueField?: string;
  /** mapping option.label (défaut: 'name' puis 'label' puis 'title') */
  labelField?: string;
  /** params fixes (ex: { limit: 100 }) */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** dépendances: liste de query params à injecter depuis les autres filtres (ex: ['categoryId']) */
  dependsOn?: string[];
}

export interface ResourceCardsFilterControl {
  /** Label affiché dans le form-field */
  label: string;
  /** Nom du query param côté backend (ex: categoryId, typeId, minPrice, maxPrice) */
  param: string;
  /** Type de contrôle */
  type: ResourceCardsFilterType;
  /** Options (obligatoire pour select) */
  options?: ResourceCardsFilterOption[];
  /** Si fourni et type=select, les options sont chargées depuis l'API */
  remoteOptions?: ResourceCardsRemoteOptionsConfig;
  /** Désactive le champ tant que les dépendances ne sont pas remplies */
  disabledWhenMissingDeps?: boolean;
  /** Placeholder optionnel */
  placeholder?: string;
  /** Valeur par défaut */
  defaultValue?: string | number | boolean | null;
}
