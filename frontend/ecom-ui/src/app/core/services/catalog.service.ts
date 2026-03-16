import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../api.config';
import { Category, SubCategory, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private http: HttpClient) {}

  imgUrl(fileName?: string | null): string {
    const file = (fileName ?? '').trim();
    return file
      ? `${environment.apiBaseUrl}/images/product/${encodeURIComponent(file)}`
      : `${environment.apiBaseUrl}/images/product/default.png`;
  }

  getProducts() { return this.http.get<Product[]>(`${environment.apiBaseUrl}/api/products`); }
  getProduct(id: number) { return this.http.get<Product>(`${environment.apiBaseUrl}/api/products/${id}`); }

  getCategories() { return this.http.get<Category[]>(`${environment.apiBaseUrl}/api/categories`); }
  createCategory(name: string) { return this.http.post<Category>(`${environment.apiBaseUrl}/api/categories`, { name }); }
  updateCategory(id: number, name: string) { return this.http.put(`${environment.apiBaseUrl}/api/categories/${id}`, { name }); }
  deleteCategory(id: number) { return this.http.delete(`${environment.apiBaseUrl}/api/categories/${id}`); }

  getSubCategories() { return this.http.get<SubCategory[]>(`${environment.apiBaseUrl}/api/subcategories`); }
  createSubCategory(name: string, categoryId: number) {
    return this.http.post(`${environment.apiBaseUrl}/api/subcategories`, { name, categoryId });
  }
  updateSubCategory(id: number, name: string, categoryId: number) {
    return this.http.put(`${environment.apiBaseUrl}/api/subcategories/${id}`, { name, categoryId });
  }
  deleteSubCategory(id: number) { return this.http.delete(`${environment.apiBaseUrl}/api/subcategories/${id}`); }

  createProduct(dto: any) { return this.http.post(`${environment.apiBaseUrl}/api/products`, dto); }
  updateProduct(id: number, dto: any) { return this.http.put(`${environment.apiBaseUrl}/api/products/${id}`, dto); }
  deleteProduct(id: number) { return this.http.delete(`${environment.apiBaseUrl}/api/products/${id}`); }

  uploadProductImage(productId: number, file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${environment.apiBaseUrl}/api/products/${productId}/image`, form);
  }
}
