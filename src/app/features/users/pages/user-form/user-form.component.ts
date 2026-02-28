import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../../core/services/api.service';

export type UserFormMode = 'info' | 'edit';

export interface FieldResolveConfig {
  field: string;
  endpoint: string;
  idField?: string;
  labelField?: string;
  /** si la liste est dans data[itemsKey] (ex: roles) */
  itemsKey?: string;
}

export interface UserFormDialogData {
  mode: UserFormMode;
  user: any;
  resolves?: FieldResolveConfig[];
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  form!: FormGroup;

  roleOptions: Array<{ id: string; label: string }> = [];

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: UserFormDialogData,
  ) {}

  ngOnInit(): void {
    const u = this.data.user ?? {};

    this.form = this.fb.group({
      username: [{ value: u.username ?? '', disabled: this.isInfo }, [Validators.required]],
      email: [{ value: u.email ?? '', disabled: this.isInfo }, [Validators.required, Validators.email]],
      roleId: [{ value: u.roleId ?? '', disabled: this.isInfo }],
      status: [{ value: u.status ?? '', disabled: this.isInfo }],
    });

    this.loadResolveOptions('roleId');
  }

  private loadResolveOptions(field: string): void {
    const cfg = (this.data.resolves ?? []).find((r) => r.field === field);
    if (!cfg?.endpoint) return;

    const idField = (cfg.idField ?? '_id').trim();
    const fallbackIdField = 'id';
    const labelField = (cfg.labelField ?? 'label').trim();

    this.api.get<any>(cfg.endpoint).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const list = cfg.itemsKey
          ? ((data?.[cfg.itemsKey] ?? []) as any[])
          : (Array.isArray(data) ? data
            : (Array.isArray(data?.items) ? data.items
              : (Array.isArray(data?.data) ? data.data : [])));

        this.roleOptions = (list ?? []).map((x: any) => {
          const id = String(x?.[idField] ?? x?.[fallbackIdField] ?? '').trim();
          const label = String(x?.[labelField] ?? x?.name ?? x?.title ?? id).trim();
          return { id, label };
        }).filter((o: { id: string; label: string }) => !!o.id);
      },
      error: () => {
        // ignore
      },
    });
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
    this.dialogRef.close(this.form.getRawValue());
  }
}
