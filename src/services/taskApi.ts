import api from './api';

export interface Task {
  id: number;
  lead_id: number;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  completed_at: string | null;
  assigned_to: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  lead_id: number;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  assigned_to?: number;
}

export const taskApi = {
  createTask: async (taskData: CreateTaskPayload): Promise<Task> => {
    try {
      const response = await api.post('/api/tasks', taskData);
      // Backend returns { message: string, task: Task }
      return response.data.task || response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (taskId: number, taskData: Partial<CreateTaskPayload>): Promise<Task> => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId: number): Promise<void> => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};
