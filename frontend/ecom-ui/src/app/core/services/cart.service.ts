import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models';

export interface CartItem {
  product: Product;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'ecom_cart_v1';
  private readonly _items$ = new BehaviorSubject<CartItem[]>(this.load());

  items$ = this._items$.asObservable();

  get items(): CartItem[] { return this._items$.value; }

  get count(): number {
    return this.items.reduce((sum, i) => sum + (i.qty || 0), 0);
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + (i.qty * i.product.price), 0);
  }

  add(product: Product, qty = 1) {
    const q = Math.max(1, Number(qty || 1));
    const items = [...this.items];
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + q, product.stockQty || 999999);
    } else {
      items.push({ product, qty: Math.min(q, product.stockQty || 999999) });
    }
    this.set(items);
  }

  setQty(productId: number, qty: number) {
    const q = Math.max(0, Number(qty || 0));
    const items = this.items
      .map(i => i.product.id === productId
        ? ({ ...i, qty: Math.min(q, i.product.stockQty || 999999) })
        : i)
      .filter(i => i.qty > 0);
    this.set(items);
  }

  remove(productId: number) {
    this.set(this.items.filter(i => i.product.id !== productId));
  }

  clear() {
    this.set([]);
  }

  private set(items: CartItem[]) {
    this._items$.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items.map(i => ({ product: i.product, qty: i.qty }))));
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(x => x && x.product && typeof x.product.id === 'number')
        .map(x => ({ product: x.product, qty: Number(x.qty || 1) }));
    } catch {
      return [];
    }
  }
}
