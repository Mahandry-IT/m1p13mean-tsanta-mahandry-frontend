import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StoreProductCardsComponent, StoreProductCardsFilterControl } from '../../../../shared/components/store-product-cards/store-product-cards.component';
import { BuyProductsFormComponent } from '../buy-products-form/buy-products-form.component';

@Component({
  selector: 'app-buy-products-page',
  templateUrl: './buy-products-page.component.html',
  styleUrls: ['./buy-products-page.component.scss'],
  standalone: false,
})
export class BuyProductsPageComponent implements OnInit {
  @ViewChild(StoreProductCardsComponent) storeProductCards?: StoreProductCardsComponent<any>;

  endpoint = '/products';
  // pour l'achat: on conserve le même flux que my-products (produits des boutiques)
  listEndpoint = '/products/buy-product';

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

  /**
   * Cache local pour pouvoir supprimer un favori sans que le backend ne renvoie automatiquement favoriteId dans /products/buy-product.
   * Clé: `${productId}:${storeId}` => favoriteId
   */
  private favoriteIdByKey = new Map<string, string>();

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadStores();
    this.loadMyFavorites();
  }

  private getId(row: any): string {
    return String(row?._id ?? row?.id ?? '');
  }

  private loadStores(): void {
    this.api.get<any>('/stores/list').subscribe({
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

        // Si des items sont déjà chargés, recalculer l'état favori en fonction du store sélectionné
        this.markFavoritesOnCurrentItems();
      },
      error: (err: any) => this.toast.error(err?.message ?? 'Erreur lors du chargement des boutiques'),
    });
  }

  private markFavoritesOnCurrentItems(): void {
    const comp = this.storeProductCards;
    if (!comp) return;

    const items: any[] = Array.isArray((comp as any).items) ? (comp as any).items : [];
    if (!items.length) return;

    for (const row of items) {
      const pid = String(row?._id ?? row?.id ?? '').trim();
      if (!pid) continue;

      const sid = String(this.selectedStoreId ?? row?.storeId ?? '').trim();
      if (!sid) continue;

      const isFav = this.favoriteIdByKey.has(this.favKey(pid, sid));
      try {
        (row as any).isFavorite = isFav;
      } catch {
        // ignore
      }
    }

    // forcer un refresh UI (OnPush dans le composant enfants)
    try {
      (comp as any).cdr?.markForCheck?.();
    } catch {
      // ignore
    }
  }

  /**
   * Hook appelé par StoreProductCards à chaque chargement de page (refresh, pagination, filtre, etc.).
   * On y projette `isFavorite` sur les rows en fonction du cache `/favorites/me`.
   */
  itemsMapper = (items: any[]): any[] => {
    const list = Array.isArray(items) ? items : [];
    return list.map((row) => {
      const pid = String(row?._id ?? row?.id ?? '').trim();
      const sid = String(this.selectedStoreId ?? row?.storeId ?? '').trim();
      const isFav = !!pid && !!sid && this.favoriteIdByKey.has(this.favKey(pid, sid));
      // On évite de muter l'objet original (OnPush)
      return { ...row, isFavorite: isFav };
    });
  };

  private loadMyFavorites(): void {
    this.api.get<any>('/favorites/me').subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const favs = Array.isArray(data?.favorites) ? data.favorites : (Array.isArray(data) ? data : []);

        this.favoriteIdByKey.clear();
        for (const f of favs) {
          const pid = String(f?.productId ?? '').trim();
          const sid = String(f?.storeId ?? '').trim();
          const fid = String(f?.favoriteId ?? f?._id ?? f?.id ?? '').trim();
          if (pid && sid && fid) this.favoriteIdByKey.set(this.favKey(pid, sid), fid);
        }

        // Recharger la liste pour que itemsMapper recalcule isFavorite (cas: favoris chargés après produits)
        this.storeProductCards?.load();
      },
      error: () => {
        // silencieux
      },
    });
  }

  private favKey(productId: string, storeId: string): string {
    return `${String(productId)}:${String(storeId)}`;
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

  /** Même resolver que MyProductsPage: prix + promo depuis storeData */
  priceResolver = (row: any) => {
    const storeData = Array.isArray(row?.storeData) ? row.storeData : [];

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
      if (typeof v === 'object' && v && '$numberDecimal' in v) return toNum((v as any).$numberDecimal);
      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    const hist = Array.isArray(sd?.priceHistory) ? sd.priceHistory : [];
    let basePrice: number | null = null;

    if (hist.length) {
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

    // promo active (même règle que corrigée)
    const promos = Array.isArray(sd?.promotions) ? sd.promotions : [];
    const isActivePromo = (p: any) => {
      if (p?.isActive === false) return false;
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

    return { basePrice, hasPromo, promoPercent: hasPromo ? promoPercent : null, finalPrice };
  };

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        this.dialog.open(BuyProductsFormComponent, {
          width: '900px',
          maxWidth: '96vw',
          data: { mode: 'info', product, storeId: this.selectedStoreId ?? null },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onFavoriteChange(ev: { row: any; isFavorite: boolean }): void {
    const productId = String(ev?.row?._id ?? ev?.row?.id ?? '').trim();
    const storeId = String(this.selectedStoreId ?? ev?.row?.storeId ?? '').trim();

    if (!productId || !storeId) {
      this.toast.error('Choix du magasin et du produit requis pour gérer les favoris.');
      // rollback UI (le composant a déjà togglé)
      try { (ev.row as any).isFavorite = !ev.isFavorite; } catch {}
      return;
    }

    // AJOUT
    if (ev.isFavorite) {
      this.api.post<any>('/favorites/me', { productId, storeId }).subscribe({
        next: (res: any) => {
          const fid = String(res?.data?.favorite?.favoriteId ?? res?.data?.favorite?._id ?? res?.data?.favorite?.id ?? '').trim();
          if (fid) this.favoriteIdByKey.set(this.favKey(productId, storeId), fid);
          this.toast.success('Ajouté aux favoris');
          this.markFavoritesOnCurrentItems();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'Erreur lors de l\'ajout du favori');
          // rollback
          try { (ev.row as any).isFavorite = false; } catch {}
        },
      });
      return;
    }

    // SUPPRESSION
    const favoriteId = this.favoriteIdByKey.get(this.favKey(productId, storeId)) ?? '';
    if (!favoriteId) {
      this.toast.error('Impossible de supprimer: favoriteId introuvable.');
      // rollback
      try { (ev.row as any).isFavorite = true; } catch {}
      return;
    }

    this.api.delete<any>(`/favorites/me/${encodeURIComponent(favoriteId)}`).subscribe({
      next: () => {
        this.favoriteIdByKey.delete(this.favKey(productId, storeId));
        this.toast.success('Retiré des favoris');
        this.markFavoritesOnCurrentItems();
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erreur lors de la suppression du favori');
        // rollback
        try { (ev.row as any).isFavorite = true; } catch {}
      },
    });
  }
}
