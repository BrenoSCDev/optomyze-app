import api from './api';

export const tagService = {
  // Create a new tag
  async createTag(name, companyId, color) {
    try {
      const response = await api.post('/api/tags', {
        name,
        company_id: companyId,
        ...(color ? { color } : {}),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  // Update an existing tag's name and/or color
  async updateTag(tagId, { name, color } = {}) {
    try {
      const response = await api.put(`/api/tags/${tagId}`, { name, color });
      return response.data;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  },

  // Delete a tag
  async deleteTag(tagId) {
    try {
      const response = await api.delete(`/api/tags/${tagId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting tag:', error);
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
