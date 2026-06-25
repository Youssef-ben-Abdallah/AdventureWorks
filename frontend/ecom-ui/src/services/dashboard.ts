import { apiClient } from '../config/api';

export interface DashboardQuery {
  from?: string | null;
  to?: string | null;
  territoryId?: string | null;
  territoryGroup?: string | null;
  salesPersonId?: string | null;
  shipMethodId?: string | null;
  category?: string | null;
  subCategory?: string | null;
  currencyCode?: string | null;
  online?: boolean | null;
}

export const DashboardService = {
  getFilters: async () => {
    const response = await apiClient.get('/api/dashboard/filters');
    return response.data;
  },
  getOverview: async (query: DashboardQuery) => {
    const response = await apiClient.get('/api/dashboard/overview', { params: query });
    return response.data;
  },
  getProducts: async (query: DashboardQuery) => {
    const response = await apiClient.get('/api/dashboard/products', { params: query });
    return response.data;
  },
  getCustomers: async (query: DashboardQuery) => {
    const response = await apiClient.get('/api/dashboard/customers', { params: query });
    return response.data;
  },
  getSalesTeam: async (query: DashboardQuery) => {
    const response = await apiClient.get('/api/dashboard/sales-team', { params: query });
    return response.data;
  },
  getShipping: async (query: DashboardQuery) => {
    const response = await apiClient.get('/api/dashboard/shipping', { params: query });
    return response.data;
  },
  getDetails: async (query: DashboardQuery, page: number, pageSize: number) => {
    const params = { ...query, page, pageSize };
    const response = await apiClient.get('/api/dashboard/details', { params });
    return response.data;
  }
};
