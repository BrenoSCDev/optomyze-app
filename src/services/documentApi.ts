/**
 * Document API Service
 * Handles lead document CRUD operations
 */

import api from './api';

export interface LeadDocument {
  id: number;
  lead_id: number;
  title: string;
  description: string | null;
  path: string;
  created_at: string;
  updated_at: string;
}

export const createDocument = async (
  leadId: number,
  title: string,
  description: string | null,
  file: File
): Promise<LeadDocument> => {
  const formData = new FormData();
  formData.append('lead_id', leadId.toString());
  formData.append('title', title);
  if (description) {
    formData.append('description', description);
  }
  formData.append('file', file);

  const response = await api.post('/api/lead-documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/api/lead-documents/${documentId}`);
};
