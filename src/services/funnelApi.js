import api from './api';

export const funnelService = {
  // Get funnel data with stages and leads
  async getFunnelData(funnelId) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      throw error;
    }
  },

  // Update lead stage (for drag and drop)
  async updateLeadStage(leadId, stageId) {
    try {
      const response = await api.put(`/api/leads/${leadId}`, {
        stage_id: stageId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating lead stage:', error);
      throw error;
    }
  },

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