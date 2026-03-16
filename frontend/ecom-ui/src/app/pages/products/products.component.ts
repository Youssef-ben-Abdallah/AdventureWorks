import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { Category, Product, SubCategory } from '../../core/models';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  loading = false;
  error = '';

  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  products: Product[] = [];

  // filters
  q = '';
  categoryId = 0;
  subCategoryId = 0;
  maxPrice?: number;

  // paging
  pageSize = 9; // 3 columns x 3 rows on desktop (responsive will adapt)
  page = 1;

  constructor(
    public catalog: CatalogService,
    private cart: CartService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = '';

    Promise.all([
      this.catalog.getCategories().toPromise(),
      this.catalog.getSubCategories().toPromise(),
      this.catalog.getProducts().toPromise(),
    ])
      .then(([cats, subs, prods]) => {
        this.categories = cats ?? [];
        this.subCategories = subs ?? [];
        this.products = prods ?? [];
        this.loading = false;
        this.resetPage();
      })
      .catch(e => {
        this.error = e?.error ?? e?.message ?? 'Failed to load products';
        this.loading = false;
      });
  }

  imgUrl(p: Product) {
    return this.catalog.imgUrl(p.imageFileName);
  }

  // ----- FILTERING -----
  get filtered(): Product[] {
    const q = (this.q || '').toLowerCase().trim();

    return this.products
      .filter(p => this.categoryId ? p.categoryId === this.categoryId : true)
      .filter(p => this.subCategoryId ? p.subCategoryId === this.subCategoryId : true)
      .filter(p => (this.maxPrice != null && this.maxPrice !== 0) ? p.price <= this.maxPrice! : true)
      .filter(p => q ? (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      ) : true);
  }

  get filteredTotal(): number {
    return this.filtered.length;
  }

  get subsForSelected(): SubCategory[] {
    return this.subCategories.filter(s => this.categoryId ? s.categoryId === this.categoryId : true);
  }

  onCategoryChange() {
    // reset subcategory if it doesn't belong
    if (this.subCategoryId && !this.subsForSelected.some(s => s.id === this.subCategoryId)) {
      this.subCategoryId = 0;
    }
    this.resetPage();
  }

  // ----- PAGING -----
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTotal / this.pageSize));
  }

  get pagedProducts(): Product[] {
    // clamp page if filters reduced the dataset
    if (this.page > this.totalPages) this.page = this.totalPages;

    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get startItem(): number {
    if (!this.filteredTotal) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    if (!this.filteredTotal) return 0;
    return Math.min(this.page * this.pageSize, this.filteredTotal);
  }

  resetPage() {
    this.page = 1;
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ----- CART -----
  addToCart(p: Product, qty: number = 1) {
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.cart.add(p, qty);
  }
}