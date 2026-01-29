/**
 * ERP API SERVICE
 * 
 * Handles all ERP-related API calls with centralized authentication.
 * Automatically fetches and caches the ERP API token from the CRM.
 */

import axios, { InternalAxiosRequestConfig } from 'axios';
import { ERPProductsResponse, ERPBudgetRequest, ERPBudgetResponse } from '@/types/erp';
import { ERP_URL } from '@/lib/constants';
import api from './api';

// Token cache
let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

/**
 * Fetches the ERP API token from the CRM.
 * Uses in-memory caching to avoid refetching on every request.
 * Handles concurrent requests by reusing the same promise.
 */
const fetchErpToken = async (): Promise<string> => {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // If a fetch is already in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Start fetching the token
  tokenFetchPromise = (async () => {
    try {
      const response = await api.get<{ message: string; api_key: string }>(
        '/api/integrations/optomyze-erp/api-key'
      );

      if (!response.data?.api_key) {
        throw new Error('Invalid API key response from CRM');
      }

      cachedToken = response.data.api_key;
      return cachedToken;
    } catch (error) {
      // Clear the promise so next request can retry
      tokenFetchPromise = null;
      throw new Error(
        `Failed to fetch ERP API token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  })();

  return tokenFetchPromise;
};

/**
 * Clears the cached token (useful for logout or token refresh scenarios)
 */
export const clearErpTokenCache = (): void => {
  cachedToken = null;
  tokenFetchPromise = null;
};

// Create axios instance for ERP
const erpApi = axios.create({
  baseURL: ERP_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token from CRM
erpApi.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await fetchErpToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      // Reject the request if we can't get a token
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (token expired/invalid)
erpApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401, clear the cache and let the next request refetch
    if (error.response?.status === 401) {
      clearErpTokenCache();
    }
    return Promise.reject(error);
  }
);

export const erpService = {
  /**
   * Fetch products and units from ERP
   */
  async getProductsAndUnits(): Promise<ERPProductsResponse> {
    const response = await erpApi.get<ERPProductsResponse>('/api/v1/products');
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
   * Fetch multiple budgets from ERP by IDs (batch)
   */
  async getBudgetsByIds(budgetIds: number[]): Promise<ERPBudgetResponse[]> {
    // Ensure budgetIds is a proper array of numbers
    const ids = Array.isArray(budgetIds) 
      ? budgetIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
      : [];
    
    const response = await erpApi.post<ERPBudgetResponse[]>('/api/v1/budgets/batch', {
      budget_ids: ids
    });
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

  /**
   * Clear the cached ERP token
   */
  clearTokenCache: clearErpTokenCache,
};

export default erpApi;
