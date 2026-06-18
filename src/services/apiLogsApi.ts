/**
 * API REQUEST LOGS SERVICE
 *
 * Fetches and filters the centralized API request log (api_request_logs)
 * for the API Logs observability dashboard.
 */

import api from './api';

export type ApiLogStatus = 'success' | 'failure';

export interface ApiRequestLogEntry {
  id: number;
  request_id: string;
  company_id: number;
  api_token_id: number | null;
  api_token?: { id: number; name: string } | null;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  method: string;
  endpoint: string;
  full_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  // Omitted from the lean real-time "logged" event (Reverb payload size limit) -
  // only present once fetched via fetchApiLogDetail().
  request_headers?: Record<string, unknown> | null;
  query_params?: Record<string, unknown> | null;
  request_body?: Record<string, unknown> | null;
  response_status: number | null;
  response_headers?: Record<string, unknown> | null;
  response_body?: Record<string, unknown> | null;
  duration_ms: number | null;
  status: ApiLogStatus;
  exception_class?: string | null;
  exception_message?: string | null;
  created_at: string;
}

export interface ApiLogFilters {
  search?: string;
  date_from?: string;
  date_to?: string;
  endpoint?: string;
  method?: string;
  status?: ApiLogStatus;
  status_code?: number;
  api_token_id?: number;
  min_duration_ms?: number;
  max_duration_ms?: number;
  page?: number;
  per_page?: number;
}

export interface ApiLogListResponse {
  data: ApiRequestLogEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiLogFilterOptions {
  endpoints: string[];
  methods: string[];
}

const cleanFilters = (filters: ApiLogFilters): Record<string, string | number> => {
  const params: Record<string, string | number> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number;
    }
  });
  return params;
};

export const fetchApiLogs = async (filters: ApiLogFilters = {}): Promise<ApiLogListResponse> => {
  const response = await api.get('/api/api-logs', { params: cleanFilters(filters) });
  return response.data;
};

export const fetchApiLogFilterOptions = async (): Promise<ApiLogFilterOptions> => {
  const response = await api.get('/api/api-logs/filter-options');
  return response.data;
};

export const fetchApiLogDetail = async (id: number): Promise<ApiRequestLogEntry> => {
  const response = await api.get(`/api/api-logs/${id}`);
  return response.data.data;
};
