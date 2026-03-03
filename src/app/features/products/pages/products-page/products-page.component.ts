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

  onAdd(): void {
    const ref = this.dialog.open(ProductFormComponent, {
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
          this.resourceCards?.refresh();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }
}
