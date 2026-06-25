import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Category, SubCategory, Product } from '../../core/models';

export type ProductEditDialogData = {
  product?: Product;
  categories: Category[];
  subCategories: SubCategory[];
};

export type ProductEditDialogResult = {
  product: {
    id: number;
    sku: string;
    name: string;
    description: string;
    price: number;
    stockQty: number;
    categoryId: number;
    subCategoryId: number;
    imageFileName: string | null;
  };
  file?: File;
};

@Component({
  selector: 'app-product-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './product-edit-dialog.component.html',
  styleUrls: ['./product-edit-dialog.component.css']
})
export class ProductEditDialogComponent {
  selectedFile?: File;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<ProductEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductEditDialogData
  ) {
    this.form = this.fb.group({
      id: [0],
      sku: ['', [Validators.required, Validators.minLength(2)]],
      name: ['', [Validators.required]],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQty: [0, [Validators.required, Validators.min(0)]],
      categoryId: [0, [Validators.required]],
      subCategoryId: [0, [Validators.required]],
      imageFileName: ['']
    });

    const p = data.product;
    if (p) {
      this.form.patchValue({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description ?? '',
        price: p.price,
        stockQty: p.stockQty,
        categoryId: p.categoryId,
        subCategoryId: p.subCategoryId,
        imageFileName: p.imageFileName ?? ''
      });
    }
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    this.selectedFile = f ?? undefined;
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;

    const result: ProductEditDialogResult = {
      product: {
        id: Number(v.id ?? 0),
        sku: String(v.sku ?? '').trim(),
        name: String(v.name ?? '').trim(),
        description: String(v.description ?? '').trim(),
        price: Number(v.price ?? 0),
        stockQty: Number(v.stockQty ?? 0),
        categoryId: Number(v.categoryId ?? 0),
        subCategoryId: Number(v.subCategoryId ?? 0),
        imageFileName: String(v.imageFileName ?? '').trim() || null
      }
    };

    if (this.selectedFile) result.file = this.selectedFile;
    this.ref.close(result);
  }
}
