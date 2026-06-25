export interface Product {
  id: number;
  sku: string;
  name: string;
  productNumber: string;
  color: string;
  price: number;
  size: string;
  weight: number;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  modelId: number;
  modelName: string;
  description: string;
  imageFileName: string;
  stockQty: number;
}

export interface Category {
  id: number;
  name: string;
}

export interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
}

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
  status: number;
  total: number;
  items: OrderItem[];
}
