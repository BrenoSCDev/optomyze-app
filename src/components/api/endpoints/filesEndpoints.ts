import { EndpointCategory } from '../apiEndpointData';

export const getFilesEndpoints = (t: (key: string) => string): EndpointCategory => ({
  categoryKey: t('api.files'),
  endpoints: [
    {
      id: 'get-file',
      method: 'GET',
      path: '/files/{path}',
      summary: t('api.get-file-summary'),
      description: t('api.get-file-description'),
      pathParams: [
        {
          name: 'path',
          type: 'string',
          required: true,
          description: t('api.params.file-path'),
        },
      ],
      queryParams: [
        {
          name: 'download',
          type: 'boolean',
          required: false,
          description: t('api.params.file-download'),
        },
      ],
      exampleResponses: [
        {
          status: 200,
          label: '200 OK — image/jpeg',
          body: { _note: 'Binary file content returned with appropriate Content-Type header (e.g. image/jpeg, image/png). Use this URL directly in <img> tags or download with ?download=1.' },
        },
        {
          status: 403,
          label: '403 Forbidden',
          body: { message: 'Forbidden' },
        },
        {
          status: 404,
          label: '404 Not Found',
          body: { message: 'File not found' },
        },
      ],
    },
  ],
});
