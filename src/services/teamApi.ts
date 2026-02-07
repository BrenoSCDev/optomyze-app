import api from './api';
import { Team, TeamFormData } from '@/types/team';

export const teamApi = {
  // Get all teams
  getTeams: async (): Promise<Team[]> => {
    try {
      const response = await api.get('/api/teams');
      return response.data;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Get a single team by ID
  getTeam: async (id: number): Promise<Team> => {
    try {
      const response = await api.get(`/api/teams/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  // Create a new team
  createTeam: async (teamData: TeamFormData): Promise<Team> => {
    try {
      const response = await api.post('/api/teams', teamData);
      return response.data;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Update a team
  updateTeam: async (id: number, teamData: TeamFormData): Promise<Team> => {
    try {
      const response = await api.put(`/api/teams/${id}`, teamData);
      return response.data;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Delete a team
  deleteTeam: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/teams/${id}`);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },
};
