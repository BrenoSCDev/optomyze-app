/**
 * Application-wide constants and configuration
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
export const API_STORAGE_URL = `${API_BASE_URL}/storage`;

// Helper function to get storage URL for files
export const getStorageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  return `${API_STORAGE_URL}/${path}`;
};
