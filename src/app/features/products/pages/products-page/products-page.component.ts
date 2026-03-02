import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResourceCardsFilterControl, ResourceCardsComponent } from '../../../../shared/components/resource-cards/resource-cards.component';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-products-page',
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProductsPageComponent {
  @ViewChild(ResourceCardsComponent) resourceCards?: ResourceCardsComponent<any>;

  // endpoint backend: /api/products
  endpoint = '/products';

  productFilters: ResourceCardsFilterControl[] = [
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
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
  ) {}

  private getId(row: any): string {
    return String(row?._id ?? row?.id ?? '');
  }

  private buildProductFormData(payload: any): FormData {
    const fd = new FormData();

    if (payload?.name !== undefined) fd.append('name', String(payload.name ?? ''));
    if (payload?.description !== undefined) fd.append('description', String(payload.description ?? ''));

    // relations: categories = JSON string
    if (payload?.categories !== undefined) {
      fd.append('categories', JSON.stringify(payload.categories ?? []));
    }

    const files: File[] = Array.isArray(payload?.newImages) ? payload.newImages : [];
    for (const f of files) {
      fd.append('images', f);
    }

    return fd;
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        this.dialog.open(ProductFormComponent, {
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
        const ref = this.dialog.open(ProductFormComponent, {
          data: { mode: 'edit', product },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          const fd = this.buildProductFormData(payload);
          this.api.patch<any>(`/products/${encodeURIComponent(id)}`, fd).subscribe({
            next: () => {
              this.toast.success('Produit modifié');
              this.resourceCards?.refresh();
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
          this.resourceCards?.refresh();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }
}
