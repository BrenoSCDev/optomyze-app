import api from './api';

/** Leads loaded per stage, matching the API's own page size. */
export const LEADS_PER_STAGE = 10;

export const funnelService = {
  // Get funnel data with stages and the first page of leads for each stage.
  // `params` carries the board filters plus per_page ('all' to skip
  // pagination, which is what the export path needs).
  async getFunnelData(funnelId, params = {}) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  },

  // One page of leads for a single stage — the board's infinite scroll.
  async getStageLeads(funnelId, stageId, params = {}) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}/stages/${stageId}/leads`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stage leads:', error);
      throw error;
    }
  },

  // Drag and drop goes through leadService.moveLeadToStage, which enforces
  // stage entry requirements; the board only mirrors the result afterwards.

  // Get all funnels for sidebar
  async getAllFunnels() {
    try {
      const response = await api.get('/api/funnels');
      return response.data;
    } catch (error) {
      console.error('Error fetching funnels:', error);
      throw error;
    }
  },

  // Update funnel configuration
  async updateFunnel(funnelId, updateData) {
    try {
      const response = await api.put(`/api/funnels/${funnelId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating funnel:', error);
      throw error;
    }
  },

  // Toggle funnel active status
  async toggleFunnelStatus(funnelId) {
    try {
      const response = await api.patch(`/api/funnels/${funnelId}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Error toggling funnel status:', error);
      throw error;
    }
  }
};