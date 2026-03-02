import { Component, OnInit } from '@angular/core';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StoreProductCardsFilterControl } from '../../../../shared/components/store-product-cards/store-product-cards.component';

@Component({
  selector: 'app-my-products-page',
  templateUrl: './my-products-page.component.html',
  styleUrls: ['./my-products-page.component.scss'],
  standalone: false,
})
export class MyProductsPageComponent implements OnInit {
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
  ) {}

  ngOnInit(): void {
    this.loadStores();
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
