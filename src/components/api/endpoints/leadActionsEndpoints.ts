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
  ]
});
