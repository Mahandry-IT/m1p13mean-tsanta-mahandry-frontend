import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize } from 'rxjs';

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-create-profile',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
  standalone: false,
})
export class CreateProfileComponent {
  constructor(
    private readonly user: UserService,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router,
  ) {}

  readonly form = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<any>(null, { validators: [Validators.required] }),
    gender: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    birthday: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  /** Juste pour afficher le nom du fichier via app-input mode=file */
  readonly avatarNameControl = new FormControl<string>('', { nonNullable: true });

  avatarFile: File | null = null;

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  onAvatarSelected(fileOrFiles: File | File[] | null): void {
    const file = Array.isArray(fileOrFiles) ? (fileOrFiles[0] ?? null) : fileOrFiles;
    this.avatarFile = file;
    this.avatarNameControl.setValue(file?.name ?? '');
  }

  onSubmit(): void {
    if (this.loading) return;

    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    if (!this.avatarFile) {
      this.toast.error('Veuillez sélectionner un avatar.');
      return;
    }

    const home = this.auth.getHomePageFromToken() ?? '/';

    const v = this.form.getRawValue();

    // Le champ phone est un objet { internationalNumber, e164Number, ... }
    const phoneValue = (v as any).phone;
    const phoneToSend: string =
      phoneValue?.internationalNumber ??
      phoneValue?.e164Number ??
      phoneValue?.number ??
      '';

    if (!phoneToSend) {
      this.toast.error('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    const fd = new FormData();
    fd.append('firstName', v.firstName);
    fd.append('lastName', v.lastName);
    fd.append('phone', phoneToSend);
    fd.append('gender', v.gender);
    fd.append('birthday', v.birthday);
    fd.append('avatar', this.avatarFile);

    this.loadingSubject.next(true);
    this.user
      .createProfile(fd)
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: () => {
          this.toast.success('Profil créé avec succès.');
          this.router.navigateByUrl(home);
        },
        error: () => {
          // ErrorInterceptor affiche déjà un toast.
        },
      });
  }
}

