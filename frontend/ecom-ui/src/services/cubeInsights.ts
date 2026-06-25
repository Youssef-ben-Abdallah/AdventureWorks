import { apiClient } from '../config/api';

export const CubeInsightsService = {
  getFilters: async () => {
    const response = await apiClient.get('/api/CubeInsights/filters');
    return response.data;
  },
  getKpis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/kpis', { params });
    return response.data;
  },
  getProfitAnalysis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/profit-analysis', { params });
    return response.data;
  },
  getSalesTrend: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/sales-trend', { params });
    return response.data;
  },
  getTopProducts: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/top-products', { params });
    return response.data;
  },
  getTerritorySales: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/territory-sales', { params });
    return response.data;
  }
};
