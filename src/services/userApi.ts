import api from './api';
import { User } from '@/types/user';

export const userApi = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Create a new user
  createUser: async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update a user
  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put(`/api/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Toggle user status
  toggleUserStatus: async (id: number, is_active: boolean): Promise<User> => {
    try {
      const response = await api.patch(`/api/users/${id}/status`, { is_active });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },
};