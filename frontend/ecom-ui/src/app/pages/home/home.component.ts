import { Component, OnInit } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { CatalogService } from '../../core/services/catalog.service';
import { Product } from '../../core/models';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { Observable } from 'rxjs';

interface Feature {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  gradient: string;
}

interface Module {
  icon: string;
  title: string;
  desc: string;
  bullets: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, SlicePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  top: Product[] = [];
  filteredTop: Product[] = [];
  loading = false;
  error = '';
  totalProducts = 0;
  totalCategories = 4;
  selectedCategory = 0;
  isLoggedIn$!: Observable<boolean>;

  features: Feature[] = [
    {
      icon: 'pedal_bike',
      title: 'Premium Bike Catalog',
      desc: 'Road, mountain, touring and e-bikes with rich product data — model, size, color, price and category structure.',
      tag: '500+ bikes',
      gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))'
    },
    {
      icon: 'build',
      title: 'Parts & Components',
      desc: 'Complete drivetrain, wheels, brakes and accessories — perfect for basket insights and cross-sell recommendations.',
      tag: 'Components & Accessories',
      gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))'
    },
    {
      icon: 'analytics',
      title: 'Sales Analytics',
      desc: 'Real historical order data enabling territory analysis, revenue trends, seasonality and growth comparisons.',
      tag: 'Powered by AW2019',
      gradient: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))'
    },
    {
      icon: 'groups',
      title: 'Customer Intelligence',
      desc: 'Customer profiles, buying behavior, segmentation signals — useful for loyalty and cohort tracking.',
      tag: 'CRM-ready',
      gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))'
    }
  ];

  modules: Module[] = [
    {
      icon: 'pedal_bike',
      title: 'Products: Bikes',
      desc: 'Road, mountain, touring, e-bikes — described by model, size, color, price, and category structure.',
      bullets: ['Top sellers, price bands, stock awareness', 'Category/subcategory browsing and product detail pages']
    },
    {
      icon: 'build',
      title: 'Parts & Accessories',
      desc: 'Components (drivetrain, wheels, brakes) plus accessories (helmets, lights, bags).',
      bullets: ['Basket insights ("often bought together")', 'Cross-sell recommendations on product pages']
    },
    {
      icon: 'groups',
      title: 'Customers',
      desc: 'Customer profiles, buying behavior over time, and segmentation signals.',
      bullets: ['Loyalty, repeat purchase rates, and cohort tracking', 'Pairs naturally with territory + time for trend analysis']
    },
    {
      icon: 'public',
      title: 'Territories & Time',
      desc: 'Regions/territories plus date breakdowns enable dashboard KPIs and drilldowns.',
      bullets: ['Sales by territory, month, quarter, year', 'Trend lines, seasonality, growth comparisons']
    }
  ];

  constructor(
    public catalog: CatalogService,
    private cart: CartService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$;
    this.loading = true;
    this.catalog.getProducts().subscribe({
      next: rows => {
        this.products = rows;
        this.totalProducts = rows.length;
        this.top = this.pickRandom(rows, 6);
        this.filteredTop = [...this.top];
        this.loading = false;
      },
      error: err => {
        this.error = err?.message ?? 'Failed to load products';
        this.loading = false;
      }
    });
  }

  imgUrl(p: Product): string { return this.catalog.imgUrl(p.imageFileName); }

  setCategory(id: number) {
    this.selectedCategory = id;
    if (id === 0) {
      this.filteredTop = this.pickRandom(this.products, 6);
    } else {
      const filtered = this.products.filter(p => p.categoryId === id);
      this.filteredTop = this.pickRandom(filtered.length > 0 ? filtered : this.products, 6);
    }
  }

  addToCart(p: Product, qty: number = 1) {
    if (!this.auth.getToken()) {
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
    const picked = copy.slice(0, take);
    return picked.sort((a, b) => {
      if (a.price === 0 && b.price !== 0) return 1;
      if (b.price === 0 && a.price !== 0) return -1;
      return 0;
    });
  }
}
