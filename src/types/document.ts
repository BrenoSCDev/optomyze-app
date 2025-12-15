/**
 * DOCUMENT TYPE DEFINITIONS
 * 
 * Type definitions for lead documents management
 */

export type DocumentType = 
  | 'proposal'
  | 'contract'
  | 'nda'
  | 'invoice'
  | 'identity'
  | 'address_proof'
  | 'company_document'
  | 'other';

export type DocumentStatus = 
  | 'pending'
  | 'requested'
  | 'received'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface LeadDocument {
  id: number;
  lead_id: number;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  file_name?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  external_url?: string;
  expires_at?: string;
  uploaded_at?: string;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentPayload {
  lead_id: number;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  external_url?: string;
  expires_at?: string;
  file?: File;
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  external_url?: string;
  expires_at?: string;
  file?: File;
}
