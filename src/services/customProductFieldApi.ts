/**
 * CUSTOM PRODUCT FIELD API SERVICE
 * 
 * Handles all custom product field-related API operations
 */

import api from './api';

export type FieldType = 'title' | 'text' | 'number' | 'boolean' | 'json' | 'date' | 'select' | 'multiselect';

export interface CustomProductField {
  id: number;
  product_id: number;
  field_key: string;
  field_type: FieldType;
  label: string;
  options: string[] | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomProductFieldFilters {
  product_id?: number;
  visible_only?: boolean;
}

export interface CustomProductFieldFormData {
  product_id: number;
  field_key: string;
  field_type: FieldType;
  label: string;
  options?: string[] | null;
  display_order?: number;
  is_visible?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Get all custom product fields with optional filters
export const getCustomProductFields = async (filters: CustomProductFieldFilters = {}): Promise<CustomProductField[]> => {
  const params = new URLSearchParams();
  
  if (filters.product_id) params.append('product_id', String(filters.product_id));
  if (filters.visible_only) params.append('visible_only', 'true');

  const response = await api.get(`/api/custom-product-fields?${params.toString()}`);
  return response.data.data || response.data;
};

// Get single custom product field by ID
export const getCustomProductField = async (id: number): Promise<CustomProductField> => {
  const response = await api.get(`/api/custom-product-fields/${id}`);
  return response.data.data || response.data;
};

// Create a new custom product field
export const createCustomProductField = async (data: CustomProductFieldFormData): Promise<ApiResponse<CustomProductField>> => {
  const response = await api.post('/api/custom-product-fields', data);
  return response.data;
};

// Update an existing custom product field
export const updateCustomProductField = async (id: number, data: Partial<CustomProductFieldFormData>): Promise<ApiResponse<CustomProductField>> => {
  const response = await api.put(`/api/custom-product-fields/${id}`, data);
  return response.data;
};

// Delete a custom product field
export const deleteCustomProductField = async (id: number): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/api/custom-product-fields/${id}`);
  return response.data;
};

export default {
  getCustomProductFields,
  getCustomProductField,
  createCustomProductField,
  updateCustomProductField,
  deleteCustomProductField,
};
