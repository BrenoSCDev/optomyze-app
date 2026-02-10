/**
 * DEAL FUNNEL API SERVICE
 * 
 * Handles API calls specific to deal funnels.
 * Separated from sales funnel logic to ensure clean architecture.
 */

import api from './api';

export const dealFunnelService = {
  /**
   * Get deal funnel data with stages and deals
   */
  async getDealFunnelData(funnelId: string | number) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}/deals`);
      return response.data;
    } catch (error) {
      console.error('Error fetching deal funnel data:', error);
      throw error;
    }
  },

  /**
   * Move a deal to a different stage
   */
  async moveDealToStage(dealId: string | number, stageId: string | number) {
    try {
      const response = await api.put(`/api/deals/${dealId}/move`, {
        stage_id: stageId
      });
      return response.data;
    } catch (error) {
      console.error('Error moving deal to stage:', error);
      throw error;
    }
  },

  /**
   * Create a new deal in a funnel
   */
  async createDeal(payload: {
    name: string;
    funnel_id: number;
    stage_id: number;
    lead_id?: number;
    pricing_model?: string;
    notes?: string;
  }) {
    try {
      const response = await api.post('/api/deals', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }
};
