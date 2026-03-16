import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  top: Product[] = [];
  loading = false;
  error = '';

  constructor(public catalog: CatalogService, private cart: CartService,private auth: AuthService,private router: Router) {}

  ngOnInit(): void {
    this.loading = true;
    this.catalog.getProducts().subscribe({
      next: rows => {
        this.products = rows;
        this.top = this.products.slice(0, 6);
        this.loading = false;
      },
      error: err => { this.error = err?.message ?? 'Failed to load'; this.loading = false; }
    });
  }

  imgUrl(p: Product): string { return this.catalog.imgUrl(p.imageFileName); }

  addToCart(p: Product, qty: number = 1) {
  if (!this.auth.getToken()) { // or this.auth.isLoggedIn()
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.cart.add(p, qty);
  }
  private pickRandom(list: Product[], take: number): Product[] {
    const copy = [...(list ?? [])];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, take);
  }
}
