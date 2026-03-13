import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { toNationalPhone } from '../../../../util/format.util';

export type StoreFormMode = 'info' | 'edit' | 'create';

export interface StoreFormDialogData {
  mode: StoreFormMode;
  store: any;
}

@Component({
  selector: 'app-store-form',
  templateUrl: './store-form.component.html',
  styleUrls: ['./store-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreFormComponent implements OnInit {
  form!: FormGroup;

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  get isCreate(): boolean {
    return this.data.mode === 'create';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<StoreFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: StoreFormDialogData,
  ) {}

  ngOnInit(): void {
    const s = this.data.store ?? {};

    this.form = this.fb.group({
      name: [
        { value: s.name ?? '', disabled: this.isInfo },
        [Validators.required, Validators.maxLength(100)],
      ],
      address: [
        { value: s.address ?? '', disabled: this.isInfo },
        [Validators.required, Validators.maxLength(255)],
      ],
      phone: [
        { value: toNationalPhone(s.phone ?? ''), disabled: this.isInfo },
        [Validators.required],
      ],
      email: [
        { value: s.email ?? '', disabled: this.isInfo },
        [Validators.required, Validators.email],
      ],
    });

    // Ajouter status seulement si ce n'est pas une création
    if (!this.isCreate) {
      this.form.addControl(
        'status',
        this.fb.control({ value: this.getStatusLabel(s.status), disabled: true })
      );
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      active: 'Active',
      inactive: 'Inactive',
      rejected: 'Rejeté',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status] || 'black';
  }

  close(): void {
    this.dialogRef.close();
  }

  private asTrimmedString(val: unknown): string {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }

  /**
   * ngx-intl-tel-input renvoie parfois un objet.
   * Le backend attend une string => on extrait une valeur string fiable.
   */
  private normalizePhoneForApi(phoneRaw: any): string {
    // cas objet (ngx-intl-tel-input)
    const extracted = this.asTrimmedString(phoneRaw?.e164Number ?? phoneRaw?.number);
    if (extracted) return extracted;

    // cas string simple
    return this.asTrimmedString(phoneRaw);
  }

  submit(): void {
    if (this.isInfo) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const phoneToSend = this.normalizePhoneForApi(this.form.get('phone')?.value);

    // En mode création, envoyer seulement les champs requis
    if (this.isCreate) {
      const payload = {
        name: this.form.get('name')?.value,
        address: this.form.get('address')?.value,
        phone: phoneToSend,
        email: this.form.get('email')?.value,
      };
      this.dialogRef.close(payload);
    } else {
      // En mode edit, envoyer tout
      const raw = this.form.getRawValue();
      this.dialogRef.close({ ...raw, phone: phoneToSend });
    }
  }
}
