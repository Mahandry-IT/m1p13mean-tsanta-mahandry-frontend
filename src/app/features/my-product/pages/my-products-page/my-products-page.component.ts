import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StoreProductCardsComponent, StoreProductCardsFilterControl } from '../../../../shared/components/store-product-cards/store-product-cards.component';
import { MyProductsFormComponent } from '../my-products-form/my-products-form.component';
import { MyProductsAddDialogComponent } from '../my-products-add-dialog/my-products-add-dialog.component';

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

        const arr =
          (Array.isArray(data) ? data : null) ??
          (Array.isArray(data?.stores) ? data.stores : null) ??
          (Array.isArray(data?.items) ? data.items : null) ??
          [];

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

  private toNum(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'object' && v && '$numberDecimal' in v) return this.toNum((v as any).$numberDecimal);
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private ensureStoreDataWithPriceHistory(product: any, storeId: string, price: number): any[] {
    const storeData = Array.isArray(product?.storeData) ? [...product.storeData] : [];
    const idx = storeData.findIndex((sd: any) => String(sd?.storeId ?? '') === String(storeId));

    const entry = idx >= 0 ? { ...(storeData[idx] ?? {}) } : { storeId };
    const hist = Array.isArray(entry?.priceHistory) ? [...entry.priceHistory] : [];

    hist.push({
      price,
      updatedAt: new Date().toISOString(),
    });

    entry.currentPrice = price;
    entry.priceHistory = hist;
    if (idx >= 0) storeData[idx] = entry;
    else storeData.push(entry);

    return storeData;
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
          data: { mode: 'info', product, storeId: this.selectedStoreId ?? null },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    if (!this.selectedStoreId) {
      this.toast.error('Sélectionnez une boutique avant de modifier le prix.');
      return;
    }

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        const ref = this.dialog.open(MyProductsFormComponent, {
          width: '900px',
          maxWidth: '96vw',
          data: { mode: 'edit', product, storeId: this.selectedStoreId ?? null },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          // 1) update info produit (name/desc/cats/images)
          const { json, formData } = this.cleanUpdatePayload(payload);
          const hasFiles = Array.isArray(payload?.newImages) && payload.newImages.length > 0;

          // 2) si un nouveau prix a été saisi => on ajoute une entrée priceHistory dans storeData
          const p = this.toNum(payload?.newPrice);
          if (p !== null) {
            json.storeData = this.ensureStoreDataWithPriceHistory(product, String(this.selectedStoreId), p);
          }

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

      if (!this.selectedStoreId) {
        this.toast.error('Sélectionnez une boutique avant de supprimer le produit.');
        return;
      }

      this.api.delete<any>(`/products/my-stores/${encodeURIComponent(id)}/${encodeURIComponent(this.selectedStoreId)}`).subscribe({
        next: () => {
          this.toast.success('Produit supprimé');
          this.storeProductCards?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    // on impose un storeId sélectionné pour l'ajout (car storeData.storeId requis)
    if (!this.selectedStoreId) {
      this.toast.error('Sélectionnez une boutique avant d\'ajouter un produit.');
      return;
    }

    const ref = this.dialog.open(MyProductsAddDialogComponent, {
      maxWidth: '96vw',
      data: { storeId: this.selectedStoreId },
    });

    ref.afterClosed().subscribe((choice) => {
      if (!choice) return;

      // Mode 1: utiliser produit existant -> ajouter entrée storeData.priceHistory
      if (choice.mode === 'existing') {
        const productId = String(choice.productId ?? '').trim();
        const price = this.toNum(choice.price);
        if (!productId || price === null) {
          this.toast.error('Produit et prix requis');
          return;
        }

        // charger le produit, puis patch storeData
        this.api.get<any>(`/products/${encodeURIComponent(productId)}`).subscribe({
          next: (res) => {
            const product = res?.data ?? res?.product ?? res;
            const storeData = this.ensureStoreDataWithPriceHistory(product, String(this.selectedStoreId), price);

            this.api.patch<any>(`/products/${encodeURIComponent(productId)}`, { storeData }).subscribe({
              next: () => {
                this.toast.success('Produit associé à la boutique');
                this.storeProductCards?.load();
              },
              error: (err) => this.toast.error(err?.message ?? 'Erreur lors de l\'association'),
            });
          },
          error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
        });

        return;
      }

      // Mode 2: créer nouveau produit -> on ouvre le form complet, puis POST /products
      const defaultPrice = this.toNum(choice.defaultPrice);
      if (defaultPrice === null) {
        this.toast.error('Prix par défaut requis');
        return;
      }

      const ref2 = this.dialog.open(MyProductsFormComponent, {
        width: '900px',
        maxWidth: '96vw',
        data: { mode: 'create', product: {}, storeId: this.selectedStoreId },
      });

      ref2.afterClosed().subscribe((payload) => {
        if (!payload) return;

        const hasFiles = Array.isArray(payload?.newImages) && payload.newImages.length > 0;
        const { json, formData } = this.cleanCreatePayload(payload);

        // prix par défaut du nouveau produit
        json.defaultPrice = defaultPrice;

        // créer storeData pour la boutique sélectionnée (avec currentPrice et 1 entrée d'historique)
        json.storeData = [
          {
            storeId: String(this.selectedStoreId),
            currentPrice: defaultPrice,
            priceHistory: [{ price: defaultPrice, updatedAt: new Date().toISOString() }],
            promotions: [],
            stockMovements: [],
          },
        ];

        if (hasFiles) {
          // on complète le FormData existant (qui contient déjà name/description/categories/images)
          formData.append('defaultPrice', String(defaultPrice));
          this.appendStoreDataToFormData(formData, json.storeData);

          // IMPORTANT: cleanCreatePayload a omis storeData; on vient de l’ajouter.
          this.api.post<any>('/products', formData).subscribe({
            next: () => {
              this.toast.success('Produit ajouté');
              this.storeProductCards?.load();
            },
            error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
          });
          return;
        }

        // JSON
        this.api.post<any>('/products', json).subscribe({
          next: () => {
            this.toast.success('Produit ajouté');
            this.storeProductCards?.load();
          },
          error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
        });
      });
    });
  }

  private appendStoreDataToFormData(fd: FormData, storeData: any[]): void {
    const list = Array.isArray(storeData) ? storeData : [];

    for (let i = 0; i < list.length; i++) {
      const sd = list[i] ?? {};
      if (sd.storeId != null) fd.append(`storeData[${i}][storeId]`, String(sd.storeId));
      if (sd.currentPrice != null) fd.append(`storeData[${i}][currentPrice]`, String(sd.currentPrice));

      const hist = Array.isArray(sd.priceHistory) ? sd.priceHistory : [];
      for (let j = 0; j < hist.length; j++) {
        const h = hist[j] ?? {};
        if (h.price != null) fd.append(`storeData[${i}][priceHistory][${j}][price]`, String(h.price));
        if (h.updatedAt != null) fd.append(`storeData[${i}][priceHistory][${j}][updatedAt]`, String(h.updatedAt));
      }

      const promos = Array.isArray(sd.promotions) ? sd.promotions : [];
      for (let j = 0; j < promos.length; j++) {
        fd.append(`storeData[${i}][promotions][${j}]`, JSON.stringify(promos[j]));
      }

      const moves = Array.isArray(sd.stockMovements) ? sd.stockMovements : [];
      for (let j = 0; j < moves.length; j++) {
        fd.append(`storeData[${i}][stockMovements][${j}]`, JSON.stringify(moves[j]));
      }
    }
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
      // si explicitement false => inactive
      if (p?.isActive === false) return false;

      // Si isActive est true et que les dates sont invalides/absentes, on considère active.
      const startRaw = p?.startDate;
      const endRaw = p?.endDate;
      const start = startRaw ? new Date(startRaw).getTime() : NaN;
      const end = endRaw ? new Date(endRaw).getTime() : NaN;

      const hasValidWindow = Number.isFinite(start) && Number.isFinite(end);
      if (!hasValidWindow) return p?.isActive !== false;

      const now = Date.now();
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
