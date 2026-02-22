import api from './api';

export interface LostReason {
  id: number;
  company_id: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LostReasonPayload {
  description: string;
}

export const lostReasonApi = {
  list: async (): Promise<LostReason[]> => {
    const response = await api.get('/api/lost-reasons');
    return response.data;
  },

  create: async (payload: LostReasonPayload): Promise<LostReason> => {
    const response = await api.post('/api/lost-reasons', payload);
    return response.data;
  },

  update: async (id: number, payload: LostReasonPayload): Promise<LostReason> => {
    const response = await api.put(`/api/lost-reasons/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/lost-reasons/${id}`);
  },
};
