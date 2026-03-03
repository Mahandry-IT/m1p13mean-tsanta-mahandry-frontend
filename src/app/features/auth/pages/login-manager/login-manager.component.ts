import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-login-manager',
  templateUrl: './login-manager.component.html',
  styleUrls: ['./login-manager.component.scss'],
  standalone: false,
})
export class LoginManagerComponent {
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

  // Valeurs par défaut (à adapter à tes comptes de test)
  readonly form = new FormGroup({
    email: new FormControl<string>('owner.centre@example.com', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl<string>('ChangeMe123!', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
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

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loadingSubject.next(true);

    const payload = this.form.getRawValue();

    this.auth.login(payload).subscribe({
      next: ({ token, raw }) => {
        if (token) this.auth.setToken(token);
        this.auth.setHomePage(raw.data?.homePage as string | undefined);
        this.auth.setUser(raw.data?.user);

        const email = payload.email;

        this.userService.checkProfile(email).subscribe({
          next: (res) => {
            const home = this.auth.getHomePage() ?? '/';
            this.router.navigateByUrl(res.data?.hasProfile ? home : '/profile/create');
          },
          error: () => {
            const home = this.auth.getHomePage() ?? '/';
            this.router.navigateByUrl(home);
          },
          complete: () => this.loadingSubject.next(false),
        });
      },
      error: () => {
        this.loadingSubject.next(false);
      },
    });
  }
}
