import { EndpointCategory } from '../apiEndpointData';

export const getUsersEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.users'),
  endpoints: [
    {
      id: 'list-users',
      method: 'GET',
      path: '/users',
      summary: t('api.list-users-summary'),
      description: t('api.list-users-description'),
      queryParams: [
        { name: 'role', type: 'string', required: false, description: t('api.params.user-role') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.user-is-active') },
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
                id: 3,
                name: "Jane Smith",
                email: "jane@company.com",
                phone: "11988880000",
                role: "manager",
                is_active: true,
                created_at: "2026-01-10T08:00:00.000Z"
              }
            ],
            last_page: 1,
            per_page: 20,
            total: 8
          }
        }
      ]
    },
    {
      id: 'create-user',
      method: 'POST',
      path: '/users',
      summary: t('api.create-user-summary'),
      description: t('api.create-user-description'),
      bodyParams: [
        { name: 'name', type: 'string', required: true, description: t('api.params.user-name'), constraints: 'max 255' },
        { name: 'email', type: 'string', required: true, description: t('api.params.user-email') },
        { name: 'role', type: 'string', required: true, description: t('api.params.user-role-required') },
        { name: 'phone', type: 'string', required: false, description: t('api.params.user-phone'), constraints: 'max 20' },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.user-is-active-default') },
      ],
      exampleBody: {
        name: "Carlos Souza",
        email: "carlos@company.com",
        phone: "11977770000",
        role: "agent",
        is_active: true
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "User created successfully",
            data: { id: 11, name: "Carlos Souza", email: "carlos@company.com", role: "agent", is_active: true }
          }
        }
      ]
    },
    {
      id: 'get-user',
      method: 'GET',
      path: '/users/{id}',
      summary: t('api.get-user-summary'),
      description: t('api.get-user-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.user-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 3,
              name: "Jane Smith",
              email: "jane@company.com",
              phone: "11988880000",
              role: "manager",
              is_active: true,
              last_login_at: "2026-02-20T08:30:00.000Z",
              created_at: "2026-01-10T08:00:00.000Z"
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "User not found" } }
      ]
    },
    {
      id: 'update-user',
      method: 'PUT',
      path: '/users/{id}',
      summary: t('api.update-user-summary'),
      description: t('api.update-user-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.user-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.user-name'), constraints: 'max 255' },
        { name: 'email', type: 'string', required: false, description: t('api.params.user-email') },
        { name: 'phone', type: 'string', required: false, description: t('api.params.user-phone'), constraints: 'max 20' },
        { name: 'role', type: 'string', required: false, description: t('api.params.user-role-required') },
        { name: 'is_active', type: 'boolean', required: false, description: t('api.params.user-is-active') },
      ],
      exampleBody: {
        name: "Jane Silva",
        email: "jane.silva@company.com",
        phone: "11966660000",
        role: "agent",
        is_active: false
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "User updated successfully",
            data: { id: 3, name: "Jane Silva", email: "jane.silva@company.com", role: "agent", is_active: false }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "User not found" } }
      ]
    },
    {
      id: 'delete-user',
      method: 'DELETE',
      path: '/users/{id}',
      summary: t('api.delete-user-summary'),
      description: t('api.delete-user-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.user-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "User deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "User not found" } },
      ]
    },
  ]
});
