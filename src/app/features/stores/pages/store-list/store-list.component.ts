import { Component, ViewChild, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { AuthService, UserResponse } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StoreService } from '../../../../core/services/store.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ResourceListComponent, ResourceResolveConfig, CustomAction } from '../../../../shared/components/resource-list/resource-list.component';
import { StoreFormComponent } from '../store-form/store-form.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store-list',
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.scss'],
  standalone: false,
})
export class StoreListComponent implements OnInit {
  @ViewChild(ResourceListComponent) resourceList?: ResourceListComponent<any>;

  // Map des rôles (depuis data.json)
  private readonly ROLE_IDS = {
    ADMIN: '6990aefb7053d5bc9001e424',
    MANAGER: '6990aefb7053d5bc9001e425',
    CUSTOMER: '6990aefb7053d5bc9001e427',
  };

  isAdmin = false;
  endpoint = '/stores/my';  // Par défaut Manager/Customer
  
  columns = [
    { key: 'name', header: 'Nom' },
    { key: 'address', header: 'Adresse' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Statut' },
  ];

  resolves: ResourceResolveConfig[] = [];
  customActions: CustomAction[] = [];

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly storeService: StoreService,
    private readonly dialog: MatDialog,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}

ngOnInit(): void {
  const user = this.auth.getUser<UserResponse>();
  const roleId = user?.roleId;

  const currentPath = this.router.url; // récupère l'URL actuelle
  console.log('Current URL:', currentPath);

  // Définir si Admin ou Manager selon l'URL et le rôle
  if (currentPath.startsWith('/admin')) {
    this.isAdmin = true;
    this.endpoint = '/stores';        // Admin voit toutes les boutiques
    this.customActions = [
      {
        label: 'Activer',
        icon: 'check_circle',
        callback: (row: any) => this.onActivate(row),
        disabled: (row: any) => row.status === 'active' || row.status === 'rejected',
      },
      {
        label: 'Désactiver',
        icon: 'cancel',
        callback: (row: any) => this.onDeactivate(row),
        disabled: (row: any) => row.status !== 'active',
      },
      {
        label: 'Rejeter',
        icon: 'block',
        callback: (row: any) => this.onReject(row),
        disabled: (row: any) => row.status !== 'pending', // seulement pending
      },
    ];
  } else if (currentPath.startsWith('/manager')) {
    this.isAdmin = false;
    this.endpoint = '/stores/my';     // Manager voit ses boutiques
    this.customActions = [
      {
        label: 'Modifier',
        icon: 'edit',
        callback: (row: any) => this.onEdit(row),
      },
    ];
  } else {
    // Cas fallback
    this.isAdmin = false;
    this.endpoint = '/stores/my';
    this.customActions = [];
  }

  console.log('Endpoint utilisé:', this.endpoint);
}


  private getId(row: any): string {
    return String(row?._id ?? row?.id ?? '');
  }

  onInfo(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/stores/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const store = res?.data ?? res;
        this.dialog.open(StoreFormComponent, {
          data: { mode: 'info', store },
          width: '600px',
        });
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erreur lors du chargement des détails');
      },
    });
  }

  onEdit(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    this.api.get<any>(`/stores/${encodeURIComponent(id)}`).subscribe({
      next: (res) => {
        const store = res?.data ?? res;
        const ref = this.dialog.open(StoreFormComponent, {
          data: { mode: 'edit', store },
          width: '600px',
        });

        ref.afterClosed().subscribe((formData) => {
          if (!formData) return;
          
          // Appeler PUT /api/stores/:id
          this.api.put<any>(`/stores/${encodeURIComponent(id)}`, formData).subscribe({
            next: () => {
              this.toast.success('Boutique modifiée avec succès');
              this.resourceList?.load();
            },
            error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la modification'),
          });
        });
      },
      error: (err) => {
        this.toast.error(err?.message ?? 'Erreur lors du chargement');
      },
    });
  }

  onActivate(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activation',
        message: `Voulez-vous activer la boutique "${row.name}" ?`,
        confirmText: 'Activer',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.storeService.activate(id).subscribe({
        next: () => {
          this.toast.success('Boutique activée avec succès');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de l\'activation'),
      });
    });
  }

  onDeactivate(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Désactivation',
        message: `Voulez-vous désactiver la boutique "${row.name}" ?`,
        confirmText: 'Désactiver',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.storeService.deactivate(id).subscribe({
        next: () => {
          this.toast.success('Boutique désactivée avec succès');
          this.resourceList?.load();
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors de la désactivation'),
      });
    });
  }

  onReject(row: any): void {
    const id = this.getId(row);
    if (!id) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Rejeter la boutique',
        message: `Voulez-vous rejeter la boutique "${row.name}" ?`,
        confirmText: 'Rejeter',
        cancelText: 'Annuler',
      },
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;

      this.storeService.reject(id).subscribe({
        next: () => {
          this.toast.success('Boutique rejetée avec succès');
          this.resourceList?.load(); // recharge la liste
        },
        error: (err) => this.toast.error(err?.message ?? 'Erreur lors du rejet'),
      });
    });
  }

}