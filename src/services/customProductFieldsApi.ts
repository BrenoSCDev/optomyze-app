/**
 * CUSTOM PRODUCT FIELDS API SERVICE
 * 
 * Handles all custom product field-related API operations
 */

import api from './api';

export interface CustomProductField {
  id: number;
  company_id: number;
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
  type: 'model' | 'product';
  product_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CustomProductFieldFormData {
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string | number;
  type: 'model' | 'product';
  product_id?: number | null;
}

export interface SettingsPanelResponse {
  customProductFields: CustomProductField[];
}

// Get settings panel (including custom product fields)
export const getSettingsPanel = async (): Promise<SettingsPanelResponse> => {
  const response = await api.get('/api/settings-panel');
  return response.data;
};

// Create a new custom product field
export const createCustomProductField = async (data: CustomProductFieldFormData): Promise<CustomProductField> => {
  const response = await api.post('/api/custom-product-fields', data);
  return response.data.data || response.data;
};

// Update an existing custom product field
export const updateCustomProductField = async (id: number, data: CustomProductFieldFormData): Promise<CustomProductField> => {
  const response = await api.put(`/api/custom-product-fields/${id}`, data);
  return response.data.data || response.data;
};

// Delete a custom product field
export const deleteCustomProductField = async (id: number): Promise<void> => {
  await api.delete(`/api/custom-product-fields/${id}`);
};

export default {
  getSettingsPanel,
  createCustomProductField,
  updateCustomProductField,
  deleteCustomProductField,
};
