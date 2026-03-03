import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type BuyProductsFormMode = 'info';

export interface BuyProductsImageDto {
  link: string;
  publicId: string;
}

export interface BuyProductsCategoryDto {
  categoryId: string;
  typeIds: string[];
}

export interface BuyProductsPriceHistoryDto {
  price: any;
  updatedAt: string;
}

export interface BuyProductsStoreDataDto {
  storeId: string;
  currentPrice?: any;
  createdAt?: string;
  priceHistory?: BuyProductsPriceHistoryDto[];
  promotions?: any[];
  stockMovements?: any[];
}

export interface BuyProductsDto {
  _id?: string;
  name?: string;
  description?: string;
  images?: BuyProductsImageDto[];
  categories?: BuyProductsCategoryDto[];
  defaultPrice?: any;
  storeData?: BuyProductsStoreDataDto[];
}

export interface BuyProductsFormDialogData {
  mode: BuyProductsFormMode;
  product: BuyProductsDto;
  storeId?: string | null;
}

@Component({
  selector: 'app-buy-products-form',
  templateUrl: './buy-products-form.component.html',
  styleUrls: ['./buy-products-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyProductsFormComponent implements OnInit {
  form!: FormGroup;

  readonly dialogData: BuyProductsFormDialogData;

  /** Prix à afficher en info: promo -> dernier prix -> prix par défaut */
  displayPrice: number | null = null;
  displayPriceLabel = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<BuyProductsFormComponent>,
    private readonly cdr: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) data: BuyProductsFormDialogData | null,
  ) {
    this.dialogData = data ?? ({ mode: 'info', product: {} } as BuyProductsFormDialogData);
  }

  private toNum(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'object' && v && '$numberDecimal' in v) return this.toNum((v as any).$numberDecimal);
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private lastPriceFromHistory(sd: any): number | null {
    const hist = Array.isArray(sd?.priceHistory) ? sd.priceHistory : [];
    if (!hist.length) return null;
    const last = [...hist]
      .sort((a: any, b: any) => new Date(a?.updatedAt ?? 0).getTime() - new Date(b?.updatedAt ?? 0).getTime())
      .pop();
    return this.toNum(last?.price);
  }

  private isActivePromo(p: any): boolean {
    if (p?.isActive === false) return false;
    const startRaw = p?.startDate;
    const endRaw = p?.endDate;
    const start = startRaw ? new Date(startRaw).getTime() : NaN;
    const end = endRaw ? new Date(endRaw).getTime() : NaN;
    const hasValidWindow = Number.isFinite(start) && Number.isFinite(end);
    if (!hasValidWindow) return p?.isActive !== false;
    const now = Date.now();
    return start <= now && now <= end;
  }

  private computeDisplayPrice(product: BuyProductsDto, storeId: string | null | undefined): { price: number | null; label: string } {
    const list = Array.isArray(product?.storeData) ? product.storeData : [];
    const defaultPrice = this.toNum((product as any)?.defaultPrice);

    const pickStoreData = () => {
      if (storeId) {
        const match = list.find((x: any) => String(x?.storeId ?? '') === String(storeId));
        if (match) return match;
      }
      return list.length ? list[list.length - 1] : null;
    };

    const sd = pickStoreData();

    // 1) promo (si active et basePrice connu)
    const base = this.lastPriceFromHistory(sd) ?? this.toNum(sd?.currentPrice) ?? defaultPrice;
    const promos = Array.isArray(sd?.promotions) ? sd.promotions : [];
    const active = promos.find((p: any) => this.isActivePromo(p)) ?? null;
    const discountPercent = this.toNum(active?.discount);

    if (base !== null && discountPercent !== null && discountPercent > 0) {
      const final = Math.max(0, base - (base * discountPercent) / 100);
      return { price: final, label: `Prix réduit (-${discountPercent}%)` };
    }

    // 2) dernier prix
    const last = this.lastPriceFromHistory(sd) ?? this.toNum(sd?.currentPrice);
    if (last !== null) return { price: last, label: 'Dernier prix' };

    // 3) prix par défaut
    return { price: defaultPrice, label: defaultPrice !== null ? 'Prix par défaut' : '' };
  }

  ngOnInit(): void {
    const p = this.dialogData.product ?? {};

    const dp = this.computeDisplayPrice(p, this.dialogData.storeId ?? null);
    this.displayPrice = dp.price;
    this.displayPriceLabel = dp.label;

    this.form = this.fb.group({
      name: [{ value: p.name ?? '', disabled: true }, [Validators.required]],
      description: [{ value: p.description ?? '', disabled: true }],
      categories: this.fb.array([]),
    });

    const incoming = Array.isArray(p.categories) ? p.categories : [];
    const byCategory = new Map<string, Set<string>>();

    for (const c of incoming) {
      const cid = String((c as any)?.categoryId ?? '').trim();
      if (!cid) continue;
      const set = byCategory.get(cid) ?? new Set<string>();
      const tids = Array.isArray((c as any)?.typeIds) ? (c as any).typeIds : [];
      for (const t of tids) set.add(String(t));
      byCategory.set(cid, set);
    }

    for (const [categoryId, typeSet] of byCategory.entries()) {
      this.categoriesArray.push(this.fb.group({
        categoryId: new FormControl({ value: categoryId, disabled: true }, { nonNullable: true }),
        typeIds: new FormControl({ value: Array.from(typeSet), disabled: true }, { nonNullable: true }),
      }));
    }

    this.cdr.markForCheck();
  }

  get categoriesArray(): FormArray<FormGroup> {
    return this.form.get('categories') as FormArray<FormGroup>;
  }

  close(): void {
    this.dialogRef.close();
  }
}

