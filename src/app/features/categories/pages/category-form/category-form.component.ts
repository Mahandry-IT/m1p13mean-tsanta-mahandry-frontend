import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type CategoryFormMode = 'info' | 'edit' | 'create';

export interface CategoryDto {
  _id?: string;
  name?: string;
  slug?: string;
}

export interface CategoryFormDialogData {
  mode: CategoryFormMode;
  category: CategoryDto;
}

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit {
  form!: FormGroup;

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  get isCreate(): boolean {
    return this.data.mode === 'create';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: CategoryFormDialogData,
  ) {}

  ngOnInit(): void {
    const c = this.data.category ?? {};

    this.form = this.fb.group({
      name: [{ value: c.name ?? '', disabled: this.isInfo }, [Validators.required, Validators.maxLength(50)]],
      slug: [{ value: c.slug ?? '', disabled: this.isInfo }, [Validators.maxLength(80)]],
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

    const raw = this.form.getRawValue();
    const payload: any = {};

    // PATCH: optionnel, POST: requis name
    payload.name = String(raw.name ?? '').trim();
    if (raw.slug !== undefined) payload.slug = String(raw.slug ?? '').trim();

    this.dialogRef.close(payload);
  }
}

