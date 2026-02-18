import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { HomeHeaderComponent } from './home-header.component';
import { HomeFooterComponent } from './home-footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    RouterModule,
    HomeHeaderComponent,
    HomeFooterComponent
  ],
  template: `
    <div class="home-page">
      <app-home-header></app-home-header>
      <div class="header-spacer"></div>

      <!-- Contenu principal -->
      <main class="home-content">
        <section class="cards">
          <mat-card class="home-card">
            <div class="card-columns">
              <div class="card-left" aria-hidden="true">
                <img src="/home/store-handler.png" alt="Gérer votre boutique" class="card-image" />
              </div>
              <div class="card-right">
                <h2>Gérer votre propre boutique</h2>
                <p>Créez et administrez votre boutique, gérez vos produits, vos commandes et suivez vos ventes facilement.</p>
                <button mat-raised-button color="primary" routerLink="/users">Gérer votre boutique</button>
              </div>
            </div>
          </mat-card>

          <mat-card class="home-card">
            <div class="card-columns">
              <div class="card-left" aria-hidden="true">
                <img src="/home/customer.png" alt="Acheter des produits" class="card-image" />
              </div>
              <div class="card-right">
                <h2>Acheter vos produits préférés</h2>
                <p>Parcourez le catalogue et trouvez les meilleures offres pour vos achats quotidiens.</p>
                <button mat-raised-button color="primary" routerLink="/auth/login">Acheter des produits</button>
              </div>
            </div>
          </mat-card>
        </section>
      </main>

      <app-home-footer></app-home-footer>
    </div>
  `,
  styles: [
    `
    .home-page { min-height: 100vh; display: flex; flex-direction: column; overflow-x: hidden; }
    .header-spacer { height: 72px; flex: 0 0 auto; }
    .home-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 16px; width: 100%; box-sizing: border-box; min-height: calc(100vh - 72px - 88px); /* 88px ~ hauteur du footer */ }
    .cards { width: 100%; max-width: 1200px; display: grid; gap: 16px; grid-template-columns: 1fr 1fr; box-sizing: border-box; }
    @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } }
    .home-card { padding: 0; width: 100%; box-sizing: border-box; }
    .card-columns { display: grid; grid-template-columns: 1fr 1fr; }
    @media (max-width: 900px) { .card-columns { grid-template-columns: 1fr; } }
    .card-left { min-height: 200px; width: 100%; display:flex; align-items:center; justify-content:center; background: #fafafa; }
    .card-image { max-width: 100%; height: auto; object-fit: contain; }
    @media (max-width: 600px) { .card-left { min-height: 140px; } }
    .card-right { padding: 24px; display:flex; flex-direction:column; gap:12px; box-sizing: border-box; }
    img, svg { max-width: 100%; height: auto; display: block; }
    * { box-sizing: border-box; }
    `
  ]
})
export class HomeComponent {}
