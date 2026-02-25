import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, finalize, map, startWith, take } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value as string | null | undefined;
  const confirm = group.get('confirmPassword')?.value as string | null | undefined;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: false,
})
export class ResetPasswordComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  readonly form = new FormGroup(
    {
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      token: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator] },
  );

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
    if (!isPlatformBrowser(this.platformId)) return;

    this.route.queryParamMap.pipe(take(1)).subscribe((params) => {
      const email = params.get('email') ?? '';
      const token = params.get('token') ?? '';

      if (email) this.form.controls.email.setValue(email);
      if (token) this.form.controls.token.setValue(token);

      if (!email || !token) {
        this.toast.error('Lien de réinitialisation invalide ou incomplet.');
      }
    });
  }

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, token, newPassword } = this.form.getRawValue();

    this.loadingSubject.next(true);

    // Endpoint backend identique à new-password
    this.auth
      .changePassword({ email, token, newPassword })
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.toast.success('Mot de passe changé. Vous pouvez vous connecter.');
          this.router.navigate(['/auth/login'], { queryParams: { email } });
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà un toast d'erreur.
        },
      });
  }
}

