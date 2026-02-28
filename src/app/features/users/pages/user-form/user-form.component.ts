import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
export type UserFormMode = 'info' | 'edit';
export interface UserFormDialogData {
  mode: UserFormMode;
  user: any;
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
  get isInfo(): boolean {
    return this.data.mode === 'info';
  }
  constructor(
    private readonly fb: FormBuilder,
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
