/**
 * API Endpoint Definitions for the API Documentation page.
 * Each endpoint includes method, path, summary, description,
 * parameters (query/path/body), example request/response data.
 */

import { getSalesEndpoints } from './endpoints/salesEndpoints';
import { getProductsEndpoints } from './endpoints/productsEndpoints';
import { getEventsEndpoints } from './endpoints/eventsEndpoints';
import { getUsersEndpoints } from './endpoints/usersEndpoints';
import { getTeamsEndpoints } from './endpoints/teamsEndpoints';
import { getLeadCompaniesEndpoints } from './endpoints/leadCompaniesEndpoints';
import { getFunnelsEndpoints } from './endpoints/funnelsEndpoints';
import { getStagesEndpoints } from './endpoints/stagesEndpoints';
import { getAppointmentsEndpoints } from './endpoints/appointmentsEndpoints';
import { getObservationsEndpoints } from './endpoints/observationsEndpoints';
import { getTasksEndpoints } from './endpoints/tasksEndpoints';
import { getLeadActionsEndpoints } from './endpoints/leadActionsEndpoints';
import { getFilesEndpoints } from './endpoints/filesEndpoints';
export interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  constraints?: string;
}

export interface EndpointDefinition {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  pathParams?: EndpointParam[];
  queryParams?: EndpointParam[];
  bodyParams?: EndpointParam[];
  exampleBody?: Record<string, any>;
  exampleResponses?: {
    status: number;
    label: string;
    body: Record<string, any>;
  }[];
}

export interface EndpointCategory {
  categoryKey: string;
  endpoints: EndpointDefinition[];
}

export const getEndpointCategories = (t: (key: string) => string): EndpointCategory[] => [
  {
    categoryKey: t('api.leads'),
    endpoints: [
      // 1. List Leads
      {
        id: 'list-leads',
        method: 'GET',
        path: '/leads',
        summary: t('api.list-leads-summary'),
        description: t('api.list-leads-description'),
        queryParams: [
          { name: 'funnel_id', type: 'integer', required: false, description: t('api.params.filter-funnel-id') },
          { name: 'stage_id', type: 'integer', required: false, description: t('api.params.filter-stage-id') },
          { name: 'assigned_to', type: 'integer', required: false, description: t('api.params.filter-assigned-to') },
          { name: 'priority', type: 'string', required: false, description: t('api.params.filter-priority') },
          { name: 'source_platform', type: 'string', required: false, description: t('api.params.filter-source-platform') },
          { name: 'external_id', type: 'string', required: false, description: t('api.params.filter-external-id') },
          { name: 'per_page', type: 'integer', required: false, description: t('api.params.per-page') },
          { name: 'page', type: 'integer', required: false, description: t('api.params.page') },
        ],
        exampleResponses: [
          {
            status: 200,
            label: '200 OK',
            body: {
              current_page: 1,
              data: [
                {
                  id: 14,
                  company_id: 2,
                  funnel_id: 1,
                  stage_id: 3,
                  assigned_to: 5,
                  external_id: "ext-001",
                  source_platform: "website",
                  source_type: "web_form",
                  first_name: "John",
                  last_name: "Doe",
                  email: "john@example.com",
                  phone: "+5511999990000",
                  priority: "high",
                  currency: "BRL",
                  ai_score: "82.50",
                  tags: ["hot", "enterprise"],
                  notes: "Interested in the enterprise plan.",
                  is_active: true,
                  is_qualified: false,
                  created_at: "2026-02-20T10:00:00.000Z",
                  updated_at: "2026-02-20T10:00:00.000Z",
                  stage: { id: 3, name: "Contacted", funnel_id: 1 },
                  assigned_user: { id: 5, name: "Jane Smith", email: "jane@company.com" }
                }
              ],
              last_page: 4,
              per_page: 20,
              total: 72
            }
          }
        ]
      },

      // 2. Create Lead (existing — data only, card rendering stays the same)
      {
        id: 'create-lead',
        method: 'POST',
        path: '/leads',
        summary: t('api.create-lead-summary'),
        description: t('api.create-lead-description'),
        bodyParams: [
          { name: 'funnel_id', type: 'integer', required: true, description: t('api.params.funnel-id') },
          { name: 'first_name', type: 'string', required: true, description: t('api.params.first-name'), constraints: 'max 100' },
          { name: 'last_name', type: 'string', required: false, description: t('api.params.last-name'), constraints: 'max 100' },
          { name: 'email', type: 'string', required: false, description: t('api.params.email'), constraints: 'max 255' },
          { name: 'phone', type: 'string', required: false, description: t('api.params.phone'), constraints: 'max 20' },
          { name: 'username', type: 'string', required: false, description: t('api.params.username'), constraints: 'max 100' },
          { name: 'assigned_to', type: 'integer', required: false, description: t('api.params.assigned-to') },
          { name: 'external_id', type: 'string', required: false, description: t('api.params.external-id'), constraints: 'max 255' },
          { name: 'source_platform', type: 'string', required: false, description: t('api.params.source-platform'), constraints: 'max 50' },
          { name: 'source_type', type: 'string', required: false, description: t('api.params.source-type'), constraints: 'max 50' },
          { name: 'priority', type: 'enum', required: false, description: t('api.params.priority'), constraints: 'low | medium | high | urgent' },
          { name: 'currency', type: 'string', required: false, description: t('api.params.currency'), constraints: '3 chars (ISO 4217)' },
          { name: 'preferred_contact_method', type: 'string', required: false, description: t('api.params.preferred-contact'), constraints: 'max 50' },
          { name: 'timezone', type: 'string', required: false, description: t('api.params.timezone'), constraints: 'max 50' },
          { name: 'language', type: 'string', required: false, description: t('api.params.language'), constraints: 'max 5' },
          { name: 'ai_score', type: 'number', required: false, description: t('api.params.ai-score'), constraints: '0–100' },
          { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
        ],
        exampleBody: {
          funnel_id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone: "+15551234567",
          source_platform: "website",
          priority: "medium",
          currency: "USD",
          ai_score: 75.5
        },
      },

      // 3. Get Lead
      {
        id: 'get-lead',
        method: 'GET',
        path: '/leads/{id}',
        summary: t('api.get-lead-summary'),
        description: t('api.get-lead-description'),
        pathParams: [
          { name: 'id', type: 'integer', required: true, description: t('api.params.lead-id') },
        ],
        exampleResponses: [
          {
            status: 200,
            label: '200 OK',
            body: {
              data: {
                id: 14,
                company_id: 2,
                funnel_id: 1,
                stage_id: 3,
                assigned_to: 5,
                external_id: "ext-001",
                source_platform: "website",
                first_name: "John",
                last_name: "Doe",
                email: "john@example.com",
                phone: "+5511999990000",
                priority: "high",
                currency: "BRL",
                ai_score: "82.50",
                tags: ["hot", "enterprise"],
                notes: "Interested in the enterprise plan.",
                is_active: true,
                is_qualified: false,
                address_line_1: "Rua das Flores, 100",
                city: "São Paulo",
                state: "São Paulo",
                state_code: "SP",
                postal_code: "01310-000",
                country: "Brazil",
                stage: { id: 3, name: "Contacted", funnel_id: 1, order: 2, funnel: { id: 1, name: "Main Funnel" } },
                assigned_user: { id: 5, name: "Jane Smith", email: "jane@company.com" },
                products: [{ id: 1, name: "Enterprise Plan", base_price: 1200.00, type: "subscription" }],
                observations: [{ id: 7, body: "Called the client, left a voicemail.", created_at: "2026-02-20T11:00:00.000Z", user: { id: 5, name: "Jane Smith" } }]
              }
            }
          },
          {
            status: 404,
            label: '404 Not Found',
            body: { message: "Lead not found" }
          }
        ]
      },

      // 4. Update Lead
      {
        id: 'update-lead',
        method: 'PUT',
        path: '/leads/{id}',
        summary: t('api.update-lead-summary'),
        description: t('api.update-lead-description'),
        pathParams: [
          { name: 'id', type: 'integer', required: true, description: t('api.params.lead-id') },
        ],
        bodyParams: [
          { name: 'first_name', type: 'string', required: false, description: t('api.params.first-name'), constraints: 'max 100' },
          { name: 'last_name', type: 'string', required: false, description: t('api.params.last-name'), constraints: 'max 100' },
          { name: 'email', type: 'string', required: false, description: t('api.params.email'), constraints: 'max 255' },
          { name: 'phone', type: 'string', required: false, description: t('api.params.phone'), constraints: 'max 20' },
          { name: 'username', type: 'string', required: false, description: t('api.params.username'), constraints: 'max 100' },
          { name: 'external_id', type: 'string', required: false, description: t('api.params.external-id'), constraints: 'max 255' },
          { name: 'source_platform', type: 'string', required: false, description: t('api.params.source-platform'), constraints: 'max 50' },
          { name: 'source_type', type: 'string', required: false, description: t('api.params.source-type'), constraints: 'max 50' },
          { name: 'assigned_to', type: 'integer', required: false, description: t('api.params.assigned-to') },
          { name: 'priority', type: 'string', required: false, description: t('api.params.priority') },
          { name: 'currency', type: 'string', required: false, description: t('api.params.currency'), constraints: '3 chars (ISO 4217)' },
          { name: 'preferred_contact_method', type: 'string', required: false, description: t('api.params.preferred-contact'), constraints: 'max 50' },
          { name: 'timezone', type: 'string', required: false, description: t('api.params.timezone'), constraints: 'max 50' },
          { name: 'language', type: 'string', required: false, description: t('api.params.language'), constraints: 'max 5' },
          { name: 'ai_score', type: 'number', required: false, description: t('api.params.ai-score') },
          { name: 'tags', type: 'array', required: false, description: t('api.params.tags') },
          { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
          { name: 'is_active', type: 'boolean', required: false, description: t('api.params.is-active') },
          { name: 'address_line_1', type: 'string', required: false, description: t('api.params.address-line-1'), constraints: 'max 255' },
          { name: 'address_line_2', type: 'string', required: false, description: t('api.params.address-line-2'), constraints: 'max 255' },
          { name: 'neighborhood', type: 'string', required: false, description: t('api.params.neighborhood'), constraints: 'max 100' },
          { name: 'city', type: 'string', required: false, description: t('api.params.city'), constraints: 'max 100' },
          { name: 'state', type: 'string', required: false, description: t('api.params.state'), constraints: 'max 100' },
          { name: 'state_code', type: 'string', required: false, description: t('api.params.state-code'), constraints: 'max 10' },
          { name: 'postal_code', type: 'string', required: false, description: t('api.params.postal-code'), constraints: 'max 20' },
          { name: 'country', type: 'string', required: false, description: t('api.params.country'), constraints: 'max 100' },
        ],
        exampleBody: {
          priority: "urgent",
          tags: ["hot", "vip"],
          notes: "Client requested a callback by end of day."
        },
        exampleResponses: [
          {
            status: 200,
            label: '200 OK',
            body: {
              message: "Lead updated successfully",
              data: { id: 14, priority: "urgent", tags: ["hot", "vip"], notes: "Client requested a callback by end of day.", updated_at: "2026-02-21T09:30:00.000Z" }
            }
          },
          { status: 404, label: '404 Not Found', body: { message: "Lead not found" } },
          {
            status: 422,
            label: '422 Unprocessable Entity',
            body: {
              message: "The given data was invalid.",
              errors: { priority: ["The selected priority is invalid."], email: ["The email must be a valid email address."] }
            }
          }
        ]
      },

      // 5. Delete Lead
      {
        id: 'delete-lead',
        method: 'DELETE',
        path: '/leads/{id}',
        summary: t('api.delete-lead-summary'),
        description: t('api.delete-lead-description'),
        pathParams: [
          { name: 'id', type: 'integer', required: true, description: t('api.params.lead-id') },
        ],
        exampleResponses: [
          { status: 200, label: '200 OK', body: { message: "Lead deleted successfully" } },
          { status: 404, label: '404 Not Found', body: { message: "Lead not found" } },
        ]
      },
    ]
  },
  getSalesEndpoints(t),
  getProductsEndpoints(t),
  getEventsEndpoints(t),
  getAppointmentsEndpoints(t),
  getObservationsEndpoints(t),
  getTasksEndpoints(t),
  getLeadActionsEndpoints(t),
  getUsersEndpoints(t),
  getTeamsEndpoints(t),
  getLeadCompaniesEndpoints(t),
  getFunnelsEndpoints(t),
  getStagesEndpoints(t),
  getFilesEndpoints(t),
];
