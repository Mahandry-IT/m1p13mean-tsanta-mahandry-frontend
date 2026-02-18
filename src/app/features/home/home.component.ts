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
              <div class="card-left placeholder-image" aria-hidden="true"></div>
              <div class="card-right">
                <h2>Gérer votre propre boutique</h2>
                <p>Créez et administrez votre boutique, gérez vos produits, vos commandes et suivez vos ventes facilement.</p>
                <button mat-raised-button color="primary" routerLink="/users">Gérer votre boutique</button>
              </div>
            </div>
          </mat-card>

          <mat-card class="home-card">
            <div class="card-columns">
              <div class="card-left placeholder-image" aria-hidden="true"></div>
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
    .home-page { min-height: 100vh; display: flex; flex-direction: column; }
    .header-spacer { height: 72px; }
    .home-content { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; width: 100%; }
    .cards { width: 100%; max-width: 1200px; display: grid; gap: 24px; grid-template-columns: 1fr 1fr; }
    @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } }
    .home-card { padding: 0; }
    .card-columns { display: grid; grid-template-columns: 1fr 1fr; }
    .card-left { min-height: 200px; background: repeating-linear-gradient(45deg,#eee,#eee 10px,#ddd 10px,#ddd 20px); }
    .card-right { padding: 24px; display:flex; flex-direction:column; gap:12px; }
    `
  ]
})
export class HomeComponent {}
