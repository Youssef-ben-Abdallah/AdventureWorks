import { apiClient, environment } from '../config/api';
import { Product, Category, SubCategory } from '../types/models';

export const CatalogService = {
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/categories');
    return response.data;
  },
  getSubCategories: async (): Promise<SubCategory[]> => {
    const response = await apiClient.get<SubCategory[]>('/api/subcategories');
    return response.data;
  },
  getProducts: async (params?: any): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/products', { params });
    return response.data;
  },
  getProduct: async (id: string | number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return response.data;
  },
  imgUrl: (filename: string | null | undefined): string => {
    if (!filename || filename === 'no_image_available_small.gif') return '';
    return `http://localhost:57241/images/product/${filename}`;
  },

  // Admin CRUD - Categories
  createCategory: async (name: string) => {
    const response = await apiClient.post('/api/categories', { name });
    return response.data;
  },
  updateCategory: async (id: number, name: string) => {
    const response = await apiClient.put(`/api/categories/${id}`, { name });
    return response.data;
  },
  deleteCategory: async (id: number) => {
    const response = await apiClient.delete(`/api/categories/${id}`);
    return response.data;
  },

  // Admin CRUD - SubCategories
  createSubCategory: async (name: string, categoryId: number) => {
    const response = await apiClient.post('/api/subcategories', { name, categoryId });
    return response.data;
  },
  updateSubCategory: async (id: number, name: string, categoryId: number) => {
    const response = await apiClient.put(`/api/subcategories/${id}`, { name, categoryId });
    return response.data;
  },
  deleteSubCategory: async (id: number) => {
    const response = await apiClient.delete(`/api/subcategories/${id}`);
    return response.data;
  },

  // Admin CRUD - Products
  createProduct: async (product: any) => {
    const response = await apiClient.post('/api/products', product);
    return response.data;
  },
  updateProduct: async (id: number, product: any) => {
    const response = await apiClient.put(`/api/products/${id}`, product);
    return response.data;
  },
  deleteProduct: async (id: number) => {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  },
  uploadProductImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/api/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
