import api from './api';

export const tagService = {
  // Create a new tag. `scopes` is a subset of ['lead','deal','task'] deciding
  // which pickers offer it; omitted means the API defaults it to all three.
  async createTag(name, companyId, color, scopes) {
    try {
      const response = await api.post('/api/tags', {
        name,
        company_id: companyId,
        ...(color ? { color } : {}),
        ...(scopes ? { scopes } : {}),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  // Update an existing tag's name and/or color
  async updateTag(tagId, { name, color, scopes } = {}) {
    try {
      const response = await api.put(`/api/tags/${tagId}`, {
        name,
        color,
        ...(scopes ? { scopes } : {}),
      });
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

  /**
   * Tags for the current company.
   *
   * `scope` ('lead' | 'deal' | 'task') asks the API for only the tags usable
   * on that entity, so pickers request what they can attach instead of
   * filtering a flat list. `withCounts` adds usage counts for the management
   * screen.
   */
  async getAllTags({ scope, withCounts } = {}) {
    try {
      const params = new URLSearchParams();
      if (scope) params.set('scope', scope);
      if (withCounts) params.set('with_counts', '1');

      const query = params.toString();
      const response = await api.get(`/api/tags${query ? `?${query}` : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all tags:', error);
      throw error;
    }
  }
};
