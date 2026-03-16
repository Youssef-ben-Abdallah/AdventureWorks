import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Category } from '../../core/models';

export type SimpleNameDialogData = {
  title: string;
  nameLabel: string;
  name: string;
  categoryId?: number;
  categories?: Category[];
};

@Component({
  selector: 'app-simple-name-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <div mat-dialog-content>
        <mat-form-field appearance="outline" style="width:100%;">
          <mat-label>{{ data.nameLabel }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-form-field *ngIf="data.categories?.length" appearance="outline" style="width:100%;margin-top:10px;">
          <mat-label>Category</mat-label>
          <mat-select formControlName="categoryId">
            <mat-option *ngFor="let c of data.categories" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Save</button>
      </div>
    </form>
  `
})
export class SimpleNameDialogComponent {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<SimpleNameDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SimpleNameDialogData
  ) {
    // Re-create after fb injection (avoids TS2729 "used before init")
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: [0]
    });

    this.form.patchValue({
      name: data.name ?? '',
      categoryId: data.categoryId ?? 0
    });
    if (data.categories?.length) {
      this.form.controls['categoryId'].addValidators([Validators.required, Validators.min(1)]);
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.ref.close({
      name: String(v.name ?? '').trim(),
      categoryId: Number(v.categoryId ?? 0)
    });
  }
}
