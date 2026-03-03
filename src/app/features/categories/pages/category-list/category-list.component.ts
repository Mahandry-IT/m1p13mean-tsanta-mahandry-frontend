import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResourceListComponent } from '../../../../shared/components/resource-list/resource-list.component';
import { CategoryFormComponent } from '../category-form/category-form.component';
import {formatDateTime} from '../../../../util/format.util';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: false,
})
export class CategoryListComponent {
  @ViewChild(ResourceListComponent) resourceList?: ResourceListComponent<any>;

  endpoint = '/categories';

  columns = [
    { key: 'name', header: 'Nom' },
    { key: 'slug', header: 'Slug' },
    {
      key: 'createdAt',
      header: 'Créé le',
      cell: (row: any) => formatDateTime(row?.createdAt),
    }
  ];

  constructor(
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
  ) {}

  private getId(row: any): string {
    return String(row?._id ?? row?.id ?? '');
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/categories/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const category = res?.data ?? res?.category ?? res;
        this.dialog.open(CategoryFormComponent, {
          data: { mode: 'info', category },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/categories/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const category = res?.data ?? res?.category ?? res;
        const ref = this.dialog.open(CategoryFormComponent, {
          data: { mode: 'edit', category },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          this.api.patch<any>(`/categories/${encodeURIComponent(id)}`, payload).subscribe({
            next: () => {
              this.toast.success('Catégorie modifiée');
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
        message: 'Supprimer cette catégorie ? Cette action est irréversible.',
        danger: true,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      this.api.delete<any>(`/categories/${encodeURIComponent(id)}`).subscribe({
        next: () => {
          this.toast.success('Catégorie supprimée');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    const ref = this.dialog.open(CategoryFormComponent, {
      data: { mode: 'create', category: {} },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;

      this.api.post<any>('/categories', payload).subscribe({
        next: () => {
          this.toast.success('Catégorie ajoutée');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }
}

