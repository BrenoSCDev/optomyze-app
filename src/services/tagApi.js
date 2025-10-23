import api from './api';

export const tagService = {
  // Create a new tag
  async createTag(name, companyId) {
    try {
      const response = await api.post('/api/tags', {
        name,
        company_id: companyId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  // Get all tags for a company
  async getTags(companyId) {
    try {
      const response = await api.get(`/api/tags?company_id=${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  },

  // Get all tags for the current company (without requiring companyId parameter)
  async getAllTags() {
    try {
      const response = await api.get('/api/tags');
      return response.data;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      throw error;
    }
  }
};