import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Product } from '../types/models';

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  increment: () => void; // legacy
  add: (product: Product, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('ecom_cart_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        return parsed.filter(x => x && x.product && typeof x.product.id === 'number');
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ecom_cart_v1', JSON.stringify(items));
  }, [items]);

  const count = useMemo(() => items.reduce((sum, i) => sum + (i.qty || 0), 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + (i.qty * i.product.price), 0), [items]);

  const add = (product: Product, qty: number = 1) => {
    const q = Math.max(1, Number(qty || 1));
    setItems((prev) => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id 
          ? { ...i, qty: Math.min(i.qty + q, product.stockQty || 999999) } 
          : i);
      }
      return [...prev, { product, qty: Math.min(q, product.stockQty || 999999) }];
    });
  };

  const increment = () => {
    // This is a stub for the simple 'increment' we used before we had full product data
    // Used in legacy places where product isn't fully available yet
    console.warn("increment() is deprecated. use add(product, qty)");
  };

  const setQty = (productId: number, qty: number) => {
    const q = Math.max(0, Number(qty || 0));
    setItems((prev) => 
      prev.map(i => i.product.id === productId 
        ? { ...i, qty: Math.min(q, i.product.stockQty || 999999) } 
        : i)
      .filter(i => i.qty > 0)
    );
  };

  const remove = (productId: number) => {
    setItems((prev) => prev.filter(i => i.product.id !== productId));
  };

  const clear = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, count, total, increment, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
