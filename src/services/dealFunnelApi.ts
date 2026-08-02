/**
 * DEAL FUNNEL API SERVICE
 * 
 * Handles API calls specific to deal funnels.
 * Separated from sales funnel logic to ensure clean architecture.
 */

import api from './api';

/** Deals loaded per stage, matching the API's own page size. */
export const DEALS_PER_STAGE = 10;

export const dealFunnelService = {
  /**
   * Get deal funnel data with stages and the first page of deals for each
   * stage. `params` carries the board filters plus per_page ('all' to skip
   * pagination, which is what the export path needs).
   */
  async getDealFunnelData(funnelId: string | number, params: Record<string, unknown> = {}) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}/deals`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching deal funnel data:', error);
      throw error;
    }
  },

  /**
   * One page of deals for a single stage — the board's infinite scroll.
   */
  async getStageDeals(
    funnelId: string | number,
    stageId: string | number,
    params: Record<string, unknown> = {}
  ) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}/stages/${stageId}/deals`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stage deals:', error);
      throw error;
    }
  },

  /**
   * Move a deal to a different stage
   */
  async moveDealToStage(dealId: string | number, stageId: string | number) {
    try {
      const response = await api.patch(`/api/sales/${dealId}/move-stage`, {
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
  },

  /**
   * Update tags on a deal. `tagIds` is the full set of tag IDs the deal should have.
   */
  async updateDealTags(dealId: string | number, tagIds: number[]) {
    try {
      const response = await api.put(`/api/sales/${dealId}/tags`, { tags: tagIds });
      return response.data;
    } catch (error) {
      console.error('Error updating deal tags:', error);
      throw error;
    }
  }
};
