/**
 * BOOKING API
 *
 * Two audiences, deliberately split:
 *
 *   - `bookingConfigService` is the authenticated side, used by the Calendar
 *     module to configure a page.
 *   - `publicBookingService` is what the public page calls. It uses a bare
 *     axios instance rather than the app's `api` client, because that client
 *     attaches the CRM bearer token and redirects to /login on 401 — behaviour
 *     that makes no sense on a page a stranger is looking at.
 */

import axios from 'axios';
import api from './api';

export type AvailabilityMode = 'smart' | 'open';
export type ConfirmationMode = 'automatic' | 'manual';

/** One field on the booking form. Same shape as the form widget's fields. */
export interface BookingField {
  key: string;
  source: 'lead' | 'custom';
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'date';
  label: string;
  placeholder?: string | null;
  help_text?: string | null;
  required?: boolean;
  enabled?: boolean;
  options?: { label: string; value: string }[];
  validation?: { min?: number; max?: number; max_length?: number };
}

export interface WorkingHourWindow {
  start: string;
  end: string;
}

/** Keyed by sun/mon/…; an empty array is a closed day. */
export type WorkingHours = Record<string, WorkingHourWindow[]>;

export interface BookingSettings {
  id: number;
  calendar_id: number;
  public_slug: string | null;
  is_published: boolean;

  title: string | null;
  subtitle: string | null;
  description: string | null;

  availability_mode: AvailabilityMode;
  slot_duration_minutes: number;
  slot_increment_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_days_in_advance: number;
  max_bookings_per_day: number | null;
  confirmation_mode: ConfirmationMode;
  timezone: string | null;

  working_hours: WorkingHours | null;
  date_overrides: Record<string, WorkingHourWindow[]> | null;

  branding: {
    primary_color?: string;
    button_color?: string;
    background?: string;
    show_logo?: boolean;
  } | null;

  /**
   * Where a booking lands in the CRM. Mirrors the form widget's `mapping`,
   * plus who ends up owning the lead.
   */
  booking_defaults: {
    funnel_id?: number | null;
    stage_id?: number | null;
    appointment_type_id?: number | null;
    /** queue = the funnel's distribution rotation, the default. */
    assignment_mode?: 'queue' | 'user' | 'unassigned';
    assigned_user_id?: number | null;
  } | null;

  form_fields: BookingField[] | null;
  confirmation_title: string | null;
  confirmation_message: string | null;
}

/** What a visitor's browser is told. Deliberately free of CRM identifiers. */
export interface PublicBookingPage {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  company: { name: string | null; logo: string | null };
  branding: { primary_color: string; button_color: string; background: string; show_logo: boolean };
  schedule: {
    timezone: string;
    duration_minutes: number;
    availability_mode: AvailabilityMode;
    max_days_in_advance: number;
    min_notice_minutes: number;
    increment_minutes: number;
  };
  fields: BookingField[];
  confirmation: { title: string | null; message: string | null };
}

export interface BookingConfirmation {
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  confirmation_title: string;
  confirmation_message: string;
}

/* ---------------- authenticated ---------------- */

export const bookingConfigService = {
  async get(calendarId: number): Promise<BookingSettings> {
    const response = await api.get(`/api/calendars/${calendarId}/booking`);
    return response.data.data;
  },

  async update(calendarId: number, payload: Partial<BookingSettings>): Promise<BookingSettings> {
    const response = await api.put(`/api/calendars/${calendarId}/booking`, payload);
    return response.data.data;
  },

  /** Mints a new URL and breaks every link already shared. */
  async regenerateSlug(calendarId: number): Promise<BookingSettings> {
    const response = await api.post(`/api/calendars/${calendarId}/booking/slug`);
    return response.data.data;
  },

  /** The same slots a visitor would see — used by the owner's preview. */
  async previewAvailability(calendarId: number, from: string, to: string): Promise<Record<string, string[]>> {
    const response = await api.get(`/api/calendars/${calendarId}/booking/availability`, {
      params: { from, to },
    });
    return response.data.data;
  },
};

/* ---------------- public ---------------- */

const PUBLIC_API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const publicClient = axios.create({
  baseURL: PUBLIC_API_BASE,
  headers: { Accept: 'application/json' },
});

/**
 * Absolute URL for a signed media path.
 *
 * The API signs *relative* URLs — the signature then covers only the path and
 * query, which is what makes it survive the TLS-terminating proxy. That also
 * means a browser would resolve it against whatever host is serving the page,
 * which in development (and any split-origin deployment) is not the API. An
 * `<img src>` has no interceptor to fix that, so it is resolved here.
 */
export const resolveMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  return `${PUBLIC_API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const publicBookingService = {
  async page(slug: string): Promise<PublicBookingPage> {
    const response = await publicClient.get(`/api/public/booking/${slug}`);
    return response.data.data;
  },

  async availability(slug: string, from: string, to: string): Promise<{ timezone: string; days: Record<string, string[]> }> {
    const response = await publicClient.get(`/api/public/booking/${slug}/availability`, {
      params: { from, to },
    });
    return response.data.data;
  },

  async book(slug: string, startsAt: string, answers: Record<string, unknown>): Promise<BookingConfirmation> {
    const response = await publicClient.post(`/api/public/booking/${slug}/book`, {
      starts_at: startsAt,
      answers,
    });
    return response.data.data;
  },
};

/** The public URL a page is served at, for copying and previewing. */
export const bookingPageUrl = (slug: string): string =>
  `${window.location.origin}/book/${slug}`;
