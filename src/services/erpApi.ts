/**
 * ERP API SERVICE
 * 
 * Handles all ERP-related API calls
 */

import axios from 'axios';
import { ERPProductsResponse } from '@/types/erp';
import { ERP_URL } from '@/lib/constants';

// Create axios instance for ERP
const erpApi = axios.create({
  baseURL: ERP_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
erpApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('optomyze_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const erpService = {
  /**
   * Fetch products and units from ERP
   */
  async getProductsAndUnits(): Promise<ERPProductsResponse> {
    const response = await erpApi.get<ERPProductsResponse>('/api/v1/products/1');
    return response.data;
  },
};

export default erpApi;
