import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="home-footer">
      <div class="footer-content">
        <section class="footer-col footer-left">
          <h3 class="footer-title">MEAN</h3>
          <nav class="footer-links">
            <a routerLink="/users">Gérer votre boutique</a>
            <a routerLink="/auth/login">Acheter des produits</a>
          </nav>
        </section>

        <section class="footer-col footer-right">
          <h3 class="footer-title">Équipe</h3>
          <ul class="footer-list">
            <li>Tsanta Mialitiana Fenosoa RANDRIAMIHARY</li>
            <li>Mahandry ANDRIANANTENAINA</li>
            <!-- Ajoutez d'autres noms si nécessaire -->
          </ul>
        </section>
      </div>
      <div class="footer-copy">© 2026 MEAN — Tous droits réservés</div>
    </footer>
  `,
  styles: [
    `
      .home-footer { background: #000; color: #f1f1f1; }
      .footer-content { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 24px 20px; max-width: 1200px; margin: 0 auto; }
    @media (max-width: 900px) { .footer-content { grid-template-columns: 1fr; gap: 24px; } }

    .footer-col { display: flex; flex-direction: column; gap: 12px; }
    .footer-title { font-size: 24px; line-height: 1.2; margin: 0; font-weight: 700; letter-spacing: 0.2px; color: #fff; }

    .footer-links { display: flex; flex-direction: column; gap: 8px; }
    .footer-links a { color: #d6d6d6; text-decoration: none; font-weight: 500; }
    .footer-links a:hover { color: #ffffff; text-decoration: underline; }

    .footer-list { list-style: none; margin: 0; padding: 0; }
    .footer-list li { margin: 6px 0; color: #d6d6d6; }

    .footer-copy { text-align: center; padding: 12px 16px; font-size: 13px; color: #bdbdbd; border-top: 1px solid rgba(255,255,255,0.08); }

    img, svg { max-width: 100%; height: auto; }
    `
  ]
})
export class HomeFooterComponent {}
