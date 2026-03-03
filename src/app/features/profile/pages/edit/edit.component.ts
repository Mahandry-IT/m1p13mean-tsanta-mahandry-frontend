import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, finalize } from 'rxjs';

import { AuthService, UserResponse } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import { toNationalPhone } from '../../../../util/format.util';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  standalone: false,
})
export class EditProfileComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly user: UserService,
    private readonly toast: ToastService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  get loading(): boolean {
    return this.loadingSubject.value;
  }

  readonly form = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.minLength(2), Validators.maxLength(50)] }),
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.minLength(2), Validators.maxLength(100)] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.minLength(2), Validators.maxLength(100)] }),

    // ngx-intl-tel-input peut retourner un objet (ex: { number, internationalNumber, nationalNumber, dialCode, countryCode })
    phone: new FormControl<any>(null),

    birthday: new FormControl<string>('', { nonNullable: true }),
    gender: new FormControl<string>('Non défini', { nonNullable: true }),
  });

  /** Avatar affiché dans le header */
  avatarUrl: string | null = null;

  /** Juste pour afficher le nom du fichier via app-input mode=file */
  readonly avatarNameControl = new FormControl<string>('', { nonNullable: true });
  avatarFile: File | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1) rempli depuis le user stocké (rapide)
    this.patchFromUser(this.auth.getUser<UserResponse>());

    // 2) rafraîchit depuis backend si dispo
    this.user.getMe().subscribe({
      next: (res: any) => {
        const u = res?.data ?? res?.user ?? res;
        this.patchFromUser(u);

        // sync localStorage si payload exploitable
        if (u) this.auth.setUser(u);
      },
      error: () => {
        // ignore
      },
    });
  }

  onAvatarSelected(fileOrFiles: File | File[] | null): void {
    const file = Array.isArray(fileOrFiles) ? (fileOrFiles[0] ?? null) : fileOrFiles;
    this.avatarFile = file;
    this.avatarNameControl.setValue(file?.name ?? '');
  }

  private patchFromUser(u: any): void {
    const profile = u?.profile ?? {};

    this.avatarUrl = (profile?.avatarUrl ?? null) ? String(profile.avatarUrl) : null;

    const bday = profile?.birthday ? String(profile.birthday).slice(0, 10) : '';

    const rawPhone = profile?.phone ? String(profile.phone) : '';
    const phoneForControl = toNationalPhone(rawPhone);

    this.form.patchValue({
      username: String(u?.username ?? ''),
      firstName: String(profile?.firstName ?? ''),
      lastName: String(profile?.lastName ?? ''),
      phone: phoneForControl || null,
      birthday: bday,
      gender: String(profile?.gender ?? 'Non défini'),
    }, { emitEvent: false });
  }


  onSubmit(): void {
    if (this.loading) return;

    const payload = this.buildFullPayload();
    if (!payload && !this.avatarFile) {
      this.toast.error('Veuillez renseigner au moins un champ.');
      return;
    }

    this.loadingSubject.next(true);

    // Si on a un avatar => multipart/form-data
    const req$ = this.avatarFile
      ? this.user.updateMeFormData(this.buildFormDataPayload(payload, this.avatarFile))
      : this.user.updateMe(payload);

    req$
      .pipe(finalize(() => this.loadingSubject.next(false)))
      .subscribe({
        next: (res: any) => {
          const u = res?.data ?? res?.user ?? res;
          if (u) {
            this.auth.setUser(u);
            this.avatarUrl = (u?.profile?.avatarUrl ?? null) ? String(u.profile.avatarUrl) : this.avatarUrl;
          }
          this.toast.success('Profil mis à jour');
          this.router.navigateByUrl(this.auth.getHomePage() ?? '/');
        },
        error: (err) => {
          this.toast.error(err?.message ?? 'Erreur lors de la mise à jour');
        },
      });
  }

  /** Construit le payload avec toutes les valeurs remplies du formulaire (sans comparer au cache). */
  private buildFullPayload(): any | null {
    const v = this.form.getRawValue();
    const payload: any = {};

    const asTrimmedString = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    const username = asTrimmedString(v.username);
    if (username) payload.username = username;

    const profilePatch: any = {};

    const firstName = asTrimmedString(v.firstName);
    if (firstName) profilePatch.firstName = firstName;

    const lastName = asTrimmedString(v.lastName);
    if (lastName) profilePatch.lastName = lastName;

    // phone:
    // - si ngx-intl-tel-input fournit e164Number => on l'envoie (idéal)
    // - sinon si l'utilisateur a saisi un E.164 (+...) => on l'envoie tel quel
    // - sinon (saisie nationale) => on ne peut PAS deviner l'indicatif correctement ici,
    //   donc on envoie la valeur telle quelle. (Le backend peut la normaliser via libphonenumber)
    const phoneRaw: any = (v as any).phone;
    const extractedE164 = asTrimmedString(phoneRaw?.e164Number ?? phoneRaw?.number);
    const phoneStr = asTrimmedString(phoneRaw);

    const phoneToSend = extractedE164 || phoneStr;
    if (phoneToSend) profilePatch.phone = phoneToSend;

    // gender peut venir d'un select => parfois objet {label,value} selon composant.
    const genderRaw: any = v.gender as any;
    const gender = asTrimmedString(genderRaw?.value ?? genderRaw);
    if (gender) profilePatch.gender = gender;

    // birthday peut être string yyyy-MM-dd (input date) ou Date selon composant.
    const birthdayRaw: any = v.birthday as any;
    const birthdayStr = asTrimmedString(birthdayRaw);
    if (birthdayStr) {
      const d = new Date(birthdayStr);
      if (!Number.isNaN(d.getTime())) {
        profilePatch.birthday = d.toISOString();
      }
    }

    if (Object.keys(profilePatch).length) payload.profile = profilePatch;

    return Object.keys(payload).length ? payload : null;
  }

  private buildFormDataPayload(jsonPayload: any | null, avatarFile: File): FormData {
    const fd = new FormData();

    if (jsonPayload?.username) fd.append('username', String(jsonPayload.username));

    const profile = jsonPayload?.profile ?? {};
    for (const [k, v] of Object.entries(profile)) {
      if (v === null || v === undefined || v === '') continue;
      fd.append(k, String(v));
    }

    fd.append('avatar', avatarFile);
    return fd;
  }

  onCancel(): void {
    this.router.navigateByUrl(this.auth.getHomePage() ?? '/');
  }
}
