import api from './api';

export interface CustomProductField {
  id: number;
  field_key: string;
  field_type: 'text' | 'title' | 'number' | 'boolean' | 'json' | 'date';
  field_value: string | null;
  created_at: string;
  updated_at: string;
}

export interface SettingsPanelResponse {
  customProductFields: CustomProductField[];
}

export interface CustomProductFieldPayload {
  field_key: string;
  field_type: 'text' | 'title' | 'number' | 'boolean' | 'json' | 'date';
  field_value?: string;
}

// Fetch settings panel data (including custom product fields)
export const getSettingsPanel = async (): Promise<SettingsPanelResponse> => {
  const response = await api.get('/api/settings-panel');
  return response.data;
};

// Create a new custom product field
export const createCustomProductField = async (
  data: CustomProductFieldPayload
): Promise<CustomProductField> => {
  const response = await api.post('/api/custom-product-fields', data);
  return response.data;
};

// Get a single custom product field by ID
export const getCustomProductField = async (
  id: number
): Promise<CustomProductField> => {
  const response = await api.get(`/api/custom-product-fields/${id}`);
  return response.data;
};

// Update a custom product field
export const updateCustomProductField = async (
  id: number,
  data: CustomProductFieldPayload
): Promise<CustomProductField> => {
  const response = await api.put(`/api/custom-product-fields/${id}`, data);
  return response.data;
};

// Delete a custom product field
export const deleteCustomProductField = async (
  id: number
): Promise<{ message: string }> => {
  const response = await api.delete(`/api/custom-product-fields/${id}`);
  return response.data;
};
