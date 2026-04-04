import { EndpointCategory } from '../apiEndpointData';

export const getProductsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.products'),
  endpoints: [
    {
      id: 'list-products',
      method: 'GET',
      path: '/products',
      summary: t('api.list-products-summary'),
      description: t('api.list-products-description'),
      queryParams: [
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.product-is-active') },
        { name: 'type', type: 'string', required: false, description: t('api.params.product-type') },
        { name: 'category', type: 'string', required: false, description: t('api.params.product-category') },
        { name: 'search', type: 'string', required: false, description: t('api.params.product-search') },
        { name: 'with_images', type: 'boolean', required: false, description: t('api.params.product-with-images') },
        { name: 'with_custom_fields', type: 'boolean', required: false, description: t('api.params.product-with-custom-fields') },
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
                name: "Enterprise Plan",
                description: "Full-featured enterprise subscription.",
                sku: "ENT-001",
                base_price: 1200.00,
                cost_price: null,
                type: "service",
                category: "Subscriptions",
                is_active: true,
                metadata: null,
                created_at: "2026-01-15T08:00:00.000Z",
                primary_image: { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1 }
              }
            ],
            last_page: 2,
            per_page: 20,
            total: 34
          }
        },
        {
          status: 200,
          label: '200 OK — with_images=1&with_custom_fields=1',
          body: {
            current_page: 1,
            data: [
              {
                id: 1,
                name: "Enterprise Plan",
                sku: "ENT-001",
                base_price: 1200.00,
                type: "service",
                is_active: true,
                primary_image: { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1 },
                images: [
                  { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1, alt_text: null },
                  { id: 4, url: "products/ent-2.jpg", is_primary: false, display_order: 2, alt_text: null }
                ],
                fields: [
                  { id: 1, field_type: "text", field_value: "12 months", created_at: "2026-01-15T08:00:00.000Z" }
                ]
              }
            ],
            last_page: 1,
            per_page: 20,
            total: 1
          }
        }
      ]
    },
    {
      id: 'create-product',
      method: 'POST',
      path: '/products',
      summary: t('api.create-product-summary'),
      description: t('api.create-product-description'),
      bodyParams: [
        { name: 'name', type: 'string', required: true, description: t('api.params.product-name'), constraints: 'max 255' },
        { name: 'sku', type: 'string', required: true, description: t('api.params.product-sku') },
        { name: 'base_price', type: 'number', required: true, description: t('api.params.product-base-price'), constraints: 'min 0' },
        { name: 'type', type: 'string', required: true, description: t('api.params.product-type-required') },
        { name: 'description', type: 'string', required: false, description: t('api.params.product-description') },
        { name: 'cost_price', type: 'number', required: false, description: t('api.params.product-cost-price') },
        { name: 'category', type: 'string', required: false, description: t('api.params.product-category'), constraints: 'max 255' },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.product-is-active-default') },
        { name: 'metadata', type: 'object', required: false, description: t('api.params.product-metadata') },
      ],
      exampleBody: {
        name: "Starter Plan",
        description: "Entry-level plan for small teams.",
        sku: "START-001",
        base_price: 299.00,
        cost_price: 50.00,
        type: "service",
        category: "Subscriptions",
        is_active: true,
        metadata: { billing_cycle: "monthly" }
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Product created successfully",
            data: { id: 12, name: "Starter Plan", sku: "START-001", base_price: 299.00, type: "service", is_active: true }
          }
        }
      ]
    },
    {
      id: 'get-product',
      method: 'GET',
      path: '/products/{id}',
      summary: t('api.get-product-summary'),
      description: t('api.get-product-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.product-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 1,
              name: "Enterprise Plan",
              description: "Full-featured enterprise subscription.",
              sku: "ENT-001",
              base_price: 1200.00,
              cost_price: null,
              type: "service",
              category: "Subscriptions",
              is_active: true,
              metadata: null,
              images: [
                { id: 3, url: "https://yourdomain.com/storage/products/ent.jpg", is_primary: true }
              ]
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } }
      ]
    },
    {
      id: 'update-product',
      method: 'PUT',
      path: '/products/{id}',
      summary: t('api.update-product-summary'),
      description: t('api.update-product-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.product-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.product-name'), constraints: 'max 255' },
        { name: 'sku', type: 'string', required: false, description: t('api.params.product-sku') },
        { name: 'base_price', type: 'number', required: false, description: t('api.params.product-base-price') },
        { name: 'type', type: 'string', required: false, description: t('api.params.product-type-required') },
        { name: 'description', type: 'string', required: false, description: t('api.params.product-description') },
        { name: 'cost_price', type: 'number', required: false, description: t('api.params.product-cost-price') },
        { name: 'category', type: 'string', required: false, description: t('api.params.product-category'), constraints: 'max 255' },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.product-is-active') },
        { name: 'metadata', type: 'object', required: false, description: t('api.params.product-metadata') },
      ],
      exampleBody: {
        name: "Enterprise Plan v2",
        base_price: 1400.00,
        is_active: false,
        category: "Legacy"
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Product updated successfully",
            data: { id: 1, name: "Enterprise Plan v2", base_price: 1400.00, is_active: false }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } }
      ]
    },
    {
      id: 'delete-product',
      method: 'DELETE',
      path: '/products/{id}',
      summary: t('api.delete-product-summary'),
      description: t('api.delete-product-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.product-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Product deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } },
      ]
    },
  ]
});
