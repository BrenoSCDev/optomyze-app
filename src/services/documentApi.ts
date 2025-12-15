/**
 * DOCUMENT API SERVICE
 * 
 * API service for lead documents management
 */

import api from './api';
import { LeadDocument, CreateDocumentPayload, UpdateDocumentPayload } from '@/types/document';

export const documentApi = {
  /**
   * Create a new document
   */
  async create(payload: CreateDocumentPayload): Promise<LeadDocument> {
    const formData = new FormData();
    
    formData.append('lead_id', payload.lead_id.toString());
    formData.append('title', payload.title);
    formData.append('type', payload.type);
    formData.append('status', payload.status);
    
    if (payload.description) {
      formData.append('description', payload.description);
    }
    if (payload.external_url) {
      formData.append('external_url', payload.external_url);
    }
    if (payload.expires_at) {
      formData.append('expires_at', payload.expires_at);
    }
    if (payload.file) {
      formData.append('file', payload.file);
    }
    
    const response = await api.post('/api/lead-documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.document || response.data;
  },

  /**
   * Update an existing document
   */
  async update(documentId: number, payload: UpdateDocumentPayload): Promise<LeadDocument> {
    const formData = new FormData();
    
    // Add _method for Laravel to handle PUT with FormData
    formData.append('_method', 'PUT');
    
    if (payload.title !== undefined) {
      formData.append('title', payload.title);
    }
    if (payload.description !== undefined) {
      formData.append('description', payload.description);
    }
    if (payload.type !== undefined) {
      formData.append('type', payload.type);
    }
    if (payload.status !== undefined) {
      formData.append('status', payload.status);
    }
    if (payload.external_url !== undefined) {
      formData.append('external_url', payload.external_url);
    }
    if (payload.expires_at !== undefined) {
      formData.append('expires_at', payload.expires_at);
    }
    if (payload.file) {
      formData.append('file', payload.file);
    }
    
    const response = await api.post(`/api/lead-documents/${documentId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.document || response.data;
  },

  /**
   * Delete a document
   */
  async delete(documentId: number): Promise<void> {
    await api.delete(`/api/lead-documents/${documentId}`);
  },

  /**
   * Get document download URL
   */
  getDownloadUrl(document: LeadDocument): string | null {
    if (document.file_path) {
      return `${api.defaults.baseURL}/api/lead-documents/${document.id}/download`;
    }
    return null;
  },
};

export default documentApi;
