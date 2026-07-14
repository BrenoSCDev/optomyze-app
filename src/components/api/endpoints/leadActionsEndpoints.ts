import { EndpointCategory } from '../apiEndpointData';

export const getLeadActionsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.lead-actions'),
  endpoints: [
    {
      id: 'lead-move-stage',
      method: 'POST',
      path: '/leads/{id}/move-stage',
      summary: t('api.move-lead-stage-summary'),
      description: t('api.move-lead-stage-description'),
      pathParams: [{ name: 'id', type: 'integer', required: true, description: t('api.params.lead-id') }],
      bodyParams: [
        { name: 'stage_id', type: 'integer', required: true, description: 'ID of the target funnel stage' },
      ],
      exampleBody: { stage_id: 5 },
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: 'Lead moved to stage successfully', data: { id: 14, stage_id: 5, stage: { id: 5, name: 'Negotiation', funnel_id: 1 } } } },
        { status: 404, label: '404 Not Found', body: { message: 'Lead not found' } },
        { status: 422, label: '422 Unprocessable Entity', body: { message: 'The given data was invalid.', errors: { stage_id: ['The selected stage id is invalid.'] } } },
      ]
    },
    {
      id: 'lead-link-products',
      method: 'POST',
      path: '/leads/{leadId}/products',
      summary: t('api.link-products-summary'),
      description: t('api.link-products-description'),
      pathParams: [{ name: 'leadId', type: 'integer', required: true, description: t('api.params.lead-id') }],
      bodyParams: [
        { name: 'products', type: 'array', required: true, description: 'Array of products of interest. Replaces the full set on each call (sync).' },
        { name: 'products.*.id', type: 'integer', required: true, description: 'Product ID (must exist and belong to the company)' },
        { name: 'products.*.quantity', type: 'integer', required: true, description: 'Quantity of interest', constraints: 'min 1' },
      ],
      exampleBody: { products: [{ id: 12, quantity: 2 }, { id: 34, quantity: 1 }] },
      exampleResponses: [
        {
          status: 200, label: '200 OK',
          body: {
            message: 'Products successfully linked to lead',
            data: {
              lead_id: 14,
              products: [
                { id: 12, name: 'Enterprise Plan', base_price: 1200.0, pivot: { quantity: 2, unit_price: 1200.0, total_price: 2400.0 } },
                { id: 34, name: 'Onboarding', base_price: 300.0, pivot: { quantity: 1, unit_price: 300.0, total_price: 300.0 } },
              ],
              grand_total: 2700.0,
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: 'Lead not found' } },
        { status: 422, label: '422 Unprocessable Entity', body: { message: 'The given data was invalid.', errors: { 'products.0.id': ['The selected products.0.id is invalid.'] } } },
      ]
    },
    {
      id: 'lead-conversation-report',
      method: 'POST',
      path: '/conversation-reports',
      summary: t('api.conversation-report-summary'),
      description: t('api.conversation-report-description'),
      bodyParams: [
        { name: 'lead_id', type: 'integer', required: true, description: t('api.params.lead-id') },
        { name: 'content', type: 'string', required: true, description: 'Report / conversation summary text' },
        { name: 'platform', type: 'string', required: false, description: 'Source platform of the conversation', constraints: 'max 255' },
        { name: 'workflow_id', type: 'string', required: false, description: 'n8n workflow id; resolved to the matching agent when present' },
      ],
      exampleBody: { lead_id: 14, content: 'Customer asked about pricing and requested a follow-up call.', platform: 'whatsapp' },
      exampleResponses: [
        { status: 201, label: '201 Created', body: { id: 42, lead_id: 14, n8n_agent_id: null, platform: 'whatsapp', content: 'Customer asked about pricing and requested a follow-up call.', created_at: '2026-04-10T12:00:00.000Z' } },
        { status: 422, label: '422 Unprocessable Entity', body: { message: 'The given data was invalid.', errors: { lead_id: ['The selected lead id is invalid.'] } } },
      ]
    },
  ]
});
