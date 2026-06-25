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
  getFreightAnalysis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/freight-analysis', { params });
    return response.data;
  },
  getTargetStatus: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/target-status', { params });
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
  },

  // Product Insights
  getProductCostAnalysis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/product-cost-analysis', { params });
    return response.data;
  },
  getDiscountByProduct: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/discount-by-product', { params });
    return response.data;
  },
  getOrderVolumeByProduct: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/order-volume-by-product', { params });
    return response.data;
  },
  getPriceGapAnalysis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/price-gap-analysis', { params });
    return response.data;
  },

  // Territory Map Detail
  getTerritoryDetail: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/territory-detail', { params });
    return response.data;
  },

  // Employee Performance
  getEmployeeKpis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/employee-kpis', { params });
    return response.data;
  },
  getTopEmployees: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/top-employees', { params });
    return response.data;
  },
  getEmployeeSalesByTerritory: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/employee-sales-by-territory', { params });
    return response.data;
  },
  getEmployeeAov: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/employee-aov', { params });
    return response.data;
  },

  // Promotions & Discounts
  getPromotionKpis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/promotion-kpis', { params });
    return response.data;
  },
  getSalesByPromotion: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/sales-by-promotion', { params });
    return response.data;
  },
  getDiscountTrend: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/discount-trend', { params });
    return response.data;
  },
  getSalesByCurrency: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/sales-by-currency', { params });
    return response.data;
  },

  // Order Fulfillment
  getFulfillmentKpis: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/fulfillment-kpis', { params });
    return response.data;
  },
  getShippingVolume: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/shipping-volume', { params });
    return response.data;
  },
  getFreightByTerritory: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/freight-by-territory', { params });
    return response.data;
  },
  getOrderShipLag: async (params: any) => {
    const response = await apiClient.get('/api/CubeInsights/order-ship-lag', { params });
    return response.data;
  }
};
