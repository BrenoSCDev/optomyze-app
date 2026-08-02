import { EndpointCategory } from '../apiEndpointData';

export const getFunnelsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.funnels'),
  endpoints: [
    {
      id: 'list-funnels',
      method: 'GET',
      path: '/funnels',
      summary: t('api.list-funnels-summary'),
      description: t('api.list-funnels-description'),
      queryParams: [
        { name: 'type', type: 'string', required: false, description: t('api.params.funnel-type') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.funnel-is-active') },
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
                id: 1,
                name: "Main Lead Funnel",
                description: "Primary inbound funnel.",
                type: "contact",
                is_active: true,
                created_at: "2026-01-01T00:00:00.000Z",
                stages: [
                  { id: 3, name: "New", order: 1, type: "entry", color: "#10B981" },
                  { id: 4, name: "Contacted", order: 2, type: "stage", color: "#3B82F6" },
                  { id: 5, name: "Qualified", order: 3, type: "won", color: "#6366F1" }
                ]
              }
            ],
            last_page: 1,
            per_page: 20,
            total: 3
          }
        }
      ]
    },
    {
      id: 'create-funnel',
      method: 'POST',
      path: '/funnels',
      summary: t('api.create-funnel-summary'),
      description: t('api.create-funnel-description'),
      bodyParams: [
        { name: 'name', type: 'string', required: true, description: t('api.params.funnel-name'), constraints: 'max 255' },
        { name: 'type', type: 'string', required: false, description: t('api.params.funnel-type-create') },
        { name: 'description', type: 'string', required: false, description: t('api.params.funnel-description') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.funnel-is-active-default') },
      ],
      exampleBody: {
        name: "Partner Referral Funnel",
        description: "Leads from partner referrals.",
        type: "contact",
        is_active: true
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Funnel created successfully",
            data: { id: 5, name: "Partner Referral Funnel", type: "contact", is_active: true }
          }
        }
      ]
    },
    {
      id: 'get-funnel',
      method: 'GET',
      path: '/funnels/{id}',
      summary: t('api.get-funnel-summary'),
      description: t('api.get-funnel-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.funnel-id-path') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 1,
              name: "Main Lead Funnel",
              type: "contact",
              is_active: true,
              stages: [
                { id: 3, name: "New", order: 1, type: "entry", color: "#10B981", is_active: true },
                { id: 4, name: "Contacted", order: 2, type: "stage", color: "#3B82F6", is_active: true }
              ]
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Funnel not found" } }
      ]
    },
    {
      id: 'update-funnel',
      method: 'PUT',
      path: '/funnels/{id}',
      summary: t('api.update-funnel-summary'),
      description: t('api.update-funnel-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.funnel-id-path') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.funnel-name'), constraints: 'max 255' },
        { name: 'description', type: 'string', required: false, description: t('api.params.funnel-description') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.funnel-is-active') },
      ],
      exampleBody: {
        name: "Main Inbound Funnel",
        description: "Updated description.",
        is_active: false
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Funnel updated successfully",
            data: { id: 1, name: "Main Inbound Funnel", is_active: false }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Funnel not found" } }
      ]
    },
    {
      id: 'delete-funnel',
      method: 'DELETE',
      path: '/funnels/{id}',
      summary: t('api.delete-funnel-summary'),
      description: t('api.delete-funnel-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.funnel-id-path') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Funnel deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Funnel not found" } },
      ]
    },
  ]
});
