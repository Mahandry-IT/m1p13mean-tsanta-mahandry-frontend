import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, finalize, take } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.scss'],
  standalone: false,
})
export class ActivateComponent implements OnInit {
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngOnInit(): void {
    // Important SSR/hydration: ne pas faire de requêtes réseau côté serveur.
    if (!isPlatformBrowser(this.platformId)) {
      this.loadingSubject.next(false);
      return;
    }

    // On attend la première émission pour être sûr que les query params sont disponibles.
    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const email = params.get('email') ?? '';
      const token = params.get('token') ?? '';
      this.activate(email, token);
    });
  }

  private activate(email: string, token: string): void {
    if (!token) {
      this.toast.error("Lien d'activation invalide (token manquant).");
      this.router.navigate(['/auth/login'], email ? { queryParams: { email } } : undefined);
      return;
    }

    this.loadingSubject.next(true);

    this.auth
      .activateAccount(token)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.toast.success('Compte activé. Vous pouvez vous connecter.');
          this.router.navigate(['/auth/login'], email ? { queryParams: { email } } : undefined);
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà le toast d'erreur.
          this.router.navigate(['/auth/login'], email ? { queryParams: { email } } : undefined);
        },
      });
  }
}
