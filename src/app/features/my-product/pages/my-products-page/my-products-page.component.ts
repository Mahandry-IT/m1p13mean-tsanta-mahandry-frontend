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
}
