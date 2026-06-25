import { apiClient } from '../config/api';
import { Order } from '../types/models';

export const OrdersService = {
  createOrder: async (payload: any) => {
    const response = await apiClient.post('/api/orders', payload);
    return response.data;
  },
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/orders');
    return response.data;
  },
  myOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/orders/mine');
    return response.data;
  },
  allOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/orders');
    return response.data;
  },
  updateStatus: async (id: number, statusId: number) => {
    const response = await apiClient.patch(`/api/orders/${id}/status`, { status: statusId });
    return response.data;
  },
  deleteOrder: async (id: number) => {
    const response = await apiClient.delete(`/api/orders/${id}`);
    return response.data;
  }
};
