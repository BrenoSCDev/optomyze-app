import { EndpointCategory } from '../apiEndpointData';

export const getTeamsEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.teams'),
  endpoints: [
    {
      id: 'list-teams',
      method: 'GET',
      path: '/teams',
      summary: t('api.list-teams-summary'),
      description: t('api.list-teams-description'),
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
                id: 2,
                name: "Sales Team",
                description: "Handles all inbound leads.",
                manager_user_id: 3,
                created_at: "2026-01-15T08:00:00.000Z",
                manager: { id: 3, name: "Jane Smith", email: "jane@company.com" },
                users: [
                  { id: 5, name: "Carlos Souza", email: "carlos@company.com" }
                ]
              }
            ],
            last_page: 1,
            per_page: 20,
            total: 3
          }
        }
      ]
    },
    {
      id: 'create-team',
      method: 'POST',
      path: '/teams',
      summary: t('api.create-team-summary'),
      description: t('api.create-team-description'),
      bodyParams: [
        { name: 'name', type: 'string', required: true, description: t('api.params.team-name'), constraints: 'max 255' },
        { name: 'manager_user_id', type: 'integer', required: true, description: t('api.params.team-manager') },
        { name: 'description', type: 'string', required: false, description: t('api.params.team-description') },
        { name: 'users', type: 'array', required: false, description: t('api.params.team-users') },
      ],
      exampleBody: {
        name: "Enterprise Team",
        description: "Handles enterprise accounts.",
        manager_user_id: 3,
        users: [
          { id: 5, role: "closer" },
          { id: 6, role: "sdr" }
        ]
      },
      exampleResponses: [
        {
          status: 201,
          label: '201 Created',
          body: {
            message: "Team created successfully",
            data: {
              id: 4,
              name: "Enterprise Team",
              manager: { id: 3, name: "Jane Smith", email: "jane@company.com" },
              users: [
                { id: 5, name: "Carlos Souza", email: "carlos@company.com" },
                { id: 6, name: "Ana Lima", email: "ana@company.com" }
              ]
            }
          }
        }
      ]
    },
    {
      id: 'get-team',
      method: 'GET',
      path: '/teams/{id}',
      summary: t('api.get-team-summary'),
      description: t('api.get-team-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.team-id') },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            data: {
              id: 2,
              name: "Sales Team",
              description: "Handles all inbound leads.",
              manager: { id: 3, name: "Jane Smith", email: "jane@company.com" },
              users: [
                { id: 5, name: "Carlos Souza", email: "carlos@company.com" }
              ]
            }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Team not found" } }
      ]
    },
    {
      id: 'update-team',
      method: 'PUT',
      path: '/teams/{id}',
      summary: t('api.update-team-summary'),
      description: t('api.update-team-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.team-id') },
      ],
      bodyParams: [
        { name: 'name', type: 'string', required: false, description: t('api.params.team-name'), constraints: 'max 255' },
        { name: 'manager_user_id', type: 'integer', required: false, description: t('api.params.team-manager') },
        { name: 'description', type: 'string', required: false, description: t('api.params.team-description') },
        { name: 'users', type: 'array', required: false, description: t('api.params.team-users-sync') },
      ],
      exampleBody: {
        name: "Enterprise Sales Team",
        manager_user_id: 4,
        users: [
          { id: 5, role: "closer" },
          { id: 7, role: "sdr" }
        ]
      },
      exampleResponses: [
        {
          status: 200,
          label: '200 OK',
          body: {
            message: "Team updated successfully",
            data: { id: 2, name: "Enterprise Sales Team", manager: { id: 4, name: "Bob Lee", email: "bob@company.com" } }
          }
        },
        { status: 404, label: '404 Not Found', body: { message: "Team not found" } }
      ]
    },
    {
      id: 'delete-team',
      method: 'DELETE',
      path: '/teams/{id}',
      summary: t('api.delete-team-summary'),
      description: t('api.delete-team-description'),
      pathParams: [
        { name: 'id', type: 'integer', required: true, description: t('api.params.team-id') },
      ],
      exampleResponses: [
        { status: 200, label: '200 OK', body: { message: "Team deleted successfully" } },
        { status: 404, label: '404 Not Found', body: { message: "Team not found" } },
      ]
    },
  ]
});
