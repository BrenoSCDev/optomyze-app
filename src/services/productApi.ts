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
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'title' | 'json';
  field_value: string;
  product_id: number;
  group_id?: number | null;
  type: 'product' | 'model';
  icon?: string | null;
  display_order?: number;
}

export interface ProductCategory {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  color: string | null;
  products_count?: number;
}

export interface ProductFieldGroup {
  id: number;
  name: string;
  icon: string | null;
  is_default: boolean;
  display_order: number;
  fields?: ProductCustomField[];
}

export interface Product {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  sku: string;
  base_price: number;
  type: 'product' | 'service' | 'digital';
  category: string | null;
  is_active: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  archived_at: string | null;
  metadata: ProductMetadata | null;
  fields?: ProductCustomField[];
  fieldGroups?: ProductFieldGroup[];
  categories?: ProductCategory[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductFilters {
  search?: string;
  is_active?: boolean | null;
  is_favorite?: boolean | null;
  archived?: boolean | null;
  type?: 'product' | 'service' | null;
  category?: string | null;
  category_id?: number | null;
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
  type: 'product' | 'service' | 'digital';
  category?: string;
  is_active: boolean;
  is_favorite?: boolean;
  metadata?: ProductMetadata;
  category_ids?: number[];
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
  if (filters.is_favorite !== null && filters.is_favorite !== undefined) {
    params.append('is_favorite', String(filters.is_favorite));
  }
  if (filters.archived !== null && filters.archived !== undefined) {
    params.append('archived', String(filters.archived));
  }
  if (filters.type) params.append('type', filters.type);
  if (filters.category) params.append('category', filters.category);
  if (filters.category_id) params.append('category_id', String(filters.category_id));
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

// Toggle product favorite status
export const toggleProductFavorite = async (id: number): Promise<ApiResponse<Product>> => {
  const response = await api.post(`/api/products/${id}/toggle-favorite`);
  return response.data;
};

// Archive a product
export const archiveProduct = async (id: number): Promise<ApiResponse<Product>> => {
  const response = await api.post(`/api/products/${id}/archive`);
  return response.data;
};

// Unarchive a product
export const unarchiveProduct = async (id: number): Promise<ApiResponse<Product>> => {
  const response = await api.post(`/api/products/${id}/unarchive`);
  return response.data;
};

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  toggleProductFavorite,
  archiveProduct,
  unarchiveProduct,
};
