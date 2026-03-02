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

  private cleanUpdatePayload(payload: any): { json: any; formData: FormData } {
    const json: any = {};

    if (payload?.name !== undefined) json.name = String(payload.name ?? '');
    if (payload?.description !== undefined) json.description = String(payload.description ?? '');

    if (payload?.categories !== undefined) {
      // IMPORTANT: le backend attend un tableau sur `categories`
      json.categories = Array.isArray(payload.categories) ? payload.categories : [];
    }

    const fd = new FormData();
    for (const [k, v] of Object.entries(json)) {
      // FormData ne supporte pas les objets -> stringify pour `categories`
      if (k === 'categories') {
        fd.append('categories', JSON.stringify(v));
      } else {
        fd.append(k, String(v ?? ''));
      }
    }

    const files: File[] = Array.isArray(payload?.newImages) ? payload.newImages : [];
    for (const f of files) fd.append('images', f);

    return { json, formData: fd };
  }

  private buildProductFormData(payload: any): FormData {
    // compat: conserver pour create/ancien code
    return this.cleanUpdatePayload(payload).formData;
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/products/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const product = res?.data ?? res?.product ?? res;
        this.dialog.open(ProductFormComponent, {
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
        const ref = this.dialog.open(ProductFormComponent, {
          width: '900px',
          maxWidth: '96vw',
          data: { mode: 'edit', product },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          const { json, formData } = this.cleanUpdatePayload(payload);
          const hasFiles = Array.isArray(payload?.newImages) && payload.newImages.length > 0;

          // Si pas d'images à uploader -> PATCH JSON (categories en array) => correspond exactement au Joi
          const req$ = hasFiles
            ? this.api.patch<any>(`/products/${encodeURIComponent(id)}`, formData)
            : this.api.patch<any>(`/products/${encodeURIComponent(id)}`, json);

          req$.subscribe({
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
