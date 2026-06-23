import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

import { CartService, CartItem } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { CatalogService } from '../../core/services/catalog.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  items: CartItem[] = [];
  loading = false;
  error = '';
  private sub?: Subscription;

  constructor(
    public cart: CartService,
    private orders: OrdersService,
    private catalog: CatalogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.cart.items$.subscribe(items => this.items = items);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  imgUrl(fileName?: string | null) {
    return this.catalog.imgUrl(fileName);
  }

  inc(i: CartItem) { this.cart.setQty(i.product.id, i.qty + 1); }
  dec(i: CartItem) { this.cart.setQty(i.product.id, i.qty - 1); }
  update(i: CartItem, v: any) {
    this.cart.setQty(i.product.id, Number(v));
  }

  customerID = 1;
  billToAddressID = 1;
  shipToAddressID = 1;
  shipMethodID = 1;

  checkout() {
    if (this.items.length === 0) return;
    this.loading = true;
    this.error = '';

    const payload = {
      items: this.items.map(i => ({ productId: i.product.id, qty: i.qty })),
      customerID: this.customerID,
      billToAddressID: this.billToAddressID,
      shipToAddressID: this.shipToAddressID,
      shipMethodID: this.shipMethodID
    };
    
    this.orders.createOrder(payload as any).subscribe({
      next: () => {
        this.cart.clear();
        this.loading = false;
        this.router.navigateByUrl('/orders');
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error ?? e?.message ?? 'Checkout failed';
      }
    });
  }
}
