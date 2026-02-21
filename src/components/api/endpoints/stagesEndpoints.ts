import { EndpointCategory } from '../apiEndpointData';

export const getStagesEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.stages'),
  endpoints: [
    {
      id: 'list-stages',
      method: 'GET',
      path: '/funnels/{funnelId}/stages',
      summary: t('api.list-stages-summary'),
      description: t('api.list-stages-description'),
      pathParams: [
        { name: 'funnelId', type: 'integer', required: true, description: t('api.params.stage-funnel-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: [
              { id: 3, funnel_id: 1, name: "New", order: 1, type: "entry", color: "#10B981", is_active: true },
              { id: 4, funnel_id: 1, name: "Contacted", order: 2, type: "stage", color: "#3B82F6", is_active: true },
              { id: 5, funnel_id: 1, name: "Qualified", order: 3, type: "won", color: "#6366F1", is_active: true }
            ]
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Funnel not found" } }
      ]
    },
    {
      id: 'create-stage',
      method: 'POST',
      path: '/funnels/{funnelId}/stages',
      summary: t('api.create-stage-summary'),
      description: t('api.create-stage-description'),
      pathParams: [
        { name: 'funnelId', type: 'integer', required: true, description: t('api.params.stage-funnel-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: true, description: t('api.params.stage-name'), constraints: 'max 255' },
        { name: 'type', type: 'string', required: true, description: t('api.params.stage-type') },
        { name: 'description', type: 'string', required: false, description: t('api.params.stage-description') },
        { name: 'color', type: 'string', required: false, description: t('api.params.stage-color') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.stage-is-active') },
      ],
      exampleBody: {
        name: "Demo Scheduled",
        description: "Lead has a demo booked.",
        type: "stage",
        color: "#F59E0B",
        is_active: true
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Stage created successfully",
            data: { id: 8, funnel_id: 1, name: "Demo Scheduled", order: 4, type: "stage", color: "#F59E0B", is_active: true }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Funnel not found" } }
      ]
    },
    {
      id: 'get-stage',
      method: 'GET',
      path: '/funnels/{funnelId}/stages/{stageId}',
      summary: t('api.get-stage-summary'),
      description: t('api.get-stage-description'),
      pathParams: [
        { name: 'funnelId', type: 'integer', required: true, description: t('api.params.stage-funnel-id') },
        { name: 'stageId', type: 'integer', required: true, description: t('api.params.stage-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 4,
              funnel_id: 1,
              name: "Contacted",
              description: null,
              order: 2,
              type: "stage",
              color: "#3B82F6",
              is_active: true,
              created_at: "2026-01-01T00:00:00.000Z"
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Stage not found" } }
      ]
    },
    {
      id: 'update-stage',
      method: 'PUT',
      path: '/funnels/{funnelId}/stages/{stageId}',
      summary: t('api.update-stage-summary'),
      description: t('api.update-stage-description'),
      pathParams: [
        { name: 'funnelId', type: 'integer', required: true, description: t('api.params.stage-funnel-id') },
        { name: 'stageId', type: 'integer', required: true, description: t('api.params.stage-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.stage-name'), constraints: 'max 255' },
        { name: 'description', type: 'string', required: false, description: t('api.params.stage-description') },
        { name: 'color', type: 'string', required: false, description: t('api.params.stage-color') },
        { name: 'type', type: 'string', required: false, description: t('api.params.stage-type') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.stage-is-active') },
      ],
      exampleBody: {
        name: "Initial Contact",
        color: "#60A5FA",
        is_active: false
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Stage updated successfully",
            data: { id: 4, name: "Initial Contact", color: "#60A5FA", is_active: false }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Stage not found" } }
      ]
    },
    {
      id: 'delete-stage',
      method: 'DELETE',
      path: '/funnels/{funnelId}/stages/{stageId}',
      summary: t('api.delete-stage-summary'),
      description: t('api.delete-stage-description'),
      pathParams: [
        { name: 'funnelId', type: 'integer', required: true, description: t('api.params.stage-funnel-id') },
        { name: 'stageId', type: 'integer', required: true, description: t('api.params.stage-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Stage deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Stage not found" } },
      ]
    },
  ]
});
