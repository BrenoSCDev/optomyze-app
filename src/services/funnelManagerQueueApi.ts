import api from './api';

export interface QueueUser {
  id: number;
  name: string;
  email: string;
  pivot: { order: number };
}

export interface QueueFunnel {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  funnel_manager_queue_id: number;
}

export interface FunnelManagerQueue {
  id: number;
  company_id: number;
  name: string;
  is_active: boolean;
  current_index: number;
  created_at: string;
  updated_at: string;
  users: QueueUser[];
  funnels: QueueFunnel[];
}

export interface FunnelManagerQueuePayload {
  name: string;
  is_active: boolean;
  users: Array<{ id: number; order: number }>;
  funnel_ids: number[];
}

export const funnelManagerQueueApi = {
  getQueues: async (): Promise<FunnelManagerQueue[]> => {
    const response = await api.get('/api/funnel-manager-queues');
    return response.data;
  },

  getQueue: async (id: number): Promise<FunnelManagerQueue> => {
    const response = await api.get(`/api/funnel-manager-queues/${id}`);
    return response.data;
  },

  createQueue: async (data: FunnelManagerQueuePayload): Promise<FunnelManagerQueue> => {
    const response = await api.post('/api/funnel-manager-queues', data);
    return response.data;
  },

  updateQueue: async (id: number, data: Partial<FunnelManagerQueuePayload>): Promise<FunnelManagerQueue> => {
    const response = await api.put(`/api/funnel-manager-queues/${id}`, data);
    return response.data;
  },

  deleteQueue: async (id: number): Promise<void> => {
    await api.delete(`/api/funnel-manager-queues/${id}`);
  },
};
