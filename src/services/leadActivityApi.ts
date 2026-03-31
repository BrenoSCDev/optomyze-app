import api from './api';

export interface ActivityLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_id: number;
}

export interface ActivityUser {
  id: number;
  name: string;
  email: string;
}

export interface ActivityTransaction {
  id: number;
  lead_id: number;
  user_id: number | null;
  type: string;
  source: string;
  action: string;
  description: string;
  created_at: string;
  lead: ActivityLead;
  user: ActivityUser | null;
}

export interface ActivityTask {
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
  reminder: number;
  created_at: string;
  updated_at: string;
  lead: ActivityLead;
  creator: ActivityUser | null;
  assignee: ActivityUser | null;
}

export interface TransactionsResponse {
  transactions: ActivityTransaction[];
}

export interface TasksResponse {
  tasks: ActivityTask[];
}

export const leadActivityApi = {
  fetchTransactions: async (): Promise<TransactionsResponse> => {
    try {
      const response = await api.get('/api/leads-activity/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching lead transactions:', error);
      throw error;
    }
  },

  fetchTasks: async (): Promise<TasksResponse> => {
    try {
      const response = await api.get('/api/leads-activity/tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching lead tasks:', error);
      throw error;
    }
  },
};
