import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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
        [Validators.required, Validators.maxLength(100)]
      ],
      address: [
        { value: s.address ?? '', disabled: this.isInfo }, 
        [Validators.required, Validators.maxLength(255)]
      ],
      phone: [
        { value: s.phone ?? '', disabled: this.isInfo }, 
        [Validators.required]
      ],
      email: [
        { value: s.email ?? '', disabled: this.isInfo }, 
        [Validators.required, Validators.email]
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

  submit(): void {
    if (this.isInfo) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // En mode création, envoyer seulement les champs requis
    if (this.isCreate) {
      const payload = {
        name: this.form.get('name')?.value,
        address: this.form.get('address')?.value,
        phone: this.form.get('phone')?.value,
        email: this.form.get('email')?.value,
      };
      this.dialogRef.close(payload);
    } else {
      // En mode edit, envoyer tout
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}