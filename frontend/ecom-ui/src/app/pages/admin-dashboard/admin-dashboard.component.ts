import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CatalogService } from '../../core/services/catalog.service';
import { OrdersService } from '../../core/services/orders.service';
import { Category, SubCategory, Product, Order } from '../../core/models';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';

import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { ConfirmDialogComponent } from '../../shared/dialogs/confirm-dialog.component';
import { ProductEditDialogComponent } from './product-edit-dialog.component';
import { SimpleNameDialogComponent } from './simple-name-dialog.component';
import { OrderTicketDialogComponent } from './order-ticket-dialog.component';

const STATUSES: { id: number; label: string; icon: string }[] = [
  { id: 0, label: 'Pending', icon: 'schedule' },
  { id: 1, label: 'Paid', icon: 'paid' },
  { id: 2, label: 'Processing', icon: 'autorenew' },
  { id: 3, label: 'Shipped', icon: 'local_shipping' },
  { id: 4, label: 'Delivered', icon: 'check_circle' },
  { id: 5, label: 'Cancelled', icon: 'cancel' },
];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,

    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  products: Product[] = [];
  orders: Order[] = [];

  statuses = STATUSES;

  loading = false;
  error = '';

  // ====== MAT TABLE DATASOURCES ======
  catsDs = new MatTableDataSource<Category>([]);
  subsDs = new MatTableDataSource<SubCategory>([]);
  prodsDs = new MatTableDataSource<Product>([]);

  // columns
  catsCols = ['name', 'actions'];
  subsCols = ['name', 'categoryName', 'actions'];
  prodsCols = ['sku', 'name', 'categoryName', 'subCategoryName', 'price', 'stockQty', 'actions'];

  // ====== FILTER STATES ======
  catFilter = '';

  subTextFilter = '';
  subCategoryIdFilter: number | '' = '';

  prodTextFilter = '';
  prodCategoryIdFilter: number | '' = '';
  prodSubCategoryIdFilter: number | '' = '';

  // ====== PAGINATORS ======
  @ViewChild('catsPaginator') catsPaginator!: MatPaginator;
  @ViewChild('subsPaginator') subsPaginator!: MatPaginator;
  @ViewChild('prodsPaginator') prodsPaginator!: MatPaginator;

  // ====== SORTS ======
  @ViewChild('catsSort') catsSort!: MatSort;
  @ViewChild('subsSort') subsSort!: MatSort;
  @ViewChild('prodsSort') prodsSort!: MatSort;

  constructor(
    private catalog: CatalogService,
    private ordersSvc: OrdersService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Multi-field filters
    this.subsDs.filterPredicate = (row: SubCategory, filterJson: string) => {
      const f = JSON.parse(filterJson) as { text: string; categoryId: number | null };
      const t = (f.text || '').toLowerCase();

      const textOk =
        !t ||
        (row.name ?? '').toLowerCase().includes(t) ||
        (row.categoryName ?? '').toLowerCase().includes(t);

      const catOk = f.categoryId == null || row.categoryId === f.categoryId;

      return textOk && catOk;
    };

    this.prodsDs.filterPredicate = (row: Product, filterJson: string) => {
      const f = JSON.parse(filterJson) as { text: string; categoryId: number | null; subCategoryId: number | null };
      const t = (f.text || '').toLowerCase();

      const textOk =
        !t ||
        (row.sku ?? '').toLowerCase().includes(t) ||
        (row.name ?? '').toLowerCase().includes(t) ||
        (row.categoryName ?? '').toLowerCase().includes(t) ||
        (row.subCategoryName ?? '').toLowerCase().includes(t);

      const catOk = f.categoryId == null || row.categoryId === f.categoryId;
      const subOk = f.subCategoryId == null || row.subCategoryId === f.subCategoryId;

      return textOk && catOk && subOk;
    };

    this.reloadAll();
  }

  ngAfterViewInit(): void {
    // attach once view is ready
    this.catsDs.paginator = this.catsPaginator;
    this.subsDs.paginator = this.subsPaginator;
    this.prodsDs.paginator = this.prodsPaginator;

    this.catsDs.sort = this.catsSort;
    this.subsDs.sort = this.subsSort;
    this.prodsDs.sort = this.prodsSort;
  }

  reloadAll() {
    this.loading = true;
    this.error = '';

    Promise.all([
      this.catalog.getCategories().toPromise(),
      this.catalog.getSubCategories().toPromise(),
      this.catalog.getProducts().toPromise(),
      this.ordersSvc.allOrders().toPromise()
    ])
      .then(([cats, subs, prods, orders]) => {
        this.categories = cats ?? [];
        this.subCategories = subs ?? [];
        this.products = prods ?? [];
        this.orders = orders ?? [];

        // push into tables
        this.catsDs.data = this.categories;
        this.subsDs.data = this.subCategories;
        this.prodsDs.data = this.products;

        // re-apply filters after refresh
        this.applyCatFilter();
        this.applySubFilter();
        this.applyProdFilter();

        this.loading = false;
      })
      .catch(err => {
        this.error = err?.error ?? err?.message ?? 'Failed';
        this.loading = false;
      });
  }

  // ===================== FILTER ACTIONS =====================
  applyCatFilter() {
    const v = (this.catFilter || '').trim().toLowerCase();
    this.catsDs.filter = v;
    this.catsDs.paginator?.firstPage();
  }

  applySubFilter() {
    const payload = {
      text: (this.subTextFilter || '').trim().toLowerCase(),
      categoryId: this.subCategoryIdFilter === '' ? null : Number(this.subCategoryIdFilter),
    };
    this.subsDs.filter = JSON.stringify(payload);
    this.subsDs.paginator?.firstPage();
  }

  onProdCategoryChange() {
    // reset sub filter when category changes
    this.prodSubCategoryIdFilter = '';
    this.applyProdFilter();
  }

  applyProdFilter() {
    const payload = {
      text: (this.prodTextFilter || '').trim().toLowerCase(),
      categoryId: this.prodCategoryIdFilter === '' ? null : Number(this.prodCategoryIdFilter),
      subCategoryId: this.prodSubCategoryIdFilter === '' ? null : Number(this.prodSubCategoryIdFilter),
    };
    this.prodsDs.filter = JSON.stringify(payload);
    this.prodsDs.paginator?.firstPage();
  }

  filteredSubCatsForProduct(): SubCategory[] {
    if (this.prodCategoryIdFilter === '') return this.subCategories;
    const catId = Number(this.prodCategoryIdFilter);
    return this.subCategories.filter(s => s.categoryId === catId);
  }

  // ===================== CRUD: CATEGORIES =====================
  newCategory() {
    const ref = this.dialog.open(SimpleNameDialogComponent, {
      width: '420px',
      data: { title: 'New category', nameLabel: 'Category name', name: '' }
    });

    ref.afterClosed().subscribe(v => {
      if (!v?.name) return;
      this.catalog.createCategory(v.name).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  editCategory(c: Category) {
    const ref = this.dialog.open(SimpleNameDialogComponent, {
      width: '420px',
      data: { title: 'Edit category', nameLabel: 'Category name', name: c.name }
    });

    ref.afterClosed().subscribe(v => {
      if (!v?.name) return;
      this.catalog.updateCategory(c.id, v.name).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  deleteCategory(c: Category) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Delete category', message: `Delete "${c.name}"?`, confirmText: 'Delete' }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.catalog.deleteCategory(c.id).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  // ===================== CRUD: SUB-CATEGORIES =====================
  newSubCategory() {
    const ref = this.dialog.open(SimpleNameDialogComponent, {
      width: '420px',
      data: { title: 'New sub-category', nameLabel: 'Sub-category name', name: '', categoryId: 0, categories: this.categories }
    });

    ref.afterClosed().subscribe(v => {
      if (!v?.name || !v?.categoryId) return;
      this.catalog.createSubCategory(v.name, v.categoryId).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  editSubCategory(s: SubCategory) {
    const ref = this.dialog.open(SimpleNameDialogComponent, {
      width: '420px',
      data: { title: 'Edit sub-category', nameLabel: 'Sub-category name', name: s.name, categoryId: s.categoryId, categories: this.categories }
    });

    ref.afterClosed().subscribe(v => {
      if (!v?.name || !v?.categoryId) return;
      this.catalog.updateSubCategory(s.id, v.name, v.categoryId).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  deleteSubCategory(s: SubCategory) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Delete sub-category', message: `Delete "${s.name}"?`, confirmText: 'Delete' }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.catalog.deleteSubCategory(s.id).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  // ===================== CRUD: PRODUCTS =====================
  newProduct() {
    const ref = this.dialog.open(ProductEditDialogComponent, {
      width: '720px',
      data: { categories: this.categories, subCategories: this.subCategories }
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      const dto = res.product;

      this.catalog.createProduct(dto).subscribe({
        next: (created: any) => {
          const id = created?.id ?? created?.Id;
          if (id && res.file) {
            this.catalog.uploadProductImage(id, res.file).subscribe({
              next: () => this.reloadAll(),
              error: e => {
                this.error = e?.error ?? e?.message ?? 'Upload failed';
                this.reloadAll();
              }
            });
          } else {
            this.reloadAll();
          }
        },
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  editProduct(p: Product) {
    const ref = this.dialog.open(ProductEditDialogComponent, {
      width: '720px',
      data: { product: p, categories: this.categories, subCategories: this.subCategories }
    });

    ref.afterClosed().subscribe(res => {
      if (!res) return;
      const dto = res.product;

      this.catalog.updateProduct(p.id, dto).subscribe({
        next: () => {
          if (res.file) {
            this.catalog.uploadProductImage(p.id, res.file).subscribe({
              next: () => this.reloadAll(),
              error: e => {
                this.error = e?.error ?? e?.message ?? 'Upload failed';
                this.reloadAll();
              }
            });
          } else {
            this.reloadAll();
          }
        },
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  deleteProduct(p: Product) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { title: 'Delete product', message: `Delete "${p.name}"?`, confirmText: 'Delete' }
    });

    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.catalog.deleteProduct(p.id).subscribe({
        next: () => this.reloadAll(),
        error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
      });
    });
  }

  // ===================== ORDERS =====================
  changeStatus(o: Order, statusId: number) {
    this.ordersSvc.updateStatus(o.id, statusId).subscribe({
      next: () => this.reloadAll(),
      error: e => (this.error = e?.error ?? e?.message ?? 'Failed')
    });
  }

  statusLabel(id: number) {
    return this.statuses.find(s => s.id === id)?.label ?? 'Unknown';
  }

  statusIcon(id: number) {
    return this.statuses.find(s => s.id === id)?.icon ?? 'help';
  }

  statusChipStyle(id: number) {
    switch (id) {
      case 0: return { '--mdc-chip-elevated-container-color': '#fff3cd', '--mdc-chip-label-text-color': '#856404', '--mdc-chip-with-icon-icon-color': '#856404' };
      case 1: return { '--mdc-chip-elevated-container-color': '#d1ecf1', '--mdc-chip-label-text-color': '#0c5460', '--mdc-chip-with-icon-icon-color': '#0c5460' };
      case 2: return { '--mdc-chip-elevated-container-color': '#e2e3ff', '--mdc-chip-label-text-color': '#3f51b5', '--mdc-chip-with-icon-icon-color': '#3f51b5' };
      case 3: return { '--mdc-chip-elevated-container-color': '#d4edda', '--mdc-chip-label-text-color': '#155724', '--mdc-chip-with-icon-icon-color': '#155724' };
      case 4: return { '--mdc-chip-elevated-container-color': '#c3f7d0', '--mdc-chip-label-text-color': '#0f5132', '--mdc-chip-with-icon-icon-color': '#0f5132' };
      case 5: return { '--mdc-chip-elevated-container-color': '#f8d7da', '--mdc-chip-label-text-color': '#721c24', '--mdc-chip-with-icon-icon-color': '#721c24' };
      default: return { '--mdc-chip-elevated-container-color': '#e2e3e5', '--mdc-chip-label-text-color': '#383d41', '--mdc-chip-with-icon-icon-color': '#383d41' };
    }
  }

  viewTicket(o: Order) {
    this.dialog.open(OrderTicketDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'ticket-dialog',
      data: { order: o }
    });
  }
}