import api from './api';

export const leadService = {
  // Create a new lead
  async createLead(leadData) {
    try {
      const response = await api.post('/api/leads', leadData);
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  },

  // Get all leads for a funnel
  async getLeads(funnelId) {
    try {
      const response = await api.get(`/api/funnels/${funnelId}/leads`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  // Update lead
  async updateLead(leadId, leadData) {
    try {
      const response = await api.put(`/api/leads/${leadId}`, leadData);
      return response.data;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  },

  // Delete lead
  async deleteLead(leadId) {
    try {
      const response = await api.delete(`/api/leads/${leadId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  },

  // Move lead to different stage (for drag and drop)
  async moveLeadToStage(leadId, stageId) {
    try {
      const response = await api.post(`/api/leads/${leadId}/move-stage`, {
        stage_id: stageId
      });
      return response.data;
    } catch (error) {
      console.error('Error moving lead to stage:', error);
      throw error;
    }
  },

  // Move lead to a different funnel (placed in that funnel's entry stage)
  async moveLeadToFunnel(leadId, funnelId) {
    try {
      const response = await api.post(`/api/leads/${leadId}/move-funnel`, {
        funnel_id: funnelId
      });
      return response.data;
    } catch (error) {
      console.error('Error moving lead to funnel:', error);
      throw error;
    }
  },

  // Submit lost reason for a lead
  async submitLostReason(leadId, lostReasonId) {
    try {
      const response = await api.post(`/api/leads/${leadId}/lost-reason`, {
        lost_reason_id: lostReasonId
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting lost reason:', error);
      throw error;
    }
  },

  // Update lead tags. `tagIds` is the full set of tag IDs the lead should have.
  async updateLeadTags(leadId, tagIds) {
    try {
      const response = await api.put(`/api/leads/${leadId}/tags`, {
        tags: tagIds
      });
      return response.data;
    } catch (error) {
      console.error('Error updating lead tags:', error);
      throw error;
    }
  }
};