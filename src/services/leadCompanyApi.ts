/**
 * LEAD COMPANY API SERVICE
 * 
 * Handles all API operations for lead company management
 */

import api from './api';
import { LeadCompany, LeadCompanyFormData } from '@/types/leadCompany';

const ENDPOINT = '/api/lead-companies';

export const leadCompanyApi = {
  /**
   * Get all lead companies
   */
  async getAll(): Promise<LeadCompany[]> {
    const response = await api.get(ENDPOINT);
    return response.data.data || response.data;
  },

  /**
   * Get a single lead company by ID
   */
  async getById(id: number): Promise<LeadCompany> {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data.data || response.data;
  },

  /**
   * Create a new lead company
   */
  async create(data: LeadCompanyFormData): Promise<LeadCompany> {
    const formData = new FormData();
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await api.post(ENDPOINT, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  /**
   * Update an existing lead company
   */
  async update(id: number, data: LeadCompanyFormData): Promise<LeadCompany> {
    const formData = new FormData();
    
    // Laravel requires _method for PUT with FormData
    formData.append('_method', 'PUT');
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await api.post(`${ENDPOINT}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },

  /**
   * Delete a lead company
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${ENDPOINT}/${id}`);
  },
};

export default leadCompanyApi;
