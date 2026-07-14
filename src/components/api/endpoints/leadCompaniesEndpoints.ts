import { EndpointCategory } from '../apiEndpointData';

export const getLeadCompaniesEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.lead-companies'),
  endpoints: [
    {
      id: 'list-lead-companies',
      method: 'GET',
      path: '/lead-companies',
      summary: t('api.list-lead-companies-summary'),
      description: t('api.list-lead-companies-description'),
      queryParams: [
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
                id: 7,
                legal_name: "Acme Corp",
                trade_name: "Acme",
                tax_id: "12.345.678/0001-90",
                industry: "Technology",
                company_size: "51-200",
                website: "https://acme.com",
                email: "contact@acme.com",
                phone: "11999990000",
                city: "São Paulo",
                state: "SP",
                country: "Brazil",
                status: "active",
                leads_count: 4,
                created_at: "2026-01-20T10:00:00.000Z"
              }
            ],
            last_page: 2,
            per_page: 20,
            total: 28
          }
        }
      ]
    },
    {
      id: 'create-lead-company',
      method: 'POST',
      path: '/lead-companies',
      summary: t('api.create-lead-company-summary'),
      description: t('api.create-lead-company-description'),
      bodyParams: [
        { name: 'legal_name', type: 'string', required: true, description: t('api.params.company-legal-name'), constraints: 'max 255' },
        { name: 'trade_name', type: 'string', required: false, description: t('api.params.company-trade-name') },
        { name: 'tax_id', type: 'string', required: false, description: t('api.params.company-tax-id'), constraints: 'max 100' },
        { name: 'industry', type: 'string', required: false, description: t('api.params.company-industry') },
        { name: 'company_size', type: 'string', required: false, description: t('api.params.company-size') },
        { name: 'website', type: 'string', required: false, description: t('api.params.company-website') },
        { name: 'email', type: 'string', required: false, description: t('api.params.company-email') },
        { name: 'phone', type: 'string', required: false, description: t('api.params.company-phone'), constraints: 'max 50' },
        { name: 'secondary_phone', type: 'string', required: false, description: t('api.params.company-secondary-phone'), constraints: 'max 50' },
        { name: 'street', type: 'string', required: false, description: t('api.params.company-street') },
        { name: 'number', type: 'string', required: false, description: t('api.params.company-number') },
        { name: 'complement', type: 'string', required: false, description: t('api.params.company-complement') },
        { name: 'neighborhood', type: 'string', required: false, description: t('api.params.neighborhood') },
        { name: 'city', type: 'string', required: false, description: t('api.params.city') },
        { name: 'state', type: 'string', required: false, description: t('api.params.state') },
        { name: 'postal_code', type: 'string', required: false, description: t('api.params.postal-code') },
        { name: 'country', type: 'string', required: false, description: t('api.params.country') },
        { name: 'source', type: 'string', required: false, description: t('api.params.company-source') },
        { name: 'status', type: 'string', required: false, description: t('api.params.company-status') },
        { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
      ],
      exampleBody: {
        legal_name: "Acme Corp",
        trade_name: "Acme",
        tax_id: "12.345.678/0001-90",
        industry: "Technology",
        company_size: "51-200",
        website: "https://acme.com",
        email: "contact@acme.com",
        phone: "11999990000",
        street: "Av. Paulista",
        number: "1000",
        complement: "10th floor",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "São Paulo",
        postal_code: "01310-100",
        country: "Brazil",
        source: "outbound",
        status: "active",
        notes: "Met at SaaStr 2025."
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Company created successfully",
            data: { id: 7, legal_name: "Acme Corp", industry: "Technology", city: "São Paulo" }
          }
        }
      ]
    },
    {
      id: 'get-lead-company',
      method: 'GET',
      path: '/lead-companies/{id}',
      summary: t('api.get-lead-company-summary'),
      description: t('api.get-lead-company-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.company-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 7,
              legal_name: "Acme Corp",
              trade_name: "Acme",
              tax_id: "12.345.678/0001-90",
              industry: "Technology",
              company_size: "51-200",
              website: "https://acme.com",
              email: "contact@acme.com",
              phone: "11999990000",
              city: "São Paulo",
              state: "SP",
              country: "Brazil",
              notes: "Met at SaaStr 2025.",
              status: "active",
              created_at: "2026-01-20T10:00:00.000Z"
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Company not found" } }
      ]
    },
    {
      id: 'update-lead-company',
      method: 'PUT',
      path: '/lead-companies/{id}',
      summary: t('api.update-lead-company-summary'),
      description: t('api.update-lead-company-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.company-id') },
      ],
      bodyParams: [
        { name: 'legal_name', type: 'string', required: false, description: t('api.params.company-legal-name'), constraints: 'max 255' },
        { name: 'trade_name', type: 'string', required: false, description: t('api.params.company-trade-name') },
        { name: 'tax_id', type: 'string', required: false, description: t('api.params.company-tax-id'), constraints: 'max 100' },
        { name: 'industry', type: 'string', required: false, description: t('api.params.company-industry') },
        { name: 'company_size', type: 'string', required: false, description: t('api.params.company-size') },
        { name: 'website', type: 'string', required: false, description: t('api.params.company-website') },
        { name: 'email', type: 'string', required: false, description: t('api.params.company-email') },
        { name: 'phone', type: 'string', required: false, description: t('api.params.company-phone'), constraints: 'max 50' },
        { name: 'secondary_phone', type: 'string', required: false, description: t('api.params.company-secondary-phone'), constraints: 'max 50' },
        { name: 'street', type: 'string', required: false, description: t('api.params.company-street') },
        { name: 'number', type: 'string', required: false, description: t('api.params.company-number') },
        { name: 'complement', type: 'string', required: false, description: t('api.params.company-complement') },
        { name: 'neighborhood', type: 'string', required: false, description: t('api.params.neighborhood') },
        { name: 'city', type: 'string', required: false, description: t('api.params.city') },
        { name: 'state', type: 'string', required: false, description: t('api.params.state') },
        { name: 'postal_code', type: 'string', required: false, description: t('api.params.postal-code') },
        { name: 'country', type: 'string', required: false, description: t('api.params.country') },
        { name: 'source', type: 'string', required: false, description: t('api.params.company-source') },
        { name: 'status', type: 'string', required: false, description: t('api.params.company-status') },
        { name: 'notes', type: 'string', required: false, description: t('api.params.notes') },
      ],
      exampleBody: {
        trade_name: "Acme International",
        industry: "SaaS",
        status: "inactive"
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Company updated successfully",
            data: { id: 7, trade_name: "Acme International", industry: "SaaS", status: "inactive" }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Company not found" } }
      ]
    },
    {
      id: 'delete-lead-company',
      method: 'DELETE',
      path: '/lead-companies/{id}',
      summary: t('api.delete-lead-company-summary'),
      description: t('api.delete-lead-company-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.company-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Company deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Company not found" } },
      ]
    },
  ]
});
