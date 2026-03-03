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
  TemplateRef,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';

import { ApiError } from '../../../core/models/api-error.model';
import { PaginationMeta } from '../../../core/models/pagination.model';
import { ResourceListService } from '../../../core/services/resource-list.service';
import { ApiService } from '../../../core/services/api.service';

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

  /** Affiche un coeur sur l'image + permet de toggler un favori */
  @Input() isFavorisable = false;

  /** Champ booléen du row indiquant si c'est en favori (par défaut: 'isFavorite') */
  @Input() favField = 'isFavorite';

  @Output() edit = new EventEmitter<TItem>();
  @Output() delete = new EventEmitter<TItem>();
  @Output() info = new EventEmitter<TItem>();
  @Output() add = new EventEmitter<void>();
  @Output() favoriteChange = new EventEmitter<{ row: TItem; isFavorite: boolean }>();

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

  /**
   * Filtres UI (en plus de la recherche q).
   * Chaque filtre est envoyé comme query param (filtre.param = value).
   */
  @Input() filterControls: StoreProductCardsFilterControl[] = [];

  /** param -> ctrl */
  filterForm = new Map<string, FormControl<any>>();

  /** options calculées (param -> options) */
  private selectOptions = new Map<string, StoreProductCardsFilterOption[]>();
  /** statut chargement options (param -> boolean) */
  private selectOptionsLoading = new Map<string, boolean>();

  private lastLoadSignature: string | null = null;

  /**
   * Template optionnel pour surcharger l’affichage du prix sous le titre.
   * Contexte disponible dans le template: implicit(row) + price.
   */
  @Input() priceTemplate: TemplateRef<StoreProductCardsPriceTemplateContext<TItem>> | null = null;

  /**
   * Formatter le prix (par défaut: EUR). Peut être surchargé côté page.
   * Utile si tu veux afficher Ar, MGA, etc.
   */
  @Input() priceFormatter: ((price: number | null, row?: TItem) => string) | null = null;

  /**
   * Callback optionnel pour calculer le prix + promo côté page (TS).
   * Si fourni, il remplace la logique interne (storeData/defaultPrice) dans le contexte.
   */
  @Input() priceResolver: ((row: TItem) => Partial<Pick<StoreProductCardsPriceTemplateContext<TItem>, 'basePrice' | 'finalPrice' | 'hasPromo' | 'promoPercent'>> | null) | null = null;

  constructor(
    private readonly resourceList: ResourceListService,
    private readonly api: ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.searchCtrl.valueChanges
      .pipe(startWith(this.searchCtrl.value), debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pagination = { ...this.pagination, page: 1 };
        this.triggerLoadIfNeeded(false);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filterControls']) {
      this.setupFilterControls();
      this.loadRemoteOptions();
    }

    if (changes['listEndpoint'] || changes['itemsKey']) {
      this.triggerLoadIfNeeded(true);
      return;
    }

    // filters est souvent recréé côté parent => on déduplique via signature
    if (changes['filters']) {
      this.triggerLoadIfNeeded(true);
    }
  }

  ngOnInit(): void {
    this.setupFilterControls();
    this.loadRemoteOptions();

    if (this.listEndpoint) {
      this.triggerLoadIfNeeded(true);
    }
  }

  private stableStringify(obj: any): string {
    if (obj === null || obj === undefined) return '';
    if (Array.isArray(obj)) return `[${obj.map((x) => this.stableStringify(x)).join(',')}]`;
    if (typeof obj !== 'object') return String(obj);
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${k}:${this.stableStringify(obj[k])}`).join(',')}}`;
  }

  private computeLoadSignature(): string {
    const sortPart = this.enableServerSort && this.sort.active && this.sort.direction
      ? `${this.sort.active}:${this.sort.direction}`
      : '';
    const uiFilters = this.uiFilterParams();
    return [
      `list=${this.listEndpoint}`,
      `itemsKey=${this.itemsKey ?? ''}`,
      `page=${this.pagination.page}`,
      `limit=${this.pagination.limit}`,
      `q=${this.searchCtrl.value ?? ''}`,
      `filters=${this.stableStringify(this.filters ?? {})}`,
      `ui=${this.stableStringify(uiFilters)}`,
      `sort=${sortPart}`,
    ].join('|');
  }

  private triggerLoadIfNeeded(resetPage = false): void {
    if (resetPage) {
      this.pagination = { ...this.pagination, page: 1, limit: this.pageSize };
    }

    const sig = this.computeLoadSignature();
    if (sig === this.lastLoadSignature) return;
    this.lastLoadSignature = sig;
    this.load();
  }

  private setupFilterControls(): void {
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
        this.triggerLoadIfNeeded(false);
      });
    }

    this.refreshDependentDisabledStates();
  }

  private shouldDisableFilterAtStart(f: StoreProductCardsFilterControl): boolean {
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
    this.refreshDependentDisabledStates();

    const ctrls = Array.isArray(this.filterControls) ? this.filterControls : [];
    for (const f of ctrls) {
      const ro = f.remoteOptions;
      if (f.type !== 'select' || !ro?.dependsOn?.length) continue;
      if (!ro.dependsOn.includes(changedParam)) continue;

      if (f.disabledWhenMissingDeps && this.isMissingDeps(ro.dependsOn)) {
        this.getFilterCtrl(f.param).setValue(null, { emitEvent: false });
      }

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

  private loadRemoteOptionsFor(f: StoreProductCardsFilterControl): void {
    const ro = f.remoteOptions;
    if (!ro?.endpoint) return;

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

    if (ro.dependsOn?.length) {
      for (const dep of ro.dependsOn) {
        params[dep] = this.getFilterCtrl(dep).value;
      }
    }

    if (params['page'] === undefined) params['page'] = 1;
    if (params['limit'] === undefined) params['limit'] = 200;

    this.api.get<any>(ro.endpoint, params).subscribe({
      next: (res) => {
        const data = res?.data ?? res;

        let items: any[] = [];
        if (ro.itemsKey && Array.isArray(data?.[ro.itemsKey])) {
          items = data[ro.itemsKey];
        } else if (Array.isArray(data?.items)) {
          items = data.items;
        } else if (Array.isArray(data)) {
          items = data;
        } else {
          for (const [, v] of Object.entries(data ?? {})) {
            if (Array.isArray(v)) {
              items = v as any[];
              break;
            }
          }
        }

        const valueField = (ro.valueField ?? '_id').trim();
        const labelField = (ro.labelField ?? 'name').trim();

        const opts: StoreProductCardsFilterOption[] = (items ?? [])
          .map((it) => {
            const value = it?.[valueField] ?? it?.id;
            const label = it?.[labelField] ?? it?.label ?? it?.title ?? value;
            if (value === undefined || value === null) return null;
            return {
              value: value as any,
              label: String(label ?? '').trim() || String(value),
            };
          })
          .filter(Boolean) as StoreProductCardsFilterOption[];

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

  getSelectOptions(param: string, fallback?: StoreProductCardsFilterOption[]): StoreProductCardsFilterOption[] {
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
    this.lastLoadSignature = null;
    this.load();
    this.loadRemoteOptions();
    this.cdr.markForCheck();
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

    const uiFilters = this.uiFilterParams();

    this.resourceList
      .fetchPage<TItem>({
        endpoint: this.listEndpoint,
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

  onPage(event: any): void {
    this.pagination = { ...this.pagination, page: event.pageIndex + 1, limit: event.pageSize };
    this.triggerLoadIfNeeded(false);
  }

  onSortChange(sort: Sort): void {
    this.sort = sort;
    this.pagination = { ...this.pagination, page: 1 };
    this.triggerLoadIfNeeded(false);
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

      // Support mongoose Decimal128 sérialisé: { $numberDecimal: "299.99" }
      if (typeof v === 'object' && v && '$numberDecimal' in v) {
        return toNum((v as any).$numberDecimal);
      }

      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    const lastPriceFromHistory = (sd: any): number | null => {
      const hist = Array.isArray(sd?.priceHistory) ? sd.priceHistory : [];
      if (!hist.length) return null;

      const last = [...hist]
        .sort((a: any, b: any) => {
          const ta = new Date(a?.updatedAt ?? 0).getTime();
          const tb = new Date(b?.updatedAt ?? 0).getTime();
          return ta - tb;
        })
        .pop();
      return toNum(last?.price);
    };

    if (this.storeId) {
      const match = list.find((x: any) => String(x?.storeId ?? '') === String(this.storeId));
      // 1) dernier priceHistory, 2) currentPrice
      const ph = lastPriceFromHistory(match);
      if (ph !== null) return ph;

      const p = toNum(match?.currentPrice);
      if (p !== null) return p;
    }

    // fallback: dernier storeData qui a un prix (d'abord priceHistory, sinon currentPrice)
    for (let i = list.length - 1; i >= 0; i--) {
      const ph = lastPriceFromHistory(list[i]);
      if (ph !== null) return ph;

      const p = toNum(list[i]?.currentPrice);
      if (p !== null) return p;
    }

    return toNum((row as any)?.defaultPrice) ?? this.defaultPrice;
  }

  formatPrice(price: number | null): string {
    if (this.priceFormatter) return this.priceFormatter(price);
    if (price === null) return '—';
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    } catch {
      return `${price} €`;
    }
  }

  /**
   * Contexte consommé par priceTemplate.
   * - basePrice: prix “normal” (dernier storeData si dispo, sinon default)
   * - finalPrice: prix après promo (si promo), sinon basePrice
   * - promoPercent: réduction en % (0..100)
   */
  priceContextOf(row: TItem): StoreProductCardsPriceTemplateContext<TItem> {
    // base avec la logique interne existante
    let basePrice = this.priceOf(row);

    // promo “par défaut” (fallback)
    const rawPromo = (row as any)?.promoPercent ?? (row as any)?.promotionPercent ?? (row as any)?.discountPercent;
    const promoPercentFallback = Number(rawPromo);
    const hasPromoFallback = Number.isFinite(promoPercentFallback) && promoPercentFallback > 0;

    let finalPrice: number | null = basePrice;
    let hasPromo = hasPromoFallback;
    let promoPercent: number | null = hasPromoFallback ? promoPercentFallback : null;

    if (hasPromo && basePrice !== null) {
      finalPrice = Math.max(0, basePrice - (basePrice * (promoPercent ?? 0)) / 100);
    }

    // si la page fournit un resolver, on l’utilise
    if (this.priceResolver) {
      const resolved = this.priceResolver(row);
      if (resolved) {
        if (resolved.basePrice !== undefined) basePrice = resolved.basePrice ?? null;
        if (resolved.hasPromo !== undefined) hasPromo = !!resolved.hasPromo;
        if (resolved.promoPercent !== undefined) promoPercent = resolved.promoPercent ?? null;
        if (resolved.finalPrice !== undefined) {
          finalPrice = resolved.finalPrice ?? null;
        } else {
          // si pas de finalPrice mais promo active => on peut déduire
          if (hasPromo && basePrice !== null && promoPercent !== null) {
            finalPrice = Math.max(0, basePrice - (basePrice * promoPercent) / 100);
          } else {
            finalPrice = basePrice;
          }
        }
      }
    }

    return {
      $implicit: row,
      row,
      basePrice,
      finalPrice,
      hasPromo,
      promoPercent: hasPromo ? promoPercent : null,
      format: (p: number | null) => this.formatPrice(p),
    };
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

  isFavoriteOf(row: TItem): boolean {
    const v = (row as any)?.[this.favField];
    return !!v;
  }

  toggleFavorite(row: TItem, ev?: Event): void {
    ev?.stopPropagation?.();
    ev?.preventDefault?.();

    const next = !this.isFavoriteOf(row);

    // update optimiste local pour refléter l'UI
    try {
      (row as any)[this.favField] = next;
    } catch {
      // ignore
    }

    this.favoriteChange.emit({ row, isFavorite: next });
    this.cdr.markForCheck();
  }

  trackById = (_: number, row: TItem) => (row as any)?._id ?? (row as any)?.id ?? _;
}

export interface StoreProductCardsFilterOption {
  label: string;
  value: string | number | boolean;
}

export type StoreProductCardsFilterType = 'select' | 'number' | 'text';

export interface StoreProductCardsRemoteOptionsConfig {
  endpoint: string;
  itemsKey?: string | null;
  valueField?: string;
  labelField?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  dependsOn?: string[];
}

export interface StoreProductCardsFilterControl {
  label: string;
  param: string;
  type: StoreProductCardsFilterType;
  options?: StoreProductCardsFilterOption[];
  remoteOptions?: StoreProductCardsRemoteOptionsConfig;
  disabledWhenMissingDeps?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | null;
}

export interface StoreProductCardsPriceTemplateContext<TItem> {
  $implicit: TItem;
  row: TItem;
  basePrice: number | null;
  finalPrice: number | null;
  hasPromo: boolean;
  promoPercent: number | null;
  format: (price: number | null) => string;
}
