import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';

export type TypeFormMode = 'info' | 'edit' | 'create';

export interface TypeDto {
  _id?: string;
  name?: string;
  slug?: string;
  categoryId?: string;
}

export interface TypeFormDialogData {
  mode: TypeFormMode;
  type: TypeDto;
}

@Component({
  selector: 'app-type-form',
  templateUrl: './type-form.component.html',
  styleUrls: ['./type-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeFormComponent implements OnInit {
  form!: FormGroup;

  categoryOptions: Array<{ id: string; label: string }> = [];

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  get isCreate(): boolean {
    return this.data.mode === 'create';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly dialogRef: MatDialogRef<TypeFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: TypeFormDialogData,
  ) {}

  ngOnInit(): void {
    const t = this.data.type ?? {};

    this.form = this.fb.group({
      name: [{ value: t.name ?? '', disabled: this.isInfo }, [Validators.required, Validators.maxLength(50)]],
      slug: [{ value: t.slug ?? '', disabled: this.isInfo }, [Validators.maxLength(80)]],
      categoryId: [{ value: t.categoryId ?? '', disabled: this.isInfo }, [Validators.required]],
    });

    this.loadCategories();
  }

  private loadCategories(): void {
    this.api.get<any>('/categories', { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.categories) ? data.categories : []);

        this.categoryOptions = (items ?? [])
          .map((c: any) => ({ id: String(c?._id ?? c?.id ?? '').trim(), label: String(c?.name ?? c?.label ?? '').trim() }))
          .filter((o: any) => !!o.id);
      },
      error: () => {
        this.categoryOptions = [];
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

    const raw = this.form.getRawValue();
    const payload: any = {
      name: String(raw.name ?? '').trim(),
      slug: String(raw.slug ?? '').trim(),
      categoryId: String(raw.categoryId ?? '').trim(),
    };

    // Ne pas envoyer slug vide si backend le calcule
    if (!payload.slug) delete payload.slug;

    this.dialogRef.close(payload);
  }
}

