/**
 * PRODUCT CUSTOM FIELDS API SERVICE
 * 
 * Handles API operations for custom fields attached to products
 */

import api from './api';

export interface ProductCustomField {
  field_key: string;
  field_value: string | boolean | number | null;
}

// Add a custom field to a product
export const addProductCustomField = async (
  productId: number,
  data: { field_key: string; field_value?: string | boolean | number | null }
): Promise<ProductCustomField> => {
  const response = await api.post(`/api/products/${productId}/custom-fields`, data);
  return response.data;
};

// Update a custom field value on a product
export const updateProductCustomField = async (
  productId: number,
  fieldKey: string,
  data: { field_value: string | boolean | number | null }
): Promise<ProductCustomField> => {
  const response = await api.put(`/api/products/${productId}/custom-fields/${fieldKey}`, data);
  return response.data;
};

// Remove a custom field from a product
export const deleteProductCustomField = async (
  productId: number,
  fieldKey: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/api/products/${productId}/custom-fields/${fieldKey}`);
  return response.data;
};
