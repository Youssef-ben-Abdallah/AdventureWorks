import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
    SlicePipe,
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
      ) : true)
      .sort((a, b) => {
        if (a.price === 0 && b.price !== 0) return 1;
        if (b.price === 0 && a.price !== 0) return -1;
        return 0;
      });
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

  goToPage(n: number) {
    this.page = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageRange(): number[] {
    const total = this.totalPages;
    const cur = this.page;
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, cur - delta); i <= Math.min(total, cur + delta); i++) {
      range.push(i);
    }
    return range;
  }

  // ----- CART -----
  addToCart(p: Product, qty: number = 1) {
    if (!this.auth.getToken()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.cart.add(p, qty);
  }

  clearFilters() {
    this.q = '';
    this.categoryId = 0;
    this.subCategoryId = 0;
    this.maxPrice = undefined;
    this.resetPage();
  }
}