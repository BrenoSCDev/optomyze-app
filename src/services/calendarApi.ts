/**
 * CALENDAR API
 *
 * A company owns many calendars. Everything scheduled — appointments, and
 * tasks with a due date — belongs to one of them.
 *
 * The fields for external synchronisation and public booking are typed here
 * even though neither ships yet: the server already stores them, and having
 * the shape in one place is what stops the two features being bolted on with
 * a parallel type later.
 */

import api from './api';

export type CalendarType = 'company' | 'team' | 'user' | 'resource' | 'custom';
export type CalendarVisibility = 'company' | 'team' | 'private';

/** Per-calendar connection to an external provider. Not yet configurable. */
export interface CalendarIntegration {
  id: number;
  provider: 'google' | 'outlook' | 'calendly' | 'apple' | 'ics';
  external_calendar_id: string | null;
  sync_direction: 'inbound' | 'outbound' | 'two_way';
  sync_status: 'idle' | 'syncing' | 'error' | 'disconnected';
  sync_error: string | null;
  last_synced_at: string | null;
  is_active: boolean;
}

/** Public booking page configuration. Not yet configurable. */
export interface CalendarBookingSettings {
  id: number;
  public_slug: string | null;
  is_published: boolean;
  slot_duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_days_in_advance: number;
  max_bookings_per_day: number | null;
  confirmation_mode: 'automatic' | 'manual';
  timezone: string | null;
}

export interface Calendar {
  id: number;
  company_id: number;
  name: string;
  description: string | null;
  color: string;
  type: CalendarType;
  visibility: CalendarVisibility;
  owner_id: number | null;
  owner?: { id: number; name: string; email: string } | null;
  timezone: string | null;
  is_default: boolean;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  appointments_count?: number;
  tasks_count?: number;
  integrations?: CalendarIntegration[];
  booking_settings?: CalendarBookingSettings | null;
}

export interface CalendarPayload {
  name?: string;
  description?: string | null;
  color?: string;
  type?: CalendarType;
  visibility?: CalendarVisibility;
  owner_id?: number | null;
  timezone?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

export const calendarService = {
  /** Active calendars by default; archived ones only when asked for. */
  async list(includeArchived = false): Promise<Calendar[]> {
    const response = await api.get('/api/calendars', {
      params: includeArchived ? { include_archived: 1 } : undefined,
    });
    return response.data.data;
  },

  async get(id: number): Promise<Calendar> {
    const response = await api.get(`/api/calendars/${id}`);
    return response.data.data;
  },

  async create(payload: CalendarPayload): Promise<Calendar> {
    const response = await api.post('/api/calendars', payload);
    return response.data.data;
  },

  async update(id: number, payload: CalendarPayload): Promise<Calendar> {
    const response = await api.put(`/api/calendars/${id}`, payload);
    return response.data.data;
  },

  async makeDefault(id: number): Promise<Calendar> {
    const response = await api.patch(`/api/calendars/${id}/default`);
    return response.data.data;
  },

  /**
   * Deleting a calendar moves its appointments and tasks to the default one —
   * the container goes, the contents do not.
   */
  async remove(id: number): Promise<{ moved_to_calendar_id: number }> {
    const response = await api.delete(`/api/calendars/${id}`);
    return response.data;
  },
};
