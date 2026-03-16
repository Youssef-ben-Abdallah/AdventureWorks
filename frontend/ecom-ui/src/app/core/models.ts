export interface Category { id: number; name: string; }
export interface SubCategory { id: number; name: string; categoryId: number; categoryName: string; }

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  stockQty: number;
  imageFileName?: string | null;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
}

export type OrderStatus = 'Pending'|'Paid'|'Processing'|'Shipped'|'Delivered'|'Cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  createdAtUtc: string;
  status: OrderStatus;
  userId: string;
  username: string;
  total: number;
  items: OrderItem[];
}

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  username: string;
  email: string;
  roles: string[];
}
