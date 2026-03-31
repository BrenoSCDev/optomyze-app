import { EndpointCategory } from '../apiEndpointData';

export const getObservationsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.observations'),
  endpoints: [
    {
      id: 'list-observations',
      method: 'GET',
      path: '/leads/{leadId}/observations',
      summary: t('api.list-observations-summary'),
      description: t('api.list-observations-description'),
      pathParams: [{ name: 'leadId', type: 'integer', required: true, description: t('api.params.lead-id') }],
      queryParams: [
        { name: 'per_page', type: 'integer', required: false, description: t('api.params.per-page') },
        { name: 'page', type: 'integer', required: false, description: t('api.params.page') },
      ],
      exampleResponses: [{
        status: 200, label: '200 OK',
        body: {
          current_page: 1,
          data: [{ id: 3, lead_id: 14, note: 'Client is very interested, wants a callback on Monday.', user: { id: 5, name: 'Jane Smith', email: 'jane@company.com' }, created_at: '2026-03-20T14:00:00.000Z' }],
          last_page: 1, per_page: 20, total: 1
        }
      }]
    },
    {
      id: 'create-observation',
      method: 'POST',
      path: '/leads/{leadId}/observations',
      summary: t('api.create-observation-summary'),
      description: t('api.create-observation-description'),
      pathParams: [{ name: 'leadId', type: 'integer', required: true, description: t('api.params.lead-id') }],
      bodyParams: [
        { name: 'lead_id', type: 'integer', required: true, description: t('api.params.lead-id') },
        { name: 'note', type: 'string', required: true, description: 'Observation text content' },
      ],
      exampleBody: { lead_id: 14, note: 'Client is very interested in the premium plan.' },
      exampleResponses: [
        { status: 201, label: '201 Created', body: { message: 'Observation created successfully', data: { id: 4, lead_id: 14, note: 'Client is very interested in the premium plan.', created_at: '2026-03-21T09:00:00.000Z' } } },
        { status: 404, label: '404 Not Found', body: { message: 'Lead not found' } },
      ]
    },
  ]
});
