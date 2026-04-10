import api from './api';
import type { ProductCustomField } from './productApi';

export interface CustomProductFieldGroup {
  id: number;
  company_id: number;
  product_id: number | null;
  name: string;
  icon: string | null;
  is_default: boolean;
  display_order: number;
  fields?: ProductCustomField[];
  created_at: string;
  updated_at: string;
}

export interface FieldGroupFormData {
  name: string;
  icon?: string | null;
  is_default?: boolean;
  display_order?: number;
  product_id?: number | null;
}

// List groups — omit product_id for model-level, pass for product-level
export const getFieldGroups = async (productId?: number): Promise<CustomProductFieldGroup[]> => {
  const params = productId ? `?product_id=${productId}` : '';
  const response = await api.get(`/api/custom-product-field-groups${params}`);
  return response.data;
};

export const createFieldGroup = async (data: FieldGroupFormData): Promise<CustomProductFieldGroup> => {
  const response = await api.post('/api/custom-product-field-groups', data);
  return response.data;
};

export const updateFieldGroup = async (id: number, data: Partial<FieldGroupFormData>): Promise<CustomProductFieldGroup> => {
  const response = await api.put(`/api/custom-product-field-groups/${id}`, data);
  return response.data;
};

export const deleteFieldGroup = async (id: number): Promise<void> => {
  await api.delete(`/api/custom-product-field-groups/${id}`);
};

export default { getFieldGroups, createFieldGroup, updateFieldGroup, deleteFieldGroup };
