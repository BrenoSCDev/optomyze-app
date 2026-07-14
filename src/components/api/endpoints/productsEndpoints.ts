import { EndpointCategory } from '../apiEndpointData';

export const getProductsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.products'),
  endpoints: [
    // ─── List Products ────────────────────────────────────────────────────────
    {
      id: 'list-products',
      method: 'GET',
      path: '/products',
      summary: t('api.list-products-summary'),
      description: t('api.list-products-description'),
      queryParams: [
        { name: 'is_active',           type: 'boolean', required: false, description: t('api.params.product-is-active') },
        { name: 'is_favorite',         type: 'boolean', required: false, description: 'Filter only favorite products.' },
        { name: 'archived',            type: 'boolean', required: false, description: 'Pass true to return archived products only. Defaults to non-archived.' },
        { name: 'type',                type: 'string',  required: false, description: t('api.params.product-type') },
        { name: 'category_id',         type: 'integer', required: false, description: 'Filter by product category ID.' },
        { name: 'search',              type: 'string',  required: false, description: t('api.params.product-search') },
        { name: 'with_images',         type: 'boolean', required: false, description: t('api.params.product-with-images') },
        { name: 'with_custom_fields',  type: 'boolean', required: false, description: t('api.params.product-with-custom-fields') },
        { name: 'per_page',            type: 'integer', required: false, description: t('api.params.per-page') },
        { name: 'page',                type: 'integer', required: false, description: t('api.params.page') },
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
                is_active: true,
                is_favorite: true,
                is_archived: false,
                archived_at: null,
                metadata: null,
                categories: [
                  { id: 2, name: "SaaS", color: "#6366f1" }
                ],
                primary_image: { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1 },
                created_at: "2026-01-15T08:00:00-03:00",
                updated_at: "2026-03-01T10:00:00-03:00"
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
                is_favorite: true,
                is_archived: false,
                categories: [
                  { id: 2, name: "SaaS", color: "#6366f1" }
                ],
                primary_image: { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1 },
                images: [
                  { id: 3, url: "products/ent.jpg", is_primary: true, display_order: 1, alt_text: null },
                  { id: 4, url: "products/ent-2.jpg", is_primary: false, display_order: 2, alt_text: null }
                ],
                fields: [
                  { id: 5, field_key: "duration", field_type: "text", field_value: "12 months", group_id: 2, icon: "FaClock" }
                ],
                field_groups: [
                  {
                    id: 2,
                    name: "Contract Details",
                    icon: "FaFileContract",
                    is_default: true,
                    display_order: 1,
                    fields: [
                      { id: 5, field_key: "duration", field_type: "text", field_value: "12 months", icon: "FaClock" }
                    ]
                  }
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

    // ─── List Product Categories ──────────────────────────────────────────────
    {
      id: 'list-product-categories',
      method: 'GET',
      path: '/product-categories',
      summary: 'List product categories',
      description: 'Returns all product categories belonging to your company, ordered alphabetically. Each entry includes a `products_count` with the number of products assigned to that category.',
      queryParams: [],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: [
              { id: 1, name: "Hardware",      description: null,                       color: "#10b981", products_count: 8  },
              { id: 2, name: "SaaS",          description: "Software subscriptions",   color: "#6366f1", products_count: 14 },
              { id: 3, name: "Subscriptions", description: null,                       color: "#f59e0b", products_count: 5  },
            ]
          }
        }
      ]
    },

    // ─── Get Product ──────────────────────────────────────────────────────────
    {
      id: 'get-product',
      method: 'GET',
      path: '/products/{id}',
      summary: t('api.get-product-summary'),
      description: t('api.get-product-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.product-id') },
      ],
      queryParams: [
        { name: 'with_custom_fields', type: 'boolean', required: false, description: 'Include fields and field_groups in response.' },
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
              is_active: true,
              is_favorite: true,
              is_archived: false,
              archived_at: null,
              metadata: null,
              categories: [
                { id: 2, name: "SaaS", color: "#6366f1" }
              ],
              images: [
                { id: 3, url: "https://yourdomain.com/storage/products/ent.jpg", is_primary: true }
              ],
              created_at: "2026-01-15T08:00:00-03:00",
              updated_at: "2026-03-01T10:00:00-03:00"
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } }
      ]
    },

    // ─── Create Product ───────────────────────────────────────────────────────
    {
      id: 'create-product',
      method: 'POST',
      path: '/products',
      summary: t('api.create-product-summary'),
      description: t('api.create-product-description'),
      bodyParams: [
        { name: 'name',         type: 'string',  required: true,  description: t('api.params.product-name'), constraints: 'max 255' },
        { name: 'sku',          type: 'string',  required: true,  description: t('api.params.product-sku') },
        { name: 'base_price',   type: 'number',  required: true,  description: t('api.params.product-base-price'), constraints: 'min 0' },
        { name: 'type',         type: 'string',  required: true,  description: t('api.params.product-type-required'), constraints: 'product | service | digital' },
        { name: 'description',  type: 'string',  required: false, description: t('api.params.product-description') },
        { name: 'cost_price',   type: 'number',  required: false, description: t('api.params.product-cost-price') },
        { name: 'is_active',    type: 'boolean', required: false, description: t('api.params.product-is-active-default') },
        { name: 'metadata',     type: 'object',  required: false, description: t('api.params.product-metadata') },
      ],
      exampleBody: {
        name: "Starter Plan",
        description: "Entry-level plan for small teams.",
        sku: "START-001",
        base_price: 299.00,
        cost_price: 50.00,
        type: "service",
        is_active: true,
        metadata: { billing_cycle: "monthly" }
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Product created successfully",
            data: {
              id: 12,
              name: "Starter Plan",
              sku: "START-001",
              base_price: 299.00,
              type: "service",
              is_active: true,
              is_favorite: false,
              is_archived: false,
              categories: [{ id: 2, name: "SaaS", color: "#6366f1" }]
            }
          }
        }
      ]
    },

    // ─── Update Product ───────────────────────────────────────────────────────
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
        { name: 'name',         type: 'string',  required: false, description: t('api.params.product-name'), constraints: 'max 255' },
        { name: 'sku',          type: 'string',  required: false, description: t('api.params.product-sku') },
        { name: 'base_price',   type: 'number',  required: false, description: t('api.params.product-base-price') },
        { name: 'type',         type: 'string',  required: false, description: t('api.params.product-type-required'), constraints: 'product | service' },
        { name: 'description',  type: 'string',  required: false, description: t('api.params.product-description') },
        { name: 'cost_price',   type: 'number',  required: false, description: t('api.params.product-cost-price') },
        { name: 'is_active',    type: 'boolean', required: false, description: t('api.params.product-is-active') },
        { name: 'metadata',     type: 'object',  required: false, description: t('api.params.product-metadata') },
      ],
      exampleBody: {
        name: "Enterprise Plan v2",
        base_price: 1400.00,
        is_active: false
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Product updated successfully",
            data: {
              id: 1,
              name: "Enterprise Plan v2",
              base_price: 1400.00,
              is_active: false,
              is_favorite: true,
              is_archived: false,
              categories: [
                { id: 1, name: "Hardware", color: "#10b981" },
                { id: 2, name: "SaaS", color: "#6366f1" }
              ]
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } }
      ]
    },

    // ─── Delete Product ───────────────────────────────────────────────────────
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
        { status: 200, label: '200 OK',        body: { message: "Product deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Product not found" } },
      ]
    },
  ]
});
