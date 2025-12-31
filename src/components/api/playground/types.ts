/**
 * API Playground Types
 * Type definitions for the API testing tool
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export type BodyType = 'none' | 'raw-json' | 'raw-xml' | 'raw-text' | 'form-data' | 'x-www-form-urlencoded';

export type AuthType = 'none' | 'bearer' | 'api-key' | 'basic' | 'oauth2';

export type Environment = 'dev' | 'staging' | 'production';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  bodyType: BodyType;
  body: string;
  authType: AuthType;
  authConfig: {
    bearerToken?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
    apiKeyLocation?: 'header' | 'query';
    basicUsername?: string;
    basicPassword?: string;
  };
  timestamp?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export interface Collection {
  id: string;
  name: string;
  requests: ApiRequest[];
}

export interface CrmVariable {
  key: string;
  label: string;
  example: string;
}

export const CRM_VARIABLES: CrmVariable[] = [
  { key: '{{lead_id}}', label: 'Lead ID', example: 'lead_abc123' },
  { key: '{{client_id}}', label: 'Client ID', example: 'client_xyz789' },
  { key: '{{deal_id}}', label: 'Deal ID', example: 'deal_456def' },
  { key: '{{user_id}}', label: 'User ID', example: 'user_789ghi' },
  { key: '{{base_url}}', label: 'Base URL', example: 'https://api.example.com' },
  { key: '{{token}}', label: 'Auth Token', example: 'Bearer abc123...' },
];

export const ENVIRONMENT_URLS: Record<Environment, string> = {
  dev: 'http://localhost:3000',
  staging: 'https://staging-api.optomyze.com',
  production: 'https://api.optomyze.com',
};

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  PUT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  OPTIONS: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const STATUS_COLORS: Record<string, string> = {
  '2': 'text-emerald-400 bg-emerald-500/20',
  '3': 'text-blue-400 bg-blue-500/20',
  '4': 'text-amber-400 bg-amber-500/20',
  '5': 'text-red-400 bg-red-500/20',
};

export const HEADER_PRESETS: KeyValuePair[] = [
  { id: 'preset-1', key: 'Content-Type', value: 'application/json', enabled: true },
  { id: 'preset-2', key: 'Accept', value: 'application/json', enabled: true },
  { id: 'preset-3', key: 'Authorization', value: 'Bearer {{token}}', enabled: false },
  { id: 'preset-4', key: 'X-API-Key', value: '{{api_key}}', enabled: false },
];

export const REQUEST_TEMPLATES: ApiRequest[] = [
  {
    id: 'template-1',
    name: 'CRM Webhook - Lead Created',
    method: 'POST',
    url: '{{base_url}}/webhooks/lead-created',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'h2', key: 'X-Webhook-Secret', value: '{{webhook_secret}}', enabled: true },
    ],
    queryParams: [],
    bodyType: 'raw-json',
    body: JSON.stringify({
      event: 'lead.created',
      lead_id: '{{lead_id}}',
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        source: 'website'
      }
    }, null, 2),
    authType: 'none',
    authConfig: {},
  },
  {
    id: 'template-2',
    name: 'Automation Trigger - Stage Change',
    method: 'POST',
    url: '{{base_url}}/automations/trigger',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'h2', key: 'Authorization', value: 'Bearer {{token}}', enabled: true },
    ],
    queryParams: [],
    bodyType: 'raw-json',
    body: JSON.stringify({
      trigger: 'stage_change',
      lead_id: '{{lead_id}}',
      from_stage: 'new',
      to_stage: 'qualified'
    }, null, 2),
    authType: 'bearer',
    authConfig: { bearerToken: '{{token}}' },
  },
  {
    id: 'template-3',
    name: 'External Integration - Sync Contact',
    method: 'PUT',
    url: '{{base_url}}/integrations/sync-contact',
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    queryParams: [
      { id: 'q1', key: 'client_id', value: '{{client_id}}', enabled: true },
    ],
    bodyType: 'raw-json',
    body: JSON.stringify({
      external_id: 'ext_123',
      sync_fields: ['name', 'email', 'phone']
    }, null, 2),
    authType: 'api-key',
    authConfig: { apiKeyHeader: 'X-API-Key', apiKeyValue: '{{api_key}}', apiKeyLocation: 'header' },
  },
];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyRequest(): ApiRequest {
  return {
    id: generateId(),
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [
      { id: generateId(), key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    queryParams: [],
    bodyType: 'none',
    body: '',
    authType: 'none',
    authConfig: {},
  };
}
