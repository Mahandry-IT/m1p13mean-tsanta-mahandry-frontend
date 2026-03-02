import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResourceListComponent, ResourceResolveConfig } from '../../../../shared/components/resource-list/resource-list.component';
import { TypeFormComponent } from '../type-form/type-form.component';

@Component({
  selector: 'app-type-list',
  templateUrl: './type-list.component.html',
  styleUrls: ['./type-list.component.scss'],
  standalone: false,
})
export class TypeListComponent {
  @ViewChild(ResourceListComponent) resourceList?: ResourceListComponent<any>;

  endpoint = '/types';

  columns = [
    { key: 'name', header: 'Nom' },
    { key: 'slug', header: 'Slug' },
    { key: 'categoryId', header: 'Catégorie' },
    { key: 'createdAt', header: 'Créé le' },
  ];

  resolves: ResourceResolveConfig[] = [
    { field: 'categoryId', endpoint: '/categories', labelField: 'name' },
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

    this.api.get<any>(`/types/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const type = res?.data ?? res?.type ?? res;
        this.dialog.open(TypeFormComponent, {
          data: { mode: 'info', type },
        });
      },
      error: (err) => this.toast.error(err?.message ?? 'Erreur lors du chargement'),
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/types/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const type = res?.data ?? res?.type ?? res;
        const ref = this.dialog.open(TypeFormComponent, {
          data: { mode: 'edit', type },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;

          this.api.patch<any>(`/types/${encodeURIComponent(id)}`, payload).subscribe({
            next: () => {
              this.toast.success('Type modifié');
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
        message: 'Supprimer ce type ? Cette action est irréversible.',
        danger: true,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      this.api.delete<any>(`/types/${encodeURIComponent(id)}`).subscribe({
        next: () => {
          this.toast.success('Type supprimé');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    const ref = this.dialog.open(TypeFormComponent, {
      data: { mode: 'create', type: {} },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;

      this.api.post<any>('/types', payload).subscribe({
        next: () => {
          this.toast.success('Type ajouté');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }
}

