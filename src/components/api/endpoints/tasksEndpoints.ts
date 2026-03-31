import { EndpointCategory } from '../apiEndpointData';

export const getTasksEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.tasks'),
  endpoints: [
    {
      id: 'list-tasks',
      method: 'GET',
      path: '/tasks',
      summary: t('api.list-tasks-summary'),
      description: t('api.list-tasks-description'),
      queryParams: [
        { name: 'lead_id', type: 'integer', required: false, description: t('api.params.filter-lead-id') },
        { name: 'status', type: 'string', required: false, description: 'Filter by status: pending, in_progress, completed, cancelled' },
        { name: 'priority', type: 'string', required: false, description: 'Filter by priority: low, medium, high, urgent' },
        { name: 'per_page', type: 'integer', required: false, description: t('api.params.per-page') },
        { name: 'page', type: 'integer', required: false, description: t('api.params.page') },
      ],
      exampleResponses: [{
        status: 200, label: '200 OK',
        body: {
          current_page: 1,
          data: [{ id: 7, lead_id: 14, title: 'Send follow-up email', description: null, priority: 'high', status: 'pending', due_date: '2026-04-02T09:00:00.000Z', lead: { id: 14, first_name: 'John', last_name: 'Doe' } }],
          last_page: 1, per_page: 20, total: 1
        }
      }]
    },
    {
      id: 'create-task',
      method: 'POST',
      path: '/tasks',
      summary: t('api.create-task-summary'),
      description: t('api.create-task-description'),
      bodyParams: [
        { name: 'lead_id', type: 'integer', required: true, description: t('api.params.lead-id') },
        { name: 'title', type: 'string', required: true, description: 'Task title', constraints: 'max 255' },
        { name: 'description', type: 'string', required: false, description: 'Task description' },
        { name: 'priority', type: 'string', required: false, description: 'low | medium | high | urgent' },
        { name: 'status', type: 'string', required: false, description: 'pending | in_progress | completed | cancelled' },
        { name: 'due_date', type: 'datetime', required: false, description: 'Due date (ISO 8601)' },
        { name: 'assigned_to', type: 'integer', required: false, description: 'User ID to assign the task to' },
      ],
      exampleBody: { lead_id: 14, title: 'Send proposal', priority: 'high', status: 'pending', due_date: '2026-04-05T12:00:00.000Z' },
      exampleResponses: [
        { status: 201, label: '201 Created', body: { message: 'Task created successfully', data: { id: 8, lead_id: 14, title: 'Send proposal', priority: 'high', status: 'pending' } } },
        { status: 404, label: '404 Not Found', body: { message: 'Lead not found' } },
      ]
    },
  ]
});
