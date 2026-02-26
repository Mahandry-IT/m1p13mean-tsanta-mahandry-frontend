import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, finalize, take } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-activate',
  templateUrl: './check.component.html',
  styleUrls: ['./check.component.scss'],
  standalone: false,
})
export class CheckComponent implements OnInit {
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly user: UserService,
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
      this.checkProfile(email);
    });
  }

  private checkProfile(email: string): void {

    this.loadingSubject.next(true);

    this.user
      .checkProfile(email)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.toast.success('Vous avez déjà un profil. Vous serez redirigé vers le tableau de bord.');
          this.router.navigate(['/auth/login'], email ? { queryParams: { email } } : undefined);
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà le toast d'erreur.
          this.router.navigate(['/auth/login'], email ? { queryParams: { email } } : undefined);
        },
      });
  }
}
