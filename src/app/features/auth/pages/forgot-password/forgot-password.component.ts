import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, finalize, map, startWith } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: false,
})
export class ForgotPasswordComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  readonly isEnabled$ = combineLatest([
    this.form.statusChanges.pipe(startWith(this.form.status)),
    this.loading$,
  ]).pipe(map(([status, loading]) => status === 'VALID' && !loading));

  ngOnInit(): void {
    // Rien de spécial côté SSR
    if (!isPlatformBrowser(this.platformId)) return;
  }

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email } = this.form.getRawValue();

    this.loadingSubject.next(true);

    this.auth
      .requestPasswordReset({ email })
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          // Le backend envoie normalement un email contenant le lien /auth/reset-password?email=...&token=...
          this.toast.success('Si ce compte existe, un lien de réinitialisation a été envoyé.' );
          this.router.navigate(['/auth/login'], { queryParams: { email } });
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà un toast d'erreur.
        },
      });
  }
}

