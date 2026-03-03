import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StoreProductCardsComponent } from '../../../../shared/components/store-product-cards/store-product-cards.component';
import { BuyProductsFormComponent } from '../../../buy-product/pages/buy-products-form/buy-products-form.component';

/**
 * NOTE: L'API /favorites/me renvoie seulement { favoriteId, productId, storeId }.
 * Pour pouvoir afficher les cartes produit, on s'appuie sur le backend pour enrichir
 * la réponse (ex: favorite.product) ou pour renvoyer directement des produits.
 * Si ce n'est pas encore le cas, on affiche au minimum productId.
 */
@Component({
  selector: 'app-favorites-page',
  templateUrl: './favorites-page.component.html',
  styleUrls: ['./favorites-page.component.scss'],
  standalone: false,
})
export class FavoritesPageComponent implements OnInit {
  @ViewChild(StoreProductCardsComponent) storeProductCards?: StoreProductCardsComponent<any>;

  endpoint = '/products';
  listEndpoint = '/favorites/me';

  /** cache produitId -> produit */
  private productById = new Map<string, any>();
  private loadingProductIds = new Set<string>();

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {}

  private getProductId(row: any): string {
    return String(row?.productId ?? row?._id ?? row?.id ?? '');
  }

  /** storeId du favori (la boutique où le produit est favori) */
  private getFavoriteStoreId(row: any): string {
    return String(row?.favoriteStoreId ?? row?.storeId ?? '');
  }

  private getFavoriteId(row: any): string {
    return String(row?.favoriteId ?? row?._id ?? row?.id ?? '');
  }

  /**
   * Transforme les items "favorite" en items "produit enrichi".
   * IMPORTANT: on n'écrase pas les champs du produit. On met storeId du favori dans `favoriteStoreId`.
   */
  itemsMapper = async (items: any[]): Promise<any[]> => {
    const list = Array.isArray(items) ? items : [];

    const toLoad: string[] = [];
    for (const f of list) {
      const pid = this.getProductId(f);
      if (!pid) continue;
      if (this.productById.has(pid)) continue;
      if (this.loadingProductIds.has(pid)) continue;
      this.loadingProductIds.add(pid);
      toLoad.push(pid);
    }

    await Promise.all(
      toLoad.map(async (pid) => {
        try {
          const res = await firstValueFrom(this.api.get<any>(`/products/${encodeURIComponent(pid)}`));
          const product = res?.data ?? res?.product ?? res;
          this.productById.set(pid, product);
        } catch {
          // ignore
        } finally {
          this.loadingProductIds.delete(pid);
        }
      }),
    );

    return list.map((f) => {
      const pid = this.getProductId(f);
      const product = pid ? this.productById.get(pid) : null;
      const base = product && typeof product === 'object' ? product : {};

      return {
        ...base,
        _id: base?._id ?? pid,
        id: base?.id ?? pid,

        // métadonnées favori
        favoriteId: this.getFavoriteId(f),
        productId: pid,
        favoriteStoreId: String(f?.storeId ?? f?.favoriteStoreId ?? '').trim(),
        createdAt: f?.createdAt,

        // champs attendus par StoreProductCards
        name: String(base?.name ?? pid ?? 'Produit'),
        images: Array.isArray(base?.images) ? base.images : [],
        storeData: Array.isArray(base?.storeData) ? base.storeData : [],
        isFavorite: true,
      };
    });
  };

  /** Resolver prix: depuis storeData du produit, mais en utilisant la boutique du favori */
  priceResolver = (row: any) => {
    const storeId = this.getFavoriteStoreId(row);

    const storeData = Array.isArray(row?.storeData) ? row.storeData : [];
    const sd = storeId
      ? storeData.find((s: any) => String(s?.storeId) === String(storeId))
      : (storeData[storeData.length - 1] ?? null);

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
        .sort((a: any, b: any) => new Date(a?.updatedAt ?? 0).getTime() - new Date(b?.updatedAt ?? 0).getTime())
        .pop();
      basePrice = toNum(last?.price);
    }

    if (basePrice === null) basePrice = toNum(sd?.currentPrice);
    if (basePrice === null) basePrice = toNum(row?.defaultPrice);

    return { basePrice, hasPromo: false, promoPercent: null, finalPrice: basePrice };
  };

  onInfo(row: any): void {
    const productId = this.getProductId(row);
    const storeId = this.getFavoriteStoreId(row) || null;
    if (!productId) return;

    // ← Toujours refetch pour avoir les données fraîches
    this.api.get<any>(`/products/${encodeURIComponent(productId)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        this.dialog.open(BuyProductsFormComponent, {
          width: '900px', maxWidth: '96vw',
          data: { mode: 'info', product, storeId },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onFavoriteChange(ev: { row: any; isFavorite: boolean }): void {
    const favoriteId = this.getFavoriteId(ev?.row);
    const productId = this.getProductId(ev?.row);
    const storeId = this.getFavoriteStoreId(ev?.row);

    if (ev.isFavorite) {
      if (!productId || !storeId) {
        this.toast.error('productId et storeId requis pour ajouter un favori.');
        return;
      }

      this.api.post<any>('/favorites/me', { productId, storeId }).subscribe({
        next: () => {
          this.toast.success('Ajouté aux favoris');
          this.storeProductCards?.load();
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'Erreur lors de l\'ajout du favori');
          this.storeProductCards?.load();
        },
      });
      return;
    }

    if (!favoriteId) {
      this.toast.error('favoriteId manquant pour supprimer le favori.');
      return;
    }

    this.api.delete<any>(`/favorites/me/${encodeURIComponent(favoriteId)}`).subscribe({
      next: () => {
        this.toast.success('Retiré des favoris');
        this.storeProductCards?.load();
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erreur lors de la suppression du favori');
        this.storeProductCards?.load();
      },
    });
  }
}
