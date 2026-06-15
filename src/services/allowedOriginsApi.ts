import api from './api';

export interface AllowedOrigin {
  id: number;
  company_id: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export const allowedOriginsApi = {
  async getAll(): Promise<AllowedOrigin[]> {
    const response = await api.get('/api/allowed-origins');
    return response.data.data;
  },

  async create(url: string): Promise<AllowedOrigin> {
    const response = await api.post('/api/allowed-origins', { url });
    return response.data.data;
  },

  async update(id: number, url: string): Promise<AllowedOrigin> {
    const response = await api.put(`/api/allowed-origins/${id}`, { url });
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/allowed-origins/${id}`);
  },
};
