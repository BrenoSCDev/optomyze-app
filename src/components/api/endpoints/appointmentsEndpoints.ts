import { EndpointCategory } from '../apiEndpointData';

export const getAppointmentsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.appointments'),
  endpoints: [
    {
      id: 'list-appointments',
      method: 'GET',
      path: '/appointments',
      summary: t('api.list-appointments-summary'),
      description: t('api.list-appointments-description'),
      queryParams: [
        { name: 'lead_id', type: 'integer', required: false, description: t('api.params.filter-lead-id') },
        { name: 'status', type: 'string', required: false, description: 'Filter by status: scheduled, completed, cancelled, no_show' },
        { name: 'start_from', type: 'date', required: false, description: t('api.params.event-start-from') },
        { name: 'start_to', type: 'date', required: false, description: t('api.params.event-start-to') },
        { name: 'per_page', type: 'integer', required: false, description: t('api.params.per-page') },
        { name: 'page', type: 'integer', required: false, description: t('api.params.page') },
      ],
      exampleResponses: [{
        status: 200, label: '200 OK',
        body: {
          current_page: 1,
          data: [{
            id: 1, lead_id: 14, appointment_type_id: 2, title: 'Initial Consultation',
            scheduled_at: '2026-04-01T10:00:00.000Z', end_at: '2026-04-01T10:30:00.000Z',
            timezone: 'America/New_York', status: 'scheduled', notes: 'Discuss pricing.',
            lead: { id: 14, first_name: 'John', last_name: 'Doe' },
            appointment_type: { id: 2, name: 'Consultation', color: '#6366f1', duration_minutes: 30 },
          }],
          last_page: 1, per_page: 20, total: 1
        }
      }]
    },
    {
      id: 'create-appointment',
      method: 'POST',
      path: '/appointments',
      summary: t('api.create-appointment-summary'),
      description: t('api.create-appointment-description'),
      bodyParams: [
        { name: 'lead_id', type: 'integer', required: true, description: t('api.params.lead-id') },
        { name: 'title', type: 'string', required: true, description: 'Appointment title', constraints: 'max 255' },
        { name: 'scheduled_at', type: 'datetime', required: true, description: 'Start date/time (ISO 8601)' },
        { name: 'appointment_type_id', type: 'integer', required: false, description: 'ID of the appointment type' },
        { name: 'end_at', type: 'datetime', required: false, description: 'End date/time (ISO 8601)' },
        { name: 'timezone', type: 'string', required: false, description: 'IANA timezone, e.g. America/New_York' },
        { name: 'notes', type: 'string', required: false, description: 'Optional notes' },
        { name: 'status', type: 'string', required: false, description: 'scheduled | completed | cancelled | no_show' },
      ],
      exampleBody: { lead_id: 14, appointment_type_id: 2, title: 'Discovery Call', scheduled_at: '2026-04-05T14:00:00.000Z', end_at: '2026-04-05T14:30:00.000Z', timezone: 'America/New_York', notes: 'First contact call.' },
      exampleResponses: [
        { status: 201, label: '201 Created', body: { message: 'Appointment created successfully', data: { id: 5, lead_id: 14, title: 'Discovery Call', scheduled_at: '2026-04-05T14:00:00.000Z', status: 'scheduled' } } }
      ]
    },
    {
      id: 'get-appointment',
      method: 'GET',
      path: '/appointments/{id}',
      summary: t('api.get-appointment-summary'),
      description: t('api.get-appointment-description'),
      pathParams: [{ name: 'id', type: 'integer', required: true, description: 'Appointment ID' }],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { data: { id: 5, lead_id: 14, title: 'Discovery Call', scheduled_at: '2026-04-05T14:00:00.000Z', status: 'scheduled', timezone: 'America/New_York' } } },
        { status: 404, label: '404 Not Found', body: { message: 'Appointment not found' } },
      ]
    },
    {
      id: 'update-appointment',
      method: 'PUT',
      path: '/appointments/{id}',
      summary: t('api.update-appointment-summary'),
      description: t('api.update-appointment-description'),
      pathParams: [{ name: 'id', type: 'integer', required: true, description: 'Appointment ID' }],
      bodyParams: [
        { name: 'title', type: 'string', required: false, description: 'Appointment title' },
        { name: 'scheduled_at', type: 'datetime', required: false, description: 'New start date/time' },
        { name: 'end_at', type: 'datetime', required: false, description: 'New end date/time' },
        { name: 'timezone', type: 'string', required: false, description: 'IANA timezone' },
        { name: 'status', type: 'string', required: false, description: 'scheduled | completed | cancelled | no_show' },
        { name: 'notes', type: 'string', required: false, description: 'Notes' },
      ],
      exampleBody: { status: 'completed', notes: 'Client confirmed interest.' },
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: 'Appointment updated successfully', data: { id: 5, status: 'completed' } } },
        { status: 404, label: '404 Not Found', body: { message: 'Appointment not found' } },
      ]
    },
    {
      id: 'delete-appointment',
      method: 'DELETE',
      path: '/appointments/{id}',
      summary: t('api.delete-appointment-summary'),
      description: t('api.delete-appointment-description'),
      pathParams: [{ name: 'id', type: 'integer', required: true, description: 'Appointment ID' }],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: 'Appointment deleted successfully' } },
        { status: 404, label: '404 Not Found', body: { message: 'Appointment not found' } },
      ]
    },
    {
      id: 'sync-appointment-products',
      method: 'POST',
      path: '/appointments/{id}/products/sync',
      summary: t('api.sync-appointment-products-summary'),
      description: t('api.sync-appointment-products-description'),
      pathParams: [{ name: 'id', type: 'integer', required: true, description: 'Appointment ID' }],
      bodyParams: [
        { name: 'product_ids', type: 'array', required: true, description: 'Array of product IDs. Replaces the appointment\'s full product set (sync).' },
        { name: 'product_ids.*', type: 'integer', required: true, description: 'Product ID (must exist)' },
      ],
      exampleBody: { product_ids: [12, 34] },
      exampleResponses: [
        {
          status: 200, label: '200 OK',
          body: { message: 'Products updated.', products: [{ id: 12, name: 'Enterprise Plan', sku: 'ENT-001', base_price: 1200.0, type: 'product' }] }
        },
        { status: 404, label: '404 Not Found', body: { message: 'Appointment not found' } },
      ]
    },
    {
      id: 'create-lead-appointment',
      method: 'POST',
      path: '/lead-appointments',
      summary: t('api.create-lead-appointment-summary'),
      description: t('api.create-lead-appointment-description'),
      bodyParams: [
        { name: 'phone', type: 'string', required: true, description: 'Lead phone number; matched against existing leads (Brazilian formats supported)', constraints: 'max 20' },
        { name: 'lead', type: 'object', required: false, description: 'Lead data used only when no lead matches the phone. lead.funnel_id and lead.first_name are then required.' },
        { name: 'appointment', type: 'object', required: true, description: 'Appointment data — always created on every call.' },
        { name: 'appointment.title', type: 'string', required: true, description: 'Appointment title', constraints: 'max 255' },
        { name: 'appointment.scheduled_at', type: 'datetime', required: true, description: 'Start date/time (ISO 8601)' },
        { name: 'appointment.end_at', type: 'datetime', required: false, description: 'End date/time (>= scheduled_at)' },
        { name: 'appointment.appointment_type_id', type: 'integer', required: false, description: 'ID of the appointment type' },
        { name: 'appointment.timezone', type: 'string', required: false, description: 'IANA timezone; defaults to company timezone' },
        { name: 'appointment.notes', type: 'string', required: false, description: 'Optional notes' },
        { name: 'appointment.status', type: 'string', required: false, description: 'draft | scheduled | completed | cancelled | no_show (default draft)' },
        { name: 'appointment.product_ids', type: 'array', required: false, description: 'Array of product IDs to link to the appointment' },
      ],
      exampleBody: {
        phone: '+5511999990000',
        lead: { funnel_id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        appointment: { appointment_type_id: 2, title: 'Discovery Call', scheduled_at: '2026-05-01T14:00:00.000Z', end_at: '2026-05-01T14:30:00.000Z', product_ids: [12] },
      },
      exampleResponses: [
        {
          status: 201, label: '201 Created',
          body: {
            message: 'Lead and appointment created successfully',
            data: {
              lead: { id: 14, first_name: 'John', last_name: 'Doe', phone: '5511999990000', funnel_id: 1, stage_id: 3 },
              lead_created: true,
              appointment: { id: 5, lead_id: 14, title: 'Discovery Call', scheduled_at: '2026-05-01T14:00:00.000Z', status: 'draft', timezone: 'America/Sao_Paulo' },
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: 'Funnel not found' } },
        { status: 422, label: '422 Unprocessable Entity', body: { message: 'lead.funnel_id and lead.first_name are required to create a new lead for this phone number' } },
      ]
    },
  ]
});
