/**
 * SALE API SERVICE
 * 
 * Handles API calls for creating and managing sales
 */

import api from './api';

export interface SaleCharge {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface SaleDiscount {
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CreateSalePayload {
  pricing_model: 'product' | 'commission' | 'hybrid';
  product_ids: number[];
  funnel_id: number;
  stage_id: number;
  name: string;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  reference_value?: number;
  charges?: SaleCharge[];
  discounts?: SaleDiscount[];
  notes?: string;
  manual_value?: number;
}

export interface SaleResponse {
  id: number;
  lead_id: number;
  pricing_model: string;
  status: string;
  subtotal: number;
  charges_total: number;
  discount_total: number;
  total: number;
  items: any[];
  charges: any[];
  discounts: any[];
  user: any;
  created_at: string;
  updated_at: string;
}

export const saleService = {
  /**
   * Create a new sale for a lead
   */
  async createSale(leadId: number, payload: CreateSalePayload): Promise<SaleResponse> {
    try {
      const response = await api.post(`/api/leads/${leadId}/sales`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  /**
   * Get all sales for a lead
   */
  async getSales(leadId: number): Promise<SaleResponse[]> {
    try {
      const response = await api.get(`/api/leads/${leadId}/sales`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  /**
   * Delete a sale
   */
  async deleteSale(saleId: number): Promise<void> {
    try {
      await api.delete(`/api/sales/${saleId}`);
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  },

  /**
   * Update an existing sale (name, notes, stage, charges, discounts, pricing model)
   */
  async updateSale(saleId: number, payload: Partial<Omit<CreateSalePayload, 'funnel_id'>>): Promise<SaleResponse> {
    try {
      const response = await api.put(`/api/sales/${saleId}`, payload);
      return response.data.sale || response.data;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  /**
   * Update a sale's status (close or mark as lost)
   */
  async updateSaleStatus(saleId: number, status: 'closed' | 'lost'): Promise<SaleResponse> {
    try {
      const response = await api.put(`/api/sales/${saleId}/status`, { status });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating sale status:', error);
      throw error;
    }
  },

  /**
   * Archive or restore a deal. Archived deals keep every relation and stay in
   * their stage; they are only hidden from the board — unlike deleteSale,
   * which cascades to items, charges and documents.
   */
  async setSaleArchived(saleId: number, archived: boolean): Promise<void> {
    await api.patch(`/api/sales/${saleId}/archive`, { archived });
  },

  /** Reassign the deal's owner. */
  async assignSaleUser(saleId: number, userId: number): Promise<SaleResponse> {
    const response = await api.post(`/api/sales/${saleId}/assign`, { user_id: userId });
    return response.data.sale || response.data;
  },

  /** Move the deal to another deal funnel, landing on its entry stage. */
  async moveSaleToFunnel(saleId: number, funnelId: number): Promise<SaleResponse> {
    const response = await api.post(`/api/sales/${saleId}/move-funnel`, { funnel_id: funnelId });
    return response.data.sale || response.data;
  },
};
