import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StoreProductCardsComponent, StoreProductCardsFilterControl } from '../../../../shared/components/store-product-cards/store-product-cards.component';
import { MyProductsFormComponent } from '../my-products-form/my-products-form.component';

@Component({
  selector: 'app-my-products-page',
  templateUrl: './my-products-page.component.html',
  styleUrls: ['./my-products-page.component.scss'],
  standalone: false,
})
export class MyProductsPageComponent implements OnInit {
  @ViewChild(StoreProductCardsComponent) storeProductCards?: StoreProductCardsComponent<any>;

  // base endpoint pour actions
  endpoint = '/products';
  // endpoint de liste (produits de mes boutiques)
  listEndpoint = '/products/my-stores';

  stores: Array<{ id: string; name: string }> = [];
  selectedStoreId: string | null = null;

  productFilters: StoreProductCardsFilterControl[] = [
    {
      label: 'Catégorie',
      param: 'categoryId',
      type: 'select',
      remoteOptions: {
        endpoint: '/categories',
        itemsKey: 'items',
        valueField: '_id',
        labelField: 'name',
        params: { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' },
      },
    },
    {
      label: 'Type',
      param: 'typeId',
      type: 'select',
      remoteOptions: {
        endpoint: '/types',
        itemsKey: 'items',
        valueField: '_id',
        labelField: 'name',
        dependsOn: ['categoryId'],
        params: { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' },
      },
      disabledWhenMissingDeps: true,
    },
  ];

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadStores();
  }

  private getId(row: any): string {
    return String(row?._id ?? row?.id ?? '');
  }

  private normalizeCategories(payload: any): Array<{ categoryId: string; typeIds: string[] }> {
    const inCats = Array.isArray(payload?.categories) ? payload.categories : [];
    return inCats
      .map((c: any) => ({
        categoryId: String(c?.categoryId ?? '').trim(),
        typeIds: Array.isArray(c?.typeIds) ? c.typeIds.map((x: any) => String(x).trim()).filter(Boolean) : [],
      }))
      .filter((c: any) => !!c.categoryId);
  }

  private normalizeStoreData(payload: any): any[] {
    // Le form ne gère pas encore storeData => envoyer tableau vide par défaut
    return Array.isArray(payload?.storeData) ? payload.storeData : [];
  }

  private buildMultipartCategories(fd: FormData, categories: Array<{ categoryId: string; typeIds: string[] }>): void {
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      fd.append(`categories[${i}][categoryId]`, c.categoryId);
      for (let j = 0; j < (c.typeIds ?? []).length; j++) {
        fd.append(`categories[${i}][typeIds][${j}]`, c.typeIds[j]);
      }
    }
  }

  private cleanUpdatePayload(payload: any): { json: any; formData: FormData } {
    const categories = this.normalizeCategories(payload);
    const storeData = this.normalizeStoreData(payload);

    // JSON (quand pas de fichiers)
    const json: any = {};
    if (payload?.name !== undefined) json.name = String(payload.name ?? '');
    if (payload?.description !== undefined) json.description = String(payload.description ?? '');
    if (payload?.categories !== undefined) json.categories = categories;
    if (payload?.storeData !== undefined) json.storeData = storeData;

    // Multipart (quand fichiers)
    const fd = new FormData();
    if (payload?.name !== undefined) fd.append('name', String(payload.name ?? ''));
    if (payload?.description !== undefined) fd.append('description', String(payload.description ?? ''));

    // IMPORTANT: on n'envoie plus categories/storeData en JSON string (Joi attend un array)
    if (payload?.categories !== undefined) this.buildMultipartCategories(fd, categories);
    // storeData: si non géré, ne rien envoyer (default [])

    const files: File[] = Array.isArray(payload?.newImages) ? payload.newImages : [];
    for (const f of files) fd.append('images', f);

    return { json, formData: fd };
  }

  private cleanCreatePayload(payload: any): { json: any; formData: FormData } {
    const categories = this.normalizeCategories(payload);
    const storeData = this.normalizeStoreData(payload);

    const json: any = {
      name: String(payload?.name ?? '').trim(),
      description: payload?.description === undefined ? '' : String(payload.description ?? ''),
      categories,
      storeData,
    };

    const fd = new FormData();
    fd.append('name', json.name);
    fd.append('description', json.description);
    this.buildMultipartCategories(fd, categories);
    // storeData non géré => omis (default [])

    const files: File[] = Array.isArray(payload?.newImages) ? payload.newImages : [];
    for (const f of files) fd.append('images', f);

    return { json, formData: fd };
  }

  private loadStores(): void {
    this.api.get<any>('/stores/my').subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);

        this.stores = (arr ?? [])
          .map((s: any) => ({
            id: String(s?.id ?? s?._id ?? '').trim(),
            name: String(s?.name ?? '').trim(),
          }))
          .filter((s: any) => !!s.id);

        if (this.selectedStoreId && !this.stores.some((s) => s.id === this.selectedStoreId)) {
          this.selectedStoreId = null;
        }
      },
      error: (err: any) => this.toast.error(err?.message ?? 'Erreur lors du chargement des boutiques'),
    });
  }

  get listFilters(): Record<string, any> {
    return {
      ...(this.selectedStoreId ? { storeId: this.selectedStoreId } : {}),
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortDir: 'desc',
    };
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        this.dialog.open(MyProductsFormComponent, {
          width: '900px',
          maxWidth: '96vw',
          data: { mode: 'info', product },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        const ref = this.dialog.open(MyProductsFormComponent, {
          width: '900px',
          maxWidth: '96vw',
          data: { mode: 'edit', product },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          const { json, formData } = this.cleanUpdatePayload(payload);
          const hasFiles = Array.isArray(payload?.newImages) && payload.newImages.length > 0;

          const req$ = hasFiles
            ? this.api.patch<any>(`/products/${encodeURIComponent(id)}`, formData)
            : this.api.patch<any>(`/products/${encodeURIComponent(id)}`, json);

          req$.subscribe({
            next: () => {
              this.toast.success('Produit modifié');
              this.storeProductCards?.load();
            },
            error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la modification'),
          });
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onDelete(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Suppression',
        message: 'Supprimer ce produit ? Cette action est irréversible.',
        danger: true,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      this.api.delete<any>(`/products/${encodeURIComponent(id)}`).subscribe({
        next: () => {
          this.toast.success('Produit supprimé');
          this.storeProductCards?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    const ref = this.dialog.open(MyProductsFormComponent, {
      width: '900px',
      maxWidth: '96vw',
      data: { mode: 'create', product: {} },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;

      const hasFiles = Array.isArray(payload?.newImages) && payload.newImages.length > 0;
      const { json, formData } = this.cleanCreatePayload(payload);

      const req$ = hasFiles
        ? this.api.post<any>('/products', formData)
        : this.api.post<any>('/products', json);

      req$.subscribe({
        next: () => {
          this.toast.success('Produit ajouté');
          this.storeProductCards?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }

  /**
   * Resolver passé à app-store-product-cards pour calculer prix + promo côté TS.
   * Règles:
   * - Prix: dernier priceHistory si existe, sinon currentPrice, sinon null
   * - Promo: une promo active (isActive=true et date dans [startDate,endDate])
   *          => basePrice barré + finalPrice = basePrice - discount%
   */
  priceResolver = (row: any) => {
    const storeData = Array.isArray(row?.storeData) ? row.storeData : [];

    // Si une boutique est sélectionnée, on préfère celle-ci; sinon on prend la dernière entrée.
    const pickStoreData = () => {
      if (this.selectedStoreId) {
        const match = storeData.find((s: any) => String(s?.storeId) === String(this.selectedStoreId));
        if (match) return match;
      }
      return storeData.length ? storeData[storeData.length - 1] : null;
    };

    const sd = pickStoreData();

    const toNum = (v: any): number | null => {
      if (v === null || v === undefined || v === '') return null;

      // Support mongoose Decimal128 sérialisé: { $numberDecimal: "299.99" }
      if (typeof v === 'object' && v && '$numberDecimal' in v) {
        const raw = (v as any).$numberDecimal;
        return toNum(raw);
      }

      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    // 1) Prix: dernier historique, sinon currentPrice
    const hist = Array.isArray(sd?.priceHistory) ? sd.priceHistory : [];
    let basePrice: number | null = null;

    if (hist.length) {
      // dernier updatedAt (ou dernier élément si déjà trié)
      const last = [...hist]
        .sort((a: any, b: any) => {
          const ta = new Date(a?.updatedAt ?? 0).getTime();
          const tb = new Date(b?.updatedAt ?? 0).getTime();
          return ta - tb;
        })
        .pop();
      basePrice = toNum(last?.price);
    }

    if (basePrice === null) {
      basePrice = toNum(sd?.currentPrice);
    }

    // 2) Promo active
    const promos = Array.isArray(sd?.promotions) ? sd.promotions : [];
    const now = Date.now();

    const isActivePromo = (p: any) => {
      if (p?.isActive === false) return false;
      const start = new Date(p?.startDate ?? 0).getTime();
      const end = new Date(p?.endDate ?? 0).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
      return start <= now && now <= end;
    };

    const activePromo = promos.find(isActivePromo) ?? null;
    const promoPercent = toNum(activePromo?.discount);
    const hasPromo = promoPercent !== null && promoPercent > 0;

    let finalPrice: number | null = basePrice;
    if (hasPromo && basePrice !== null) {
      finalPrice = Math.max(0, basePrice - (basePrice * promoPercent) / 100);
    }

    return {
      basePrice,
      hasPromo,
      promoPercent: hasPromo ? promoPercent : null,
      finalPrice,
    };
  };
}
