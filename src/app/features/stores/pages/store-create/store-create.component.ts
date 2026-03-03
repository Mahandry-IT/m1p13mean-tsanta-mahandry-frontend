import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { StoreService } from '../../../../core/services/store.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StoreFormComponent } from '../store-form/store-form.component';

@Component({
  selector: 'app-store-create',
  templateUrl: './store-create.component.html',
  styleUrls: ['./store-create.component.scss'],
  standalone: false,
})
export class StoreCreateComponent {
  constructor(
    private readonly dialog: MatDialog,
    private readonly storeService: StoreService,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {
    this.openCreateDialog();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(StoreFormComponent, {
      data: { mode: 'create' },
      width: '600px',
      disableClose: true,  // Empêcher de fermer en cliquant à l'extérieur
    });

    ref.afterClosed().subscribe((formData) => {
      if (!formData) {
        // Utilisateur a annulé, retourner à la liste
        this.router.navigate(['manager/stores']);
        return;
      }

      this.storeService.requestStore(formData).subscribe({
        next: () => {
          this.toast.success('Demande de boutique envoyée avec succès ! Elle sera examinée par un administrateur.');
          this.router.navigate(['manager/stores']);
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'Erreur lors de l\'envoi de la demande');
          this.router.navigate(['manager/stores']);
        },
      });
    });
  }
}