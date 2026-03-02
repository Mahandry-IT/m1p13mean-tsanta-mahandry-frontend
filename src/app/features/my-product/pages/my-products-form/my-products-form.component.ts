import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, Optional } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../../../../core/services/api.service';
import { UploadDialogComponent } from '../../../../shared/components/upload-dialog/upload-dialog.component';

export type MyProductsFormMode = 'info' | 'edit' | 'create';

export interface MyProductsImageDto {
  link: string;
  publicId: string;
}

export interface MyProductsCategoryDto {
  categoryId: string;
  typeIds: string[];
}

export interface MyProductsDto {
  _id?: string;
  name?: string;
  description?: string;
  images?: MyProductsImageDto[];
  categories?: MyProductsCategoryDto[];
}

export interface MyProductsFormDialogData {
  mode: MyProductsFormMode;
  product: MyProductsDto;
}

@Component({
  selector: 'app-my-products-form',
  templateUrl: './my-products-form.component.html',
  styleUrls: ['./my-products-form.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProductsFormComponent implements OnInit {
  form!: FormGroup;

  categoryOptions: Array<{ id: string; label: string }> = [];
  typeOptionsByCategory = new Map<string, Array<{ id: string; label: string }>>();

  /** Fichiers nouvellement sélectionnés (champ images) */
  newImages: File[] = [];

  /** Données du dialog normalisées (jamais null) */
  readonly dialogData: MyProductsFormDialogData;

  /** cache pour éviter reload types répétés */
  private loadedTypeCategories = new Set<string>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly api: ApiService,
    private readonly dialog: MatDialog,
    private readonly dialogRef: MatDialogRef<MyProductsFormComponent>,
    private readonly cdr: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) data: MyProductsFormDialogData | null,
  ) {
    this.dialogData = data ?? ({ mode: 'info', product: {} } as MyProductsFormDialogData);
  }

  get isInfo(): boolean {
    return (this.dialogData.mode ?? 'info') === 'info';
  }

  get isCreate(): boolean {
    return (this.dialogData.mode ?? 'info') === 'create';
  }

  ngOnInit(): void {
    const p = this.dialogData.product ?? {};

    this.form = this.fb.group({
      name: [{ value: p.name ?? '', disabled: this.isInfo }, [Validators.required]],
      description: [{ value: p.description ?? '', disabled: this.isInfo }],
      categories: this.fb.array([]),
    });

    const incoming = Array.isArray(p.categories) ? p.categories : [];

    // dédupliquer par categoryId et fusionner les typeIds
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
      this.categoriesArray.push(this.buildCategoryGroup({ categoryId, typeIds: Array.from(typeSet) }));
    }

    if (this.categoriesArray.length === 0 && !this.isInfo) {
      this.addCategoryRow();
    }

    this.loadCategories();
  }

  get categoriesArray(): FormArray<FormGroup> {
    return this.form.get('categories') as FormArray<FormGroup>;
  }

  private buildCategoryGroup(initial?: Partial<MyProductsCategoryDto>): FormGroup {
    const categoryId = String(initial?.categoryId ?? '').trim();
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
        const cid = String(newCategoryId ?? '').trim();

        g.get('typeIds')!.setValue([], { emitEvent: false });
        if (cid) {
          this.loadTypesForCategory(cid);
        }
      });

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
    this.api.get<any>('/categories', { page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.categories) ? data.categories : []);

        this.categoryOptions = (items ?? [])
          .map((c: any) => ({ id: String(c?._id ?? c?.id ?? '').trim(), label: String(c?.name ?? c?.label ?? '').trim() }))
          .filter((o: any) => !!o.id);

        // Ré-appliquer les valeurs + charger les types (une seule fois par catégorie)
        for (const row of this.categoriesArray.controls) {
          const cid = String(row.get('categoryId')?.value ?? '').trim();
          row.get('categoryId')?.setValue(cid, { emitEvent: false });

          const tids = row.get('typeIds')?.value;
          row.get('typeIds')?.setValue(Array.isArray(tids) ? tids : [], { emitEvent: false });

          if (cid) this.loadTypesForCategory(cid);
        }

        this.cdr.markForCheck();
      },
      error: () => {
        // ignore
      },
    });
  }

  private loadTypesForCategory(categoryId: string): void {
    const cid = String(categoryId ?? '').trim();
    if (!cid) return;

    // éviter les hits multiples (init + loadCategories + autres)
    if (this.loadedTypeCategories.has(cid) && this.typeOptionsByCategory.has(cid)) {
      return;
    }
    this.loadedTypeCategories.add(cid);

    this.api.get<any>('/types', { categoryId: cid, page: 1, limit: 200, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.types) ? data.types : []);

        const opts = (items ?? [])
          .map((t: any) => ({ id: String(t?._id ?? t?.id ?? '').trim(), label: String(t?.name ?? t?.label ?? '').trim() }))
          .filter((o: any) => !!o.id);

        this.typeOptionsByCategory.set(cid, opts);

        // Mode info: options arrivent après init => forcer refresh multi-select
        if (this.isInfo) {
          for (const row of this.categoriesArray.controls) {
            const rowCid = String(row.get('categoryId')?.value ?? '').trim();
            if (rowCid !== cid) continue;
            const tids = row.get('typeIds')?.value;
            row.get('typeIds')?.setValue(Array.isArray(tids) ? tids : [], { emitEvent: false });
          }
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.typeOptionsByCategory.set(cid, []);
        this.cdr.markForCheck();
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

