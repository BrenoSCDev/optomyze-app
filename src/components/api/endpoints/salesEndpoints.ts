import { EndpointCategory } from '../apiEndpointData';

export const getSalesEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.sales'),
  endpoints: [
    {
      id: 'list-sales',
      method: 'GET',
      path: '/sales',
      summary: t('api.list-sales-summary'),
      description: t('api.list-sales-description'),
      queryParams: [
        { name: 'lead_id', type: 'integer', required: false, description: t('api.params.sale-filter-lead-id') },
        { name: 'status', type: 'string', required: false, description: t('api.params.sale-filter-status') },
        { name: 'funnel_id', type: 'integer', required: false, description: t('api.params.sale-filter-funnel-id') },
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
                id: 5,
                company_id: 2,
                lead_id: 14,
                user_id: 3,
                funnel_id: 2,
                stage_id: 7,
                name: "Enterprise Plan Q1",
                status: "pending",
                pricing_model: "product",
                subtotal: 1200.00,
                discount_total: 0.00,
                total: "1200.00",
                notes: null,
                created_at: "2026-02-20T10:00:00.000Z",
                updated_at: "2026-02-20T10:00:00.000Z",
                lead: { id: 14, first_name: "John", last_name: "Doe", email: "john@example.com" },
                user: { id: 3, name: "Jane Smith", email: "jane@company.com" },
                stage: { id: 7, name: "Proposal", color: "#3B82F6" }
              }
            ],
            last_page: 3,
            per_page: 20,
            total: 55
          }
        }
      ]
    },
    {
      id: 'create-sale',
      method: 'POST',
      path: '/sales',
      summary: t('api.create-sale-summary'),
      description: t('api.create-sale-description'),
      bodyParams: [
        { name: 'lead_id', type: 'integer', required: true, description: t('api.params.sale-lead-id') },
        { name: 'name', type: 'string', required: true, description: t('api.params.sale-name') },
        { name: 'pricing_model', type: 'string', required: true, description: t('api.params.sale-pricing-model') },
        { name: 'user_id', type: 'integer', required: false, description: t('api.params.sale-user-id') },
        { name: 'funnel_id', type: 'integer', required: false, description: t('api.params.sale-funnel-id') },
        { name: 'stage_id', type: 'integer', required: false, description: t('api.params.sale-stage-id') },
        { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
        { name: 'items', type: 'array', required: false, description: t('api.params.sale-items') },
        { name: 'charges', type: 'array', required: false, description: t('api.params.sale-charges') },
        { name: 'discounts', type: 'array', required: false, description: t('api.params.sale-discounts') },
        { name: 'commission_type', type: 'string', required: false, description: t('api.params.sale-commission-type') },
        { name: 'commission_value', type: 'number', required: false, description: t('api.params.sale-commission-value') },
        { name: 'reference_value', type: 'number', required: false, description: t('api.params.sale-reference-value') },
      ],
      exampleBody: {
        lead_id: 14,
        name: "Enterprise Plan Q1",
        pricing_model: "product",
        user_id: 3,
        funnel_id: 2,
        stage_id: 7,
        notes: "Discussed during call on Feb 20.",
        items: [
          { product_id: 1, product_name: "Enterprise Plan", quantity: 2, unit_price: 600.00 }
        ],
        charges: [
          { name: "Setup Fee", type: "fixed", value: 200.00 }
        ],
        discounts: [
          { name: "Promo 10%", type: "percentage", value: 10 }
        ]
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Sale created successfully",
            data: {
              id: 5,
              name: "Enterprise Plan Q1",
              status: "pending",
              pricing_model: "product",
              subtotal: 1200.00,
              discount_total: 120.00,
              total: "1280.00",
              items: [{ product_name: "Enterprise Plan", quantity: 2, unit_price: 600.00, total_price: 1200.00 }],
              charges: [{ name: "Setup Fee", type: "fixed", value: 200.00, calculated_amount: 200.00 }],
              discounts: [{ name: "Promo 10%", type: "percentage", value: 10, calculated_amount: 120.00 }]
            }
          }
        }
      ]
    },
    {
      id: 'get-sale',
      method: 'GET',
      path: '/sales/{id}',
      summary: t('api.get-sale-summary'),
      description: t('api.get-sale-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.sale-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 5,
              name: "Enterprise Plan Q1",
              status: "pending",
              pricing_model: "product",
              subtotal: 1200.00,
              discount_total: 120.00,
              total: "1280.00",
              notes: "Discussed during call on Feb 20.",
              closed_at: null,
              lost_at: null,
              created_at: "2026-02-20T10:00:00.000Z",
              lead: { id: 14, first_name: "John", last_name: "Doe", email: "john@example.com", phone: "11999990000" },
              user: { id: 3, name: "Jane Smith", email: "jane@company.com" },
              items: [{ product_name: "Enterprise Plan", quantity: 2, unit_price: 600.00, total_price: 1200.00 }],
              charges: [{ name: "Setup Fee", type: "fixed", value: 200.00, calculated_amount: 200.00 }],
              discounts: [{ name: "Promo 10%", type: "percentage", value: 10, calculated_amount: 120.00 }],
              stage: { id: 7, name: "Proposal", color: "#3B82F6" },
              funnel: { id: 2, name: "Deal Funnel" }
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Sale not found" } }
      ]
    },
    {
      id: 'update-sale',
      method: 'PUT',
      path: '/sales/{id}',
      summary: t('api.update-sale-summary'),
      description: t('api.update-sale-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.sale-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.sale-name') },
        { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
        { name: 'status', type: 'string', required: false, description: t('api.params.sale-filter-status') },
        { name: 'user_id', type: 'integer', required: false, description: t('api.params.sale-user-id') },
        { name: 'funnel_id', type: 'integer', required: false, description: t('api.params.sale-funnel-id') },
        { name: 'stage_id', type: 'integer', required: false, description: t('api.params.sale-stage-id') },
      ],
      exampleBody: {
        name: "Enterprise Plan Q1 — Revised",
        notes: "Follow-up scheduled for Friday.",
        status: "closed",
        user_id: 4,
        funnel_id: 2,
        stage_id: 9
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Sale updated successfully",
            data: { id: 5, name: "Enterprise Plan Q1 — Revised", status: "closed", updated_at: "2026-02-21T09:00:00.000Z" }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Sale not found" } }
      ]
    },
    {
      id: 'delete-sale',
      method: 'DELETE',
      path: '/sales/{id}',
      summary: t('api.delete-sale-summary'),
      description: t('api.delete-sale-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.sale-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Sale deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Sale not found" } },
      ]
    },
  ]
});
