import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatButtonModule, MatMenuModule],
  template: `
    <mat-toolbar color="primary" class="home-header">
      <div class="header-left">
        <img src="/mean-logo.png" alt="MEAN Logo" class="app-logo" />
      </div>
      <div class="header-right">
        <button mat-flat-button color="accent" routerLink="/auth/login">Se connecter</button>
        <button mat-stroked-button color="accent" [matMenuTriggerFor]="signupMenu">S'inscrire</button>
        <mat-menu #signupMenu="matMenu">
          <button mat-menu-item [routerLink]="['/auth/register']" [queryParams]="{ role: 'GERANT' }">Gérant</button>
          <button mat-menu-item [routerLink]="['/auth/register']" [queryParams]="{ role: 'ACHETEUR' }">Acheteur</button>
        </mat-menu>
      </div>
    </mat-toolbar>
  `,
  styles: [
    `
    .home-header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; display: flex; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .home-header.mat-toolbar { min-height: 72px; }
    .header-left { display:flex; align-items:center; }
    .header-right { display:flex; gap: 12px; align-items:center; flex-wrap: wrap; }
    .app-logo { height: 128px; max-height: 128px; width: auto; object-fit: contain; }
    @media (max-width: 600px) {
      .home-header.mat-toolbar { min-height: 56px; }
      .app-logo { height: 40px; max-height: 40px; }
      .header-right { gap: 8px; }
    }
    `
  ]
})
export class HomeHeaderComponent {}
