import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
  standalone: false,
})
export class LogoutComponent implements OnInit {
  private readonly loadingSubject = new BehaviorSubject<boolean>(true);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngOnInit(): void {
    // SSR/hydration: pas d'appel réseau côté serveur
    if (!isPlatformBrowser(this.platformId)) {
      this.loadingSubject.next(false);
      return;
    }

    this.loadingSubject.next(true);

    this.auth
      .logout()
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.auth.clearSession();
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          // on force quand même la déconnexion front
          this.auth.clearSession();
          this.router.navigate(['/auth/login']);
        },
      });
  }
}

