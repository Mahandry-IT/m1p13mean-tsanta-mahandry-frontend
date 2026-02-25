import { Component } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, finalize, map, startWith } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value as string | null | undefined;
  const confirm = group.get('confirmPassword')?.value as string | null | undefined;

  // Tant que l’utilisateur n’a pas rempli, on laisse les validateurs "required" gérer.
  if (!password || !confirm) return null;

  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false,
})
export class RegisterComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}

  readonly form = new FormGroup(
    {
      username: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl<string>('', {
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

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loadingSubject.next(true);

    const { username, email, password } = this.form.getRawValue();
    const payload = { username, email, password };

    this.auth
      .registerUser(payload)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.toast.success('Vérifier votre boite mail pour activer votre compte.');
          this.router.navigateByUrl('/auth/login');
        },
        error: () => {
          // L'ErrorInterceptor affiche déjà un toast d'erreur.
        },
      });
  }
}
