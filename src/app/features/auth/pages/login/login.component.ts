import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { startWith, map, combineLatest, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly userService: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.controls.email.setValue(email);
    }
  }

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  /** Compat template existant (si utilisé ailleurs) */
  get loading(): boolean {
    return this.loadingSubject.value;
  }

  /** isenabled = true => bouton actif */
  readonly isEnabled$ = combineLatest([
    this.form.statusChanges.pipe(startWith(this.form.status)),
    this.loading$,
  ]).pipe(map(([status, loading]) => status === 'VALID' && !loading));

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loadingSubject.next(true);

    const payload = this.form.getRawValue();

    this.auth
      .login(payload)
      .subscribe({
        next: ({ token, raw }) => {
          if (token) {
            this.auth.setToken(token);
          }

          // homePage est renvoyé par le backend dans la réponse (pas dans le token)
          this.auth.setHomePage(raw.data?.homePage as string | undefined);

          // user est renvoyé par le backend dans la réponse
          this.auth.setUser(raw.data?.user);

          const email = payload.email;

          this.userService.checkProfile(email).subscribe({
            next: (res) => {
              const home = this.auth.getHomePage() ?? '/';
              if (res.data?.hasProfile) {
                this.router.navigateByUrl(home);
              } else {
                this.router.navigateByUrl('/profile/create');
              }
            },
            error: () => {
              // Si le check échoue, on redirige quand même vers la homepage (et l'interceptor affiche le toast)
              const home = this.auth.getHomePage() ?? '/';
              this.router.navigateByUrl(home);
            },
            complete: () => {
              this.loadingSubject.next(false);
            },
          });
        },
        error: () => {
          this.loadingSubject.next(false);
          // L'ErrorInterceptor affiche déjà un toast.
        },
      });
  }
}
