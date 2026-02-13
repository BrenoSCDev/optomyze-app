/**
 * LEAD PRODUCT SEARCH API
 * 
 * Search leads with their products of interest for deal creation.
 * Also handles product search and attaching products to leads.
 */

import api from './api';

export interface LeadProductPivot {
  lead_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface LeadProduct {
  id: number;
  name: string;
  pivot: LeadProductPivot;
}

export interface LeadWithProducts {
  id: number;
  first_name: string;
  last_name: string;
  funnel_id: number;
  products: LeadProduct[];
}

export interface ProductSearchResult {
  id: number;
  name: string;
  base_price: number;
}

/**
 * Search leads with their products of interest
 */
export const searchLeadsWithProducts = async (query: string): Promise<LeadWithProducts[]> => {
  const response = await api.get('/api/leads/search/products', {
    params: { q: query }
  });
  return response.data;
};

/**
 * Search products by name
 */
export const searchProducts = async (query: string): Promise<ProductSearchResult[]> => {
  const response = await api.get('/api/products/search', {
    params: { q: query }
  });
  return response.data;
};

/**
 * Add products to a lead (attach products of interest)
 */
export const addProductsToLead = async (leadId: number, products: { id: number; quantity: number }[]): Promise<void> => {
  await api.post(`/api/leads/${leadId}/products`, { products });
};
