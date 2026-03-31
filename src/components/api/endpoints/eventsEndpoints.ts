import { EndpointCategory } from '../apiEndpointData';

export const getEventsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.events'),
  endpoints: [
    {
      id: 'list-events',
      method: 'GET',
      path: '/events',
      summary: t('api.list-events-summary'),
      description: t('api.list-events-description'),
      queryParams: [
        { name: 'type', type: 'string', required: false, description: t('api.params.event-type') },
        { name: 'start_from', type: 'date', required: false, description: t('api.params.event-start-from') },
        { name: 'start_to', type: 'date', required: false, description: t('api.params.event-start-to') },
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
                id: 8,
                title: "Demo call with John Doe",
                description: "Product demo for Enterprise Plan.",
                type: "call",
                start_at: "2026-02-22T14:00:00.000Z",
                end_at: "2026-02-22T15:00:00.000Z",
                all_day: false,
                reminder: true,
                created_at: "2026-02-20T09:00:00.000Z"
              }
            ],
            last_page: 1,
            per_page: 20,
            total: 5
          }
        }
      ]
    },
    {
      id: 'create-event',
      method: 'POST',
      path: '/events',
      summary: t('api.create-event-summary'),
      description: t('api.create-event-description'),
      bodyParams: [
        { name: 'title', type: 'string', required: true, description: t('api.params.event-title'), constraints: 'max 255' },
        { name: 'start_at', type: 'date', required: true, description: t('api.params.event-start-at') },
        { name: 'description', type: 'string', required: false, description: t('api.params.event-description') },
        { name: 'type', type: 'string', required: false, description: t('api.params.event-type-label') },
        { name: 'end_at', type: 'date', required: false, description: t('api.params.event-end-at') },
        { name: 'all_day', type: 'boolean', required: false, description: t('api.params.event-all-day') },
        { name: 'reminder', type: 'boolean', required: false, description: t('api.params.event-reminder') },
      ],
      exampleBody: {
        title: "Follow-up call",
        description: "Check if client reviewed the proposal.",
        type: "call",
        start_at: "2026-02-25T10:00:00.000Z",
        end_at: "2026-02-25T10:30:00.000Z",
        all_day: false,
        reminder: true
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Event created successfully",
            data: { id: 9, title: "Follow-up call", start_at: "2026-02-25T10:00:00.000Z", all_day: false, reminder: true }
          }
        }
      ]
    },
    {
      id: 'get-event',
      method: 'GET',
      path: '/events/{id}',
      summary: t('api.get-event-summary'),
      description: t('api.get-event-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.event-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 8,
              title: "Demo call with John Doe",
              description: "Product demo for Enterprise Plan.",
              type: "call",
              start_at: "2026-02-22T14:00:00.000Z",
              end_at: "2026-02-22T15:00:00.000Z",
              all_day: false,
              reminder: true,
              created_at: "2026-02-20T09:00:00.000Z",
              updated_at: "2026-02-20T09:00:00.000Z"
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Event not found" } }
      ]
    },
    {
      id: 'update-event',
      method: 'PUT',
      path: '/events/{id}',
      summary: t('api.update-event-summary'),
      description: t('api.update-event-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.event-id') },
      ],
      bodyParams: [
        { name: 'title', type: 'string', required: false, description: t('api.params.event-title'), constraints: 'max 255' },
        { name: 'start_at', type: 'date', required: false, description: t('api.params.event-start-at') },
        { name: 'description', type: 'string', required: false, description: t('api.params.event-description') },
        { name: 'type', type: 'string', required: false, description: t('api.params.event-type-label') },
        { name: 'end_at', type: 'date', required: false, description: t('api.params.event-end-at') },
        { name: 'all_day', type: 'boolean', required: false, description: t('api.params.event-all-day') },
        { name: 'reminder', type: 'boolean', required: false, description: t('api.params.event-reminder') },
      ],
      exampleBody: {
        title: "Demo call — rescheduled",
        start_at: "2026-02-24T15:00:00.000Z",
        end_at: "2026-02-24T16:00:00.000Z"
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Event updated successfully",
            data: { id: 8, title: "Demo call — rescheduled", start_at: "2026-02-24T15:00:00.000Z" }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Event not found" } }
      ]
    },
    {
      id: 'delete-event',
      method: 'DELETE',
      path: '/events/{id}',
      summary: t('api.delete-event-summary'),
      description: t('api.delete-event-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.event-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Event deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Event not found" } },
      ]
    },
  ]
});
