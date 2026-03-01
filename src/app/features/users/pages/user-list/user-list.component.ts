import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormComponent } from '../user-form/user-form.component';
import { ResourceListComponent, ResourceResolveConfig } from '../../../../shared/components/resource-list/resource-list.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false,
})
export class UserListComponent {
  @ViewChild(ResourceListComponent) resourceList?: ResourceListComponent<any>;

  columns = [
    { key: 'username', header: 'Nom' },
    { key: 'email', header: 'Email' },
    { key: 'roleId', header: 'Rôle' },
  ];

  resolves: ResourceResolveConfig[] = [
    { field: 'roleId', endpoint: '/roles/list', labelField: 'value' },
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

    this.api.get<any>(`/users/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const user = res?.data ?? res?.user ?? res;
        this.dialog.open(UserFormComponent, {
          data: { mode: 'info', user, resolves: this.resolves },
        });
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erreur lors du chargement');
      },
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/users/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const user = res?.data ?? res?.user ?? res;
        const ref = this.dialog.open(UserFormComponent, {
          data: { mode: 'edit', user, resolves: this.resolves },
        });

        ref.afterClosed().subscribe((payload) => {
          if (!payload) return;
          this.api.put<any>(`/users/${encodeURIComponent(id)}`, payload).subscribe({
            next: () => {
              this.toast.success('Utilisateur modifié');
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
        message: 'Supprimer cet utilisateur ? Cette action est irréversible.',
        danger: true,
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.delete<any>(`/users/${encodeURIComponent(id)}`).subscribe({
        next: () => {
          this.toast.success('Utilisateur supprimé');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la suppression'),
      });
    });
  }

  onAdd(): void {
    const ref = this.dialog.open(UserFormComponent, {
      data: { mode: 'create', user: {}, resolves: this.resolves },
    });

    ref.afterClosed().subscribe((payload) => {
      if (!payload) return;
      this.api.post<any>(`/users/`, payload).subscribe({
        next: () => {
          this.toast.success('Utilisateur ajouté');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la création'),
      });
    });
  }
}
