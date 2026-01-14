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

export interface CalendarEventsResponse {
  tasks: CalendarTask[];
  events: CalendarEvent[];
}

export const fetchCalendarEvents = async (): Promise<CalendarEventsResponse> => {
  const response = await api.get('/api/events');
  return response.data;
};
