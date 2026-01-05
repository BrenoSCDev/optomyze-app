/**
 * ERP API SERVICE
 * 
 * Handles all ERP-related API calls
 */

import axios from 'axios';
import { ERPProductsResponse, ERPBudgetRequest, ERPBudgetResponse } from '@/types/erp';
import { ERP_URL } from '@/lib/constants';
import api from './api';

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

  /**
   * Create a budget in the ERP
   */
  async createBudget(budgetData: ERPBudgetRequest): Promise<ERPBudgetResponse> {
    const response = await erpApi.post<ERPBudgetResponse>('/api/v1/budgets', budgetData);
    return response.data;
  },

  /**
   * Link ERP budget to lead in CRM
   */
  async linkBudgetToLead(leadId: number, erpBudgetId: number): Promise<any> {
    const response = await api.post(`/api/leads/${leadId}/add-erp-budget`, {
      erp_budget_id: erpBudgetId
    });
    return response.data;
  },

  /**
   * Get budgets linked to a lead
   */
  async getLeadBudgets(leadId: number): Promise<any[]> {
    const response = await api.get(`/api/leads/${leadId}/erp-budgets`);
    return response.data;
  },
};

export default erpApi;
