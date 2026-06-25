import { apiClient, environment } from '../config/api';
import { Product, Category, SubCategory } from '../types/models';

export const CatalogService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/catalog/categories');
    return response.data;
  },
  getSubCategories: async (): Promise<SubCategory[]> => {
    const response = await apiClient.get<SubCategory[]>('/api/catalog/subcategories');
    return response.data;
  },
  getProducts: async (params?: any): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/catalog/products', { params });
    return response.data;
  },
  getProduct: async (id: string | number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/catalog/products/${id}`);
    return response.data;
  },
  imgUrl: (filename: string | null | undefined): string => {
    if (!filename) return '';
    return `http://localhost:57241/images/products/${filename}`;
  },

  // Admin CRUD - Categories
  createCategory: async (name: string) => {
    const response = await apiClient.post('/api/catalog/categories', { name });
    return response.data;
  },
  updateCategory: async (id: number, name: string) => {
    const response = await apiClient.put(`/api/catalog/categories/${id}`, { name });
    return response.data;
  },
  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/api/catalog/categories/${id}`);
    return response.data;
  },

  // Admin CRUD - SubCategories
  createSubCategory: async (name: string, categoryId: number) => {
    const response = await apiClient.post('/api/catalog/subcategories', { name, categoryId });
    return response.data;
  },
  updateSubCategory: async (id: number, name: string, categoryId: number) => {
    const response = await apiClient.put(`/api/catalog/subcategories/${id}`, { name, categoryId });
    return response.data;
  },
  deleteSubCategory: async (id: number) => {
    const response = await apiClient.delete(`/api/catalog/subcategories/${id}`);
    return response.data;
  },

  // Admin CRUD - Products
  createProduct: async (product: any) => {
    const response = await apiClient.post('/api/catalog/products', product);
    return response.data;
  },
  updateProduct: async (id: number, product: any) => {
    const response = await apiClient.put(`/api/catalog/products/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await apiClient.delete(`/api/catalog/products/${id}`);
    return response.data;
  },
  uploadProductImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/catalog/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
