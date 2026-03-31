import api from './api';

export interface AppointmentType {
  id: number;
  company_id: number;
  name: string;
  duration_minutes: number;
  color: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentTypePayload {
  name: string;
  duration_minutes?: number;
  color?: string;
  description?: string;
  is_active?: boolean;
}

export const getAppointmentTypes = async (): Promise<AppointmentType[]> => {
  const res = await api.get('/api/appointment-types');
  return res.data;
};

export const createAppointmentType = async (payload: CreateAppointmentTypePayload): Promise<AppointmentType> => {
  const res = await api.post('/api/appointment-types', payload);
  return res.data;
};

export const updateAppointmentType = async (id: number, payload: Partial<CreateAppointmentTypePayload>): Promise<AppointmentType> => {
  const res = await api.put(`/api/appointment-types/${id}`, payload);
  return res.data;
};

export const deleteAppointmentType = async (id: number): Promise<void> => {
  await api.delete(`/api/appointment-types/${id}`);
};
