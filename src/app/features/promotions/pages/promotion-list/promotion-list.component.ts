import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ResourceListComponent,
  ResourceResolveConfig
} from '../../../../shared/components/resource-list/resource-list.component';
import { PromotionFormComponent } from '../promotion-form/promotion-form.component';

@Component({
  selector: 'app-promotion-list',
  templateUrl: './promotion-list.component.html',
  styleUrls: ['./promotion-list.component.scss'],
  standalone: false,
})
export class PromotionListComponent implements OnInit {
  @ViewChild(ResourceListComponent) resourceList?: ResourceListComponent<any>;

  /** liste par boutique */
  endpoint = '/promotions/by-store';

  stores: Array<{ id: string; name: string }> = [];

  // UI state (ngModel)
  selectedStoreId: string | null = null;

  columns = [
    { key: 'productId', header: 'Produit' },
    { key: 'storeId', header: 'Boutique' },
    {
      key: 'discount',
      header: 'Remise (%)',
      cell: (row: any) => {
        const n = this.toNum(row?.discount);
        return n === null ? '' : String(n);
      },
    },
    { key: 'description', header: 'Description' },
    { key: 'isActive', header: 'Active' },
  ];

  resolves: ResourceResolveConfig[] = [
    { field: 'storeId', endpoint: '/stores/list', labelField: 'name' },
    { field: 'productId', endpoint: '/products/list', labelField: 'name' }
  ];

  listFilters: any = {};

  constructor(
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
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

        // auto-sélection si une seule boutique
        if (!this.selectedStoreId && this.stores.length === 1) {
          this.selectedStoreId = this.stores[0].id;
          this.reload();
        }
      },
      error: (err: any) => this.toast.error(err?.message ?? 'Erreur lors du chargement des boutiques'),
    });
  }

  private getId(row: any): string {
    return String(row?.promotionId ?? row?._id ?? row?.id ?? '');
  }

  private toNum(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'object' && v && '$numberDecimal' in v) return this.toNum((v as any).$numberDecimal);
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  reload(): void {
    if (!this.selectedStoreId) {
      this.listFilters = {};
      return;
    }

    this.listFilters = {
      storeId: this.selectedStoreId,
    };
  }

  onStoreChange(): void {
    this.reload();
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    // backend attend aussi storeId/productId en query
    this.api.get<any>(`/promotions/${encodeURIComponent(id)}`, this.listFilters).subscribe({
      next: (res) => {
        const promotion = res?.data ?? res?.promotion ?? res;
        this.dialog.open(PromotionFormComponent, {
          data: { mode: 'info', promotion },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/promotions/${encodeURIComponent(id)}`, this.listFilters).subscribe({
      next: (res) => {
        const promotion = res?.data ?? res?.promotion ?? res;
        const ref = this.dialog.open(PromotionFormComponent, {
          data: { mode: 'edit', promotion },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          this.api.patch<any>(`/promotions/${encodeURIComponent(id)}`, payload).subscribe({
            next: () => {
              this.toast.success('Promotion modifiée');
              this.resourceList?.load();
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
        message: 'Supprimer cette promotion ? Cette action est irréversible.',
        danger: true,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      this.api.delete<any>(`/promotions/${encodeURIComponent(id)}`).subscribe({
        next: () => {
          this.toast.success('Promotion supprimée');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    if (!this.selectedStoreId) {
      this.toast.error('Sélectionnez une boutique avant d\'ajouter une promotion');
      return;
    }

    const ref = this.dialog.open(PromotionFormComponent, {
      data: { mode: 'create', promotion: { storeId: this.selectedStoreId } },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;

      this.api.post<any>('/promotions', payload).subscribe({
        next: () => {
          this.toast.success('Promotion ajoutée');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }
}

