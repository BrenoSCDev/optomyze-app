/**
 * PRODUCT IMAGE API SERVICE
 * 
 * Handles all product image-related API operations
 */

import api, { API_BASE_URL } from './api';

// Helper to get full image URL
export const getFullImageUrl = (url: string): string => {
  if (!url || url === '/placeholder.svg') return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}/${url.replace(/^\//, '')}`;
};

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt_text: string | null;
  image_type: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImageUploadData {
  image: File;
  alt_text?: string;
  image_type?: string;
  is_primary?: boolean;
}

export interface ProductImageUpdateData {
  alt_text?: string;
  image_type?: string;
  display_order?: number;
}

export interface ReorderImageData {
  id: number;
  display_order: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Get all images for a product
export const getProductImages = async (productId: number): Promise<ProductImage[]> => {
  const response = await api.get(`/api/products/${productId}/images`);
  return response.data.data || response.data;
};

// Upload a new image for a product
export const uploadProductImage = async (
  productId: number, 
  data: ProductImageUploadData
): Promise<ApiResponse<ProductImage>> => {
  const formData = new FormData();
  formData.append('image', data.image);
  if (data.alt_text) formData.append('alt_text', data.alt_text);
  if (data.image_type) formData.append('image_type', data.image_type);
  if (data.is_primary !== undefined) formData.append('is_primary', String(data.is_primary));

  const response = await api.post(`/api/products/${productId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update image metadata
export const updateProductImage = async (
  imageId: number, 
  data: ProductImageUpdateData
): Promise<ApiResponse<ProductImage>> => {
  const response = await api.put(`/api/product-images/${imageId}`, data);
  return response.data;
};

// Set image as primary
export const setImageAsPrimary = async (imageId: number): Promise<ApiResponse<ProductImage>> => {
  const response = await api.post(`/api/product-images/${imageId}/primary`);
  return response.data;
};

// Reorder images
export const reorderProductImages = async (
  images: ReorderImageData[]
): Promise<ApiResponse<null>> => {
  const response = await api.post('/api/product-images/reorder', { images });
  return response.data;
};

// Delete an image
export const deleteProductImage = async (imageId: number): Promise<ApiResponse<null>> => {
  const response = await api.delete(`/api/product-images/${imageId}`);
  return response.data;
};

// Helper function to get primary image URL from product images
export const getPrimaryImageUrl = (images: ProductImage[], placeholder?: string): string => {
  if (!images || images.length === 0) {
    return placeholder || '/placeholder.svg';
  }
  
  const primaryImage = images.find(img => img.is_primary);
  if (primaryImage) {
    return primaryImage.url;
  }
  
  // Sort by display_order and return first
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);
  return sortedImages[0]?.url || placeholder || '/placeholder.svg';
};
