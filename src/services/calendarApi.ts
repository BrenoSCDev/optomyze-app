import api from './api';

export interface CalendarTask {
  id: number;
  lead_id: number;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string;
  completed_at: string | null;
  assigned_to: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  reminder: number;
  lead: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    funnel_id: number;
  };
  assignee: {
    id: number;
    name: string;
    email: string;
  };
  creator: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CalendarEvent {
  id: number;
  company_id: number;
  title: string;
  description: string;
  type: 'meeting' | 'call' | 'deadline' | 'reminder' | 'other';
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  reminder: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarAppointment {
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
  appointment_type?: { id: number; name: string; color: string; duration_minutes: number } | null;
  lead?: { id: number; first_name: string; last_name: string; funnel_id: number } | null;
  user?: { id: number; name: string; email: string } | null;
}

export interface CalendarEventsResponse {
  tasks: CalendarTask[];
  events: CalendarEvent[];
  appointments: CalendarAppointment[];
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  type: 'meeting' | 'call' | 'deadline' | 'reminder' | 'other';
  start_at: string;
  end_at?: string;
  all_day: boolean;
  reminder: boolean;
}

export interface UpdateEventPayload extends CreateEventPayload {}

// Fetch all calendar events and tasks
export const fetchCalendarEvents = async (): Promise<CalendarEventsResponse> => {
  const response = await api.get('/api/events');
  return response.data;
};

// Create a new calendar event
export const createCalendarEvent = async (payload: CreateEventPayload): Promise<CalendarEvent> => {
  const response = await api.post('/api/events', payload);
  return response.data;
};

// Update an existing calendar event
export const updateCalendarEvent = async (eventId: number, payload: UpdateEventPayload): Promise<CalendarEvent> => {
  const response = await api.put(`/api/events/${eventId}`, payload);
  return response.data;
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId: number): Promise<void> => {
  await api.delete(`/api/events/${eventId}`);
};
