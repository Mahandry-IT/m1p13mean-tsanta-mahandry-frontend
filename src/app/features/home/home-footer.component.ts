import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="home-footer">
      <div class="footer-content">
        <div class="footer-left">
          <img src="/mean.png" alt="MEAN" class="footer-logo" />
          <div class="footer-links">
            <a routerLink="/users">Gérer votre boutique</a>
            <a routerLink="/auth/login">Acheter des produits</a>
          </div>
        </div>
        <div class="footer-right">
          <ul>
            <li>Tsanta Mahandry</li>
            <!-- Ajoutez d'autres noms si nécessaire -->
          </ul>
        </div>
      </div>
      <div class="footer-copy">© 2026 MEAN — Tous droits réservés</div>
    </footer>
  `,
  styles: [
    `
    .home-footer { margin-top: 48px; border-top: 1px solid #e0e0e0; background: #1b1f24; color: #e6e6e6; }
    .footer-content { display:flex; justify-content: space-between; padding: 24px; gap: 24px; }
    .footer-left { display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
    .footer-logo { height: 48px; filter: brightness(0) invert(1); }
    .footer-links { display:flex; flex-direction:column; gap:8px; }
    .footer-links a { color: #90caf9; text-decoration: none; }
    .footer-links a:hover { text-decoration: underline; }
    .footer-right ul { list-style:none; margin:0; padding:0; }
    .footer-copy { text-align:center; padding: 12px; font-size: 12px; color: #b0b0b0; }
    `
  ]
})
export class HomeFooterComponent {}
