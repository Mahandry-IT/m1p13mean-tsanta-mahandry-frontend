import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, startWith, map, combineLatest, BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false,
})
export class LoginComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

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
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: ({ token }) => {
          if (token) {
            this.auth.setToken(token);
          }
          // Redirection post-login
          this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà un toast.
        },
      });
  }
}
