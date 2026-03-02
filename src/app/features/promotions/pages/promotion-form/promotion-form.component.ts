import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';

export type PromotionFormMode = 'info' | 'edit' | 'create';

export interface PromotionDto {
  promotionId?: string;
  _id?: string;
  id?: string;
  productId?: string;
  storeId?: string;
  discount?: number | string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface PromotionSuggestDto {
  storeId: string;
  product?: { productId: string; name: string };
  promotion?: {
    discountPercent?: number;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  };
}

export interface PromotionFormDialogData {
  mode: PromotionFormMode;
  promotion: PromotionDto;
}

@Component({
  selector: 'app-promotion-form',
  templateUrl: './promotion-form.component.html',
  styleUrls: ['./promotion-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionFormComponent implements OnInit {
  form!: FormGroup;

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  get isCreate(): boolean {
    return this.data.mode === 'create';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly dialogRef: MatDialogRef<PromotionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: PromotionFormDialogData,
  ) {}

  ngOnInit(): void {
    const p = this.data.promotion ?? {};

    this.form = this.fb.group({
      productId: [{ value: p.productId ?? '', disabled: this.isInfo }, [Validators.required]],
      storeId: [{ value: p.storeId ?? '', disabled: this.isInfo }, [Validators.required]],
      discount: [{ value: p.discount ?? '', disabled: this.isInfo }, [Validators.required, Validators.min(0), Validators.max(100)]],
      description: [{ value: p.description ?? '', disabled: this.isInfo }],
      startDate: [{ value: p.startDate ? String(p.startDate).slice(0, 16) : '', disabled: this.isInfo }, [Validators.required]],
      endDate: [{ value: p.endDate ? String(p.endDate).slice(0, 16) : '', disabled: this.isInfo }, [Validators.required]],
      isActive: [{ value: p.isActive ?? true, disabled: this.isInfo }],
    });
  }

  suggest(): void {
    if (this.isInfo) return;

    const storeId = String(this.form.get('storeId')?.value ?? '').trim();
    if (!storeId) {
      this.form.get('storeId')?.markAsTouched();
      return;
    }

    this.api.get<any>('/promotions/suggest', { storeId }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const s: PromotionSuggestDto = data;

        const promotion = (s as any)?.promotion ?? {};
        const product = (s as any)?.product ?? {};

        if (product?.productId) {
          this.form.patchValue({ productId: product.productId }, { emitEvent: false });
        }

        // API: discountPercent => champ discount
        this.form.patchValue({
          discount: promotion.discountPercent ?? this.form.get('discount')?.value,
          description: promotion.description ?? this.form.get('description')?.value,
          startDate: promotion.startDate ? String(promotion.startDate).slice(0, 16) : this.form.get('startDate')?.value,
          endDate: promotion.endDate ? String(promotion.endDate).slice(0, 16) : this.form.get('endDate')?.value,
          isActive: promotion.isActive ?? this.form.get('isActive')?.value,
        }, { emitEvent: false });
      },
      error: () => {
        // ignore
      }
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

    // API attend startDate/endDate ISO
    const toIso = (v: any) => {
      const s = String(v ?? '').trim();
      if (!s) return null;
      // Si on a une valeur du type datetime-local: 2026-03-03T00:00
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return new Date(s).toISOString();
      return s;
    };

    const payload: any = {
      productId: String(raw.productId ?? '').trim(),
      storeId: String(raw.storeId ?? '').trim(),
      discount: Number(raw.discount),
      description: String(raw.description ?? '').trim(),
      startDate: toIso(raw.startDate),
      endDate: toIso(raw.endDate),
      isActive: !!raw.isActive,
    };

    this.dialogRef.close(payload);
  }
}
