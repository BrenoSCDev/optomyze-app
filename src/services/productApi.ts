/**
 * PRODUCT API SERVICE
 * 
 * Handles all product-related API operations
 */

import api from './api';

export interface ProductMetadata {
  features?: string[];
  duration?: string;
  [key: string]: any;
}

export interface ProductCustomField {
  id: number;
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
  product_id: number;
  type: 'product';
}

export interface Product {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  sku: string;
  base_price: number;
  type: 'product' | 'service';
  category: string | null;
  is_active: boolean;
  metadata: ProductMetadata | null;
  fields?: ProductCustomField[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductFilters {
  search?: string;
  is_active?: boolean | null;
  type?: 'product' | 'service' | null;
  category?: string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  base_price: number | string;
  type: 'product' | 'service';
  category?: string;
  is_active: boolean;
  metadata?: ProductMetadata;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Get all products with filters and pagination
export const getProducts = async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.is_active !== null && filters.is_active !== undefined) {
    params.append('is_active', String(filters.is_active));
  }
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  if (filters.per_page) params.append('per_page', String(filters.per_page));
  if (filters.page) params.append('page', String(filters.page));

  const response = await api.get(`/api/products?${params.toString()}`);
  return response.data;
};

// Get single product by ID
export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/api/products/get/${id}`);
  const raw = response.data;
  return raw.product || raw.data || raw;
};

// Create a new product
export const createProduct = async (data: ProductFormData): Promise<ApiResponse<Product>> => {
  const response = await api.post('/api/products', data);
  return response.data;
};

// Update an existing product
export const updateProduct = async (id: number, data: ProductFormData): Promise<ApiResponse<Product>> => {
  const response = await api.put(`/api/products/${id}`, data);
  return response.data;
};

// Delete a product
export const deleteProduct = async (id: number): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};

// Toggle product active status
export const toggleProductActive = async (id: number): Promise<ApiResponse<Product>> => {
  const response = await api.post(`/api/products/${id}/toggle-active`);
  return response.data;
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
};
