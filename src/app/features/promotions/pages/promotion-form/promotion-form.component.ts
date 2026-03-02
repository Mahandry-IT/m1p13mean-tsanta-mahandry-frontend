import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
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
  metrics?: any;
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

  storeOptions: Array<{ id: string; label: string }> = [];
  productOptions: Array<{ id: string; label: string }> = [];
  loadingProducts = false;

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
    private readonly cdr: ChangeDetectorRef,
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

    // charger boutiques
    this.loadStores();

    // charger produits si storeId déjà rempli
    const storeId = String(this.form.get('storeId')?.value ?? '').trim();
    if (storeId) this.loadProducts(storeId);

    // quand store change, reload produits + reset productId
    this.form.get('storeId')?.valueChanges.subscribe((v) => {
      if (this.isInfo) return;
      const sid = String(v ?? '').trim();
      this.form.patchValue({ productId: '' }, { emitEvent: false });
      this.productOptions = [];
      if (sid) this.loadProducts(sid);
    });
  }

  private loadStores(): void {
    this.api.get<any>('/stores/my').subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);

        this.storeOptions = (arr ?? [])
          .map((s: any) => ({
            id: String(s?.id ?? s?._id ?? '').trim(),
            label: String(s?.name ?? '').trim(),
          }))
          .filter((o: any) => !!o.id);

        this.cdr.markForCheck();
      },
      error: () => {
        this.storeOptions = [];
        this.cdr.markForCheck();
      },
    });
  }

  private loadProducts(storeId: string): void {
    const sid = String(storeId ?? '').trim();
    if (!sid) return;

    this.loadingProducts = true;
    this.cdr.markForCheck();

    this.api.get<any>('/products/my-stores', { storeId: sid }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data)
          ? data
          : (Array.isArray(data?.items) ? data.items
            : (Array.isArray(data?.products) ? data.products : []));

        this.productOptions = (items ?? [])
          .map((p: any) => ({
            id: String(p?._id ?? p?.id ?? p?.productId ?? '').trim(),
            label: String(p?.name ?? p?.label ?? '').trim(),
          }))
          .filter((o: any) => !!o.id);

        // si la valeur actuelle n'existe pas, reset
        const cur = String(this.form.get('productId')?.value ?? '').trim();
        if (cur && !this.productOptions.some((o) => o.id === cur)) {
          this.form.patchValue({ productId: '' }, { emitEvent: false });
        }

        this.loadingProducts = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.productOptions = [];
        this.loadingProducts = false;
        this.cdr.markForCheck();
      },
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
          // s'assurer que les options produits sont chargées
          this.loadProducts(storeId);
          this.form.patchValue({ productId: String(product.productId) }, { emitEvent: false });
        }

        this.form.patchValue({
          discount: promotion.discountPercent ?? this.form.get('discount')?.value,
          description: promotion.description ?? this.form.get('description')?.value,
          startDate: promotion.startDate ? String(promotion.startDate).slice(0, 16) : this.form.get('startDate')?.value,
          endDate: promotion.endDate ? String(promotion.endDate).slice(0, 16) : this.form.get('endDate')?.value,
          isActive: promotion.isActive ?? this.form.get('isActive')?.value,
        }, { emitEvent: false });

        this.cdr.markForCheck();
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

    const toIso = (v: any) => {
      const s = String(v ?? '').trim();
      if (!s) return null;
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
