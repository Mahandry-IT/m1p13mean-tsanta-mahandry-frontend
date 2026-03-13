import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface AddToCartDialogData {
  product: any;
  storeId?: string | null;
  defaultQuantity?: number;
}

@Component({
  selector: 'app-add-to-cart-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './add-to-cart-dialog.component.html',
})
export class AddToCartDialogComponent {
  quantityCtrl = new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] });

  constructor(
    public dialogRef: MatDialogRef<AddToCartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddToCartDialogData,
  ) {
    const def = Number(data?.defaultQuantity ?? 1);
    if (Number.isFinite(def) && def > 0) this.quantityCtrl.setValue(def);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  confirm(): void {
    if (this.quantityCtrl.invalid) {
      this.quantityCtrl.markAsTouched();
      return;
    }
    const q = Number(this.quantityCtrl.value ?? 1);
    this.dialogRef.close({ quantity: q });
  }
}
