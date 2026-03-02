import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { UploadDialogComponent } from '../../../../shared/components/upload-dialog/upload-dialog.component';

export type ProductFormMode = 'info' | 'edit' | 'create';

export interface ProductImageDto {
  link: string;
  publicId: string;
}

export interface ProductCategoryDto {
  categoryId: string;
  typeIds: string[];
}

export interface ProductDto {
  _id?: string;
  name?: string;
  description?: string;
  images?: ProductImageDto[];
  categories?: ProductCategoryDto[];
}

export interface ProductFormDialogData {
  mode: ProductFormMode;
  product: ProductDto;
}

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;

  categoryOptions: Array<{ id: string; label: string }> = [];
  typeOptionsByCategory = new Map<string, Array<{ id: string; label: string }>>();

  /** Fichiers nouvellement sélectionnés (champ images) */
  newImages: File[] = [];

  get isInfo(): boolean {
    return this.data.mode === 'info';
  }

  get isCreate(): boolean {
    return this.data.mode === 'create';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
    private readonly dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ProductFormDialogData,
  ) {}

  ngOnInit(): void {
    const p = this.data.product ?? {};

    this.form = this.fb.group({
      name: [{ value: p.name ?? '', disabled: this.isInfo }, [Validators.required]],
      description: [{ value: p.description ?? '', disabled: this.isInfo }],
      categories: this.fb.array([]),
    });

    for (const c of p.categories ?? []) {
      this.categoriesArray.push(this.buildCategoryGroup(c));
    }

    if (this.categoriesArray.length === 0 && !this.isInfo) {
      this.addCategoryRow();
    }

    this.loadCategories();
  }

  get categoriesArray(): FormArray<FormGroup> {
    return this.form.get('categories') as FormArray<FormGroup>;
  }

  private buildCategoryGroup(initial?: Partial<ProductCategoryDto>): FormGroup {
    const categoryId = (initial?.categoryId ?? '').toString();
    const typeIds = Array.isArray(initial?.typeIds) ? initial!.typeIds.map(String) : [];

    const g = this.fb.group({
      categoryId: new FormControl({ value: categoryId, disabled: this.isInfo }, { nonNullable: true, validators: [Validators.required] }),
      typeIds: new FormControl({ value: typeIds, disabled: this.isInfo }, { nonNullable: true }),
    });

    // Quand la catégorie change => reload les types + reset typeIds
    g.get('categoryId')!
      .valueChanges
      .subscribe((newCategoryId: string) => {
        if (this.isInfo) return;
        g.get('typeIds')!.setValue([], { emitEvent: false });
        if (newCategoryId) {
          this.loadTypesForCategory(newCategoryId);
        }
      });

    // Précharger types si catégorie déjà remplie
    if (categoryId) {
      this.loadTypesForCategory(categoryId);
    }

    return g;
  }

  addCategoryRow(): void {
    if (this.isInfo) return;
    this.categoriesArray.push(this.buildCategoryGroup());
  }

  removeCategoryRow(index: number): void {
    if (this.isInfo) return;
    this.categoriesArray.removeAt(index);
  }

  openUploadDialog(): void {
    if (this.isInfo) return;

    const ref = this.dialog.open(UploadDialogComponent, {
      data: {
        title: 'Images du produit',
        accept: 'image/*',
        multiple: true,
        helperText: 'Vous pouvez ajouter jusqu\'à 10 images.',
        limits: { maxFiles: 10 },
      },
    });

    ref.afterClosed().subscribe((res) => {
      if (!res) return;
      this.newImages = res.files ?? [];
    });
  }

  removeNewImage(i: number): void {
    if (this.isInfo) return;
    this.newImages.splice(i, 1);
    this.newImages = [...this.newImages];
  }

  typeOptionsFor(categoryId: string): Array<{ id: string; label: string }> {
    return this.typeOptionsByCategory.get(categoryId) ?? [];
  }

  private loadCategories(): void {
    // API: GET /api/categories?page=1&limit=200 ... => { items: [...] }
    this.api.get<any>('/categories', { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.categories) ? data.categories : []);

        this.categoryOptions = (items ?? [])
          .map((c: any) => ({ id: String(c?._id ?? c?.id ?? '').trim(), label: String(c?.name ?? c?.label ?? '').trim() }))
          .filter((o: any) => !!o.id);

        // Précharger types pour les lignes déjà remplies
        for (const row of this.categoriesArray.controls) {
          const cid = String(row.get('categoryId')?.value ?? '').trim();
          if (cid) this.loadTypesForCategory(cid);
        }
      },
      error: () => {
        // ignore
      },
    });
  }

  private loadTypesForCategory(categoryId: string): void {
    if (!categoryId) return;

    // API: GET /api/types?categoryId=:id&page=1&limit=200 => { items: [...] }
    this.api.get<any>('/types', { categoryId, page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.types) ? data.types : []);

        const opts = (items ?? [])
          .map((t: any) => ({ id: String(t?._id ?? t?.id ?? '').trim(), label: String(t?.name ?? t?.label ?? '').trim() }))
          .filter((o: any) => !!o.id);

        this.typeOptionsByCategory.set(categoryId, opts);
      },
      error: () => {
        this.typeOptionsByCategory.set(categoryId, []);
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

    // on renvoie tout ce qu'il faut au parent pour faire FormData
    const raw = this.form.getRawValue();
    const categories = (raw.categories ?? []).map((c: any) => ({
      categoryId: String(c.categoryId ?? '').trim(),
      typeIds: Array.isArray(c.typeIds) ? c.typeIds.map((x: any) => String(x)) : [],
    }));

    this.dialogRef.close({
      name: raw.name,
      description: raw.description,
      categories,
      newImages: this.newImages,
    });
  }
}

