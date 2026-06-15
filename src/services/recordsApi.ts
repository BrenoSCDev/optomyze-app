import api from './api';
import type { ActivityMeta, ActivityQueryParams } from '@/components/activity/types';

export interface RecordUser {
  id: number;
  name: string;
  email: string;
}

export interface RecordLead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_id?: number;
}

export interface RecordSale {
  id: number;
  lead_id: number;
  user_id: number;
  name: string;
  total: string | number;
  created_at: string;
  charges_total?: number;
  final_total?: number;
  lead?: RecordLead | null;
  charges?: any[];
}

export interface RecordItem {
  id: number;
  company_id?: number;
  recordable_type: 'Lead' | 'Sale';
  recordable_id: number;
  user_id: number | null;
  type: string;
  source: string;
  action: string;
  title?: string;
  description: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at?: string;
  recordable?: RecordLead | RecordSale | null;
  user: RecordUser | null;
}

export interface RecordsResponse {
  transactions: RecordItem[];
  meta?: ActivityMeta;
}

export interface ActivityTask {
  id: number;
  lead_id: number | null;
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
  lead: RecordLead | null;
  creator: RecordUser | null;
  assignee: RecordUser | null;
}

export interface TasksResponse {
  tasks: ActivityTask[];
}

export const recordsApi = {
  fetchLeadActivity: async (params?: ActivityQueryParams): Promise<RecordsResponse> => {
    try {
      const response = await api.get('/api/leads-activity/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching lead records:', error);
      throw error;
    }
  },

  fetchDealActivity: async (params?: ActivityQueryParams): Promise<RecordsResponse> => {
    try {
      const response = await api.get('/api/deals-activity/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching deal records:', error);
      throw error;
    }
  },

  fetchAllActivity: async (params?: ActivityQueryParams): Promise<RecordsResponse> => {
    try {
      const response = await api.get('/api/records-activity', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching record logs:', error);
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
