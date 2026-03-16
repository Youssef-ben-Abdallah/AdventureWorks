import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { environment } from '../../core/api.config';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './product-details.component.html'
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  loading = false;
  error = '';
  qty = 1;

  constructor(private route: ActivatedRoute, private catalog: CatalogService, private cart: CartService,private auth: AuthService,private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid product id';
      return;
    }
    this.loading = true;
    this.catalog.getProduct(id).subscribe({
      next: p => { this.product = p; this.loading = false; },
      error: e => { this.error = e?.message ?? 'Failed to load'; this.loading = false; }
    });
  }

  imgUrl(p: Product): string {
    const file = p.imageFileName?.trim();
    return file
      ? `${environment.apiBaseUrl}/images/product/${encodeURIComponent(file)}`
      : `${environment.apiBaseUrl}/images/product/default.png`;
  }

  addToCart(p: Product, qty: number = 1) {
  if (!this.auth.getToken()) { // or this.auth.isLoggedIn()
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    return;
  }
  this.cart.add(p, qty);
  }
}