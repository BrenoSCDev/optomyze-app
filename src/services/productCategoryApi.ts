import api from './api';

export interface ProductCategory {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  color: string | null;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCategoryFormData {
  name: string;
  description?: string;
  color?: string;
}

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await api.get('/api/product-categories');
  return response.data;
};

export const createProductCategory = async (data: ProductCategoryFormData): Promise<ProductCategory> => {
  const response = await api.post('/api/product-categories', data);
  return response.data;
};

export const updateProductCategory = async (id: number, data: ProductCategoryFormData): Promise<ProductCategory> => {
  const response = await api.put(`/api/product-categories/${id}`, data);
  return response.data;
};

export const deleteProductCategory = async (id: number): Promise<void> => {
  await api.delete(`/api/product-categories/${id}`);
};

export const syncProductCategories = async (productId: number, categoryIds: number[]): Promise<ProductCategory[]> => {
  const response = await api.post(`/api/products/${productId}/categories/sync`, { category_ids: categoryIds });
  return response.data.categories;
};
