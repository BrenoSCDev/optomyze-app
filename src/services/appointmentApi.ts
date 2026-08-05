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
  /** The calendar this appointment sits on. Always set by the server. */
  calendar_id: number | null;
  /** Optional: appointments can exist without a lead. */
  lead_id: number | null;
  appointment_type_id: number | null;
  user_id: number | null;
  title: string;
  scheduled_at: string;
  end_at: string | null;
  timezone: string;
  notes: string | null;
  status: 'draft' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  created_at: string;
  updated_at: string;
  appointment_type?: AppointmentType | null;
  user?: { id: number; name: string; email: string } | null;
  lead?: {
    id: number;
    first_name: string;
    last_name: string | null;
    /** Resolved server-side from the contact's chat; leads have no image column. */
    profile_pic_url?: string | null;
  } | null;
  products?: AppointmentProduct[];
}

export interface CreateAppointmentPayload {
  /** Optional: omit for internal meetings, focus blocks, etc. */
  lead_id?: number | null;
  /** Defaults to the company's default calendar when omitted. */
  calendar_id?: number | null;
  appointment_type_id?: number | null;
  title: string;
  scheduled_at: string;
  end_at?: string;
  timezone?: string;
  notes?: string;
  status?: 'draft' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  lead_timezone?: string;
  product_ids?: number[];
}

export const getLeadAppointments = async (leadId: number): Promise<Appointment[]> => {
  const res = await api.get(`/api/leads/${leadId}/appointments`);
  return res.data;
};

/**
 * Company appointments, optionally narrowed to one calendar.
 *
 * The parameter is an array so the same endpoint serves a future overlay view
 * showing several calendars at once; passing none returns the whole company.
 */
export const getCompanyAppointments = async (calendarIds?: number[]): Promise<Appointment[]> => {
  const res = await api.get('/api/appointments', {
    params: calendarIds?.length ? { calendar_id: calendarIds } : undefined,
  });
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
