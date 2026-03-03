import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';

export type MyProductsAddMode = 'existing' | 'new';

export interface MyProductsAddDialogData {
  storeId: string | null;
}

export interface MyProductsAddDialogResult {
  mode: MyProductsAddMode;
  // pour mode existing
  productId?: string;
  price?: number;
  // pour mode new
  defaultPrice?: number;
}

@Component({
  selector: 'app-my-products-add-dialog',
  templateUrl: './my-products-add-dialog.component.html',
  styleUrls: ['./my-products-add-dialog.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProductsAddDialogComponent implements OnInit {
  mode: MyProductsAddMode = 'existing';

  productIdCtrl = new FormControl<string | null>(null, { validators: [Validators.required] });
  priceCtrl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });

  defaultPriceCtrl = new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] });

  loadingProducts = false;
  productOptions: Array<{ id: string; label: string }> = [];

  constructor(
    private readonly api: ApiService,
    private readonly dialogRef: MatDialogRef<MyProductsAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: MyProductsAddDialogData,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    if (!this.data.storeId) {
      this.productOptions = [];
      return;
    }

    this.loadingProducts = true;
    this.api.get<any>('/products/').subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        // support: {items}, {products}, array
        const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.products) ? data.products : []));

        this.productOptions = (items ?? [])
          .map((p: any) => ({
            id: String(p?._id ?? p?.id ?? '').trim(),
            label: String(p?.name ?? p?.label ?? '').trim(),
          }))
          .filter((o: any) => !!o.id);

        // si la sélection courante n'existe plus, reset
        if (this.productIdCtrl.value && !this.productOptions.some((o) => o.id === this.productIdCtrl.value)) {
          this.productIdCtrl.setValue(null);
        }

        this.loadingProducts = false;
      },
      error: () => {
        this.productOptions = [];
        this.loadingProducts = false;
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  canSubmit(): boolean {
    if (this.mode === 'existing') return this.productIdCtrl.valid && this.priceCtrl.valid;
    return this.defaultPriceCtrl.valid;
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.productIdCtrl.markAsTouched();
      this.priceCtrl.markAsTouched();
      this.defaultPriceCtrl.markAsTouched();
      return;
    }

    const result: MyProductsAddDialogResult = {
      mode: this.mode,
    };

    if (this.mode === 'existing') {
      result.productId = String(this.productIdCtrl.value);
      result.price = Number(this.priceCtrl.value);
    } else {
      result.defaultPrice = Number(this.defaultPriceCtrl.value);
    }

    this.dialogRef.close(result);
  }
}
