import api from './api';

export interface ObservationUser {
  id: number;
  name: string;
  email: string;
}

export interface Observation {
  id: number;
  lead_id: number;
  user_id: number;
  note: string;
  created_at: string;
  updated_at: string;
  user: ObservationUser;
}

export const observationService = {
  async createObservation(leadId: number, note: string): Promise<Observation> {
    const response = await api.post('/api/observations', {
      lead_id: leadId,
      note
    });
    return response.data;
  },

  async updateObservation(observationId: number, note: string): Promise<Observation> {
    const response = await api.put(`/api/observations/${observationId}`, {
      note
    });
    return response.data;
  },

  async deleteObservation(observationId: number): Promise<void> {
    await api.delete(`/api/observations/${observationId}`);
  }
};
