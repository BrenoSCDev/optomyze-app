import api from './api';
import { AppointmentType } from './appointmentTypeApi';

export interface AppointmentProduct {
  id: number;
  name: string;
  sku: string;
  base_price: string;
  type: string;
}

export interface Appointment {
  id: number;
  company_id: number;
  lead_id: number;
  appointment_type_id: number | null;
  user_id: number | null;
  title: string;
  scheduled_at: string;
  end_at: string | null;
  timezone: string;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  updated_at: string;
  appointment_type?: AppointmentType | null;
  user?: { id: number; name: string; email: string } | null;
  lead?: { id: number; first_name: string; last_name: string } | null;
  products?: AppointmentProduct[];
}

export interface CreateAppointmentPayload {
  lead_id: number;
  appointment_type_id?: number | null;
  title: string;
  scheduled_at: string;
  end_at?: string;
  timezone?: string;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  lead_timezone?: string;
  product_ids?: number[];
}

export const getLeadAppointments = async (leadId: number): Promise<Appointment[]> => {
  const res = await api.get(`/api/leads/${leadId}/appointments`);
  return res.data;
};

export const getCompanyAppointments = async (): Promise<Appointment[]> => {
  const res = await api.get('/api/appointments');
  return res.data;
};

export const createAppointment = async (payload: CreateAppointmentPayload): Promise<Appointment> => {
  const res = await api.post('/api/appointments', payload);
  return res.data;
};

export const updateAppointment = async (id: number, payload: Partial<CreateAppointmentPayload>): Promise<Appointment> => {
  const res = await api.put(`/api/appointments/${id}`, payload);
  return res.data;
};

export const deleteAppointment = async (id: number): Promise<void> => {
  await api.delete(`/api/appointments/${id}`);
};
