/**
 * DOCUMENT AUTOMATION API
 *
 * A contract is a document whose type sits in the `contract` category, so this
 * one client serves contracts, proposals, quotes and NDAs. Signing is a stage
 * of a document's life — there is no standalone signature-request API.
 */

import api from './api';
import type { SignatureSigner } from './signatureApi';

export type DocumentStatus =
  | 'draft'
  | 'pending_approval'
  | 'ready_to_send'
  | 'waiting_signature'
  | 'partially_signed'
  | 'signed'
  | 'rejected'
  | 'expired'
  | 'cancelled'
  | 'archived';

export type DocumentCategory = 'contract' | 'proposal' | 'quote' | 'nda' | 'other';

/** Columns a user can drag between; everything else is provider-driven. */
export const DOCUMENT_BOARD_STATUSES: DocumentStatus[] = [
  'draft',
  'pending_approval',
  'ready_to_send',
  'waiting_signature',
  'partially_signed',
  'signed',
];

export const DOCUMENT_MANUAL_STATUSES: DocumentStatus[] = [
  'draft',
  'pending_approval',
  'ready_to_send',
  'cancelled',
  'archived',
];

export const DOCUMENT_STATUS_KEYS: Record<DocumentStatus, string> = {
  draft: 'documents.status.draft',
  pending_approval: 'documents.status.pending_approval',
  ready_to_send: 'documents.status.ready_to_send',
  waiting_signature: 'documents.status.waiting_signature',
  partially_signed: 'documents.status.partially_signed',
  signed: 'documents.status.signed',
  rejected: 'documents.status.rejected',
  expired: 'documents.status.expired',
  cancelled: 'documents.status.cancelled',
  archived: 'documents.status.archived',
};

export interface DocumentType {
  id: number;
  key: string;
  label: string;
  description: string | null;
  category: DocumentCategory;
  is_system: boolean;
  requires_signature: boolean;
  requires_approval: boolean;
  default_template_id: number | null;
  is_active: boolean;
  position: number;
}

export interface DocumentVersion {
  id: number;
  version_number: number;
  pdf_size_bytes: number | null;
  checksum: string | null;
  has_pdf: boolean;
  generated_by: string | null;
  created_at: string;
}

export interface DocumentTemplate {
  id: number;
  document_type_id: number | null;
  type_label: string | null;
  name: string;
  description: string | null;
  variables_schema: { referenced?: string[]; requires?: string[] };
  is_published: boolean;
  published_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  body_html?: string;
  header_html?: string | null;
  footer_html?: string | null;

  /**
   * The structured document model — the source of truth.
   *
   * Null on templates authored before the visual editor. That is the signal
   * the editor uses to fall back to parsing `body_html` instead, which is why
   * no migration of existing templates was needed.
   */
  body_doc?: Record<string, unknown> | null;
  header_doc?: Record<string, unknown> | null;
  footer_doc?: Record<string, unknown> | null;
  doc_schema_version?: number | null;
  has_structured_body?: boolean;
  page_settings?: PageSettingsPayload;
}

/** Mirrors DocumentTemplate::DEFAULT_PAGE_SETTINGS on the server. */
export interface PageSettingsPayload {
  paper: 'a4' | 'letter' | 'legal' | 'a3' | 'a5';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  header_offset: number;
  footer_offset: number;
  font_family: string;
  font_size: number;
  line_height: number;
  paragraph_spacing: number;
}

/** An uploaded image, referenced by URL rather than embedded as bytes. */
export interface DocumentAsset {
  path: string;
  url: string;
  mime: string;
  size: number;
}

export interface TemplateRevision {
  id: number;
  revision_number: number;
  trigger: 'autosave' | 'manual' | 'publish' | 'restore';
  label: string | null;
  author: string | null;
  created_at: string;
}

export interface DocumentVariable {
  id: number;
  key: string;
  label: string;
  value: string | null;
  group: string;
  description: string | null;
  token: string;
}

/** One insertable variable, as the backend's registry declares it. */
export interface VariableGroup {
  group: string;
  label: string;
  requires: string | null;
  variables: { token: string; label: string; example?: string }[];
}

export interface DocumentRecord {
  id: number;
  number: string;
  title: string;
  status: DocumentStatus;
  document_type_id: number | null;
  type_label: string | null;
  category: DocumentCategory | null;
  lead_id: number | null;
  lead_name: string | null;
  sale_id: number | null;
  deal_name: string | null;
  lead_company_id: number | null;
  owner_id: number | null;
  owner_name: string | null;
  value: string | number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  sent_at: string | null;
  signed_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  archived_at: string | null;
  version_number: number | null;
  has_pdf: boolean;
  is_editable: boolean;
  created_at: string;

  // Detail only
  document_template_id?: number | null;
  template_name?: string | null;
  created_by?: string | null;
  renewal_frequency?: string | null;
  notice_period_days?: number | null;
  approval_status?: string | null;
  versions?: DocumentVersion[];
  signature?: {
    id: number;
    status: string;
    provider: string;
    sent_at: string | null;
    last_error: string | null;
    signers: SignatureSigner[];
    documents: { id: number; filename: string; download_status: string; has_signed_copy: boolean }[];
  } | null;
}

/**
 * One entry in a document's transaction history.
 *
 * `channel` splits two audiences: 'business' is the account a salesperson or a
 * lawyer reads, 'technical' is the provider API traffic, only present when the
 * caller asked for it AND may see it — the server decides, hence
 * `technical_included` on the response rather than trusting the request.
 */
export interface DocumentHistoryEntry {
  id: string;
  channel: 'business' | 'technical';
  type: string;
  title: string;
  detail: string | null;
  actor: string | null;
  provider?: string | null;
  success?: boolean;
  duration_ms?: number | null;
  error?: string | null;
  at: string;
}

export interface DocumentHistoryResponse {
  data: DocumentHistoryEntry[];
  technical_included: boolean;
}

export interface CreateDocumentPayload {
  document_type_id: number;
  title: string;
  document_template_id?: number | null;
  lead_id?: number | null;
  sale_id?: number | null;
  lead_company_id?: number | null;
  owner_id?: number | null;
  value?: number | null;
  currency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  renewal_date?: string | null;
  auto_renew?: boolean;
  renewal_frequency?: string | null;
  notice_period_days?: number | null;
  /** Render the first version immediately. */
  generate?: boolean;
}

export interface SendDocumentPayload {
  signers: {
    name: string;
    email?: string;
    phone?: string;
    document_number?: string;
    signing_group?: number;
    refusable?: boolean;
    lead_id?: number | null;
    auth_methods?: string[];
  }[];
  message?: string;
  subject?: string;
  reminder_interval?: number | null;
  block_after_refusal?: boolean;
  deadline_at?: string | null;
}

export const documentService = {
  /* ---------------- documents ---------------- */

  async list(params?: {
    status?: string;
    category?: DocumentCategory;
    document_type_id?: number;
    lead_id?: number;
    sale_id?: number;
    search?: string;
    include_archived?: boolean;
    per_page?: number;
  }): Promise<{ data: DocumentRecord[]; meta: Record<string, number> }> {
    const response = await api.get('/api/documents', { params });
    return response.data;
  },

  /** Every card at once, for the Kanban. */
  async board(params?: { category?: DocumentCategory; search?: string }): Promise<{
    data: DocumentRecord[];
    statuses: DocumentStatus[];
  }> {
    const response = await api.get('/api/documents', { params: { ...params, board: 1 } });
    return response.data;
  },

  async get(id: number): Promise<DocumentRecord> {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  async create(payload: CreateDocumentPayload): Promise<DocumentRecord> {
    const response = await api.post('/api/documents', payload);
    return response.data.data;
  },

  async update(id: number, payload: Partial<CreateDocumentPayload>): Promise<DocumentRecord> {
    const response = await api.put(`/api/documents/${id}`, payload);
    return response.data.data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },

  /** Render a new immutable version from the attached template. */
  async generate(id: number): Promise<DocumentRecord> {
    const response = await api.post(`/api/documents/${id}/generate`);
    return response.data.data;
  },

  async send(id: number, payload: SendDocumentPayload): Promise<DocumentRecord> {
    const response = await api.post(`/api/documents/${id}/send`, payload);
    return response.data.data;
  },

  async cancel(id: number): Promise<DocumentRecord> {
    const response = await api.post(`/api/documents/${id}/cancel`);
    return response.data.data;
  },

  async setStatus(id: number, status: DocumentStatus): Promise<DocumentRecord> {
    const response = await api.patch(`/api/documents/${id}/status`, { status });
    return response.data.data;
  },

  async versions(id: number): Promise<DocumentVersion[]> {
    const response = await api.get(`/api/documents/${id}/versions`);
    return response.data.data;
  },

  async history(id: number, technical = false): Promise<DocumentHistoryResponse> {
    const response = await api.get(`/api/documents/${id}/history`, {
      params: technical ? { technical: 1 } : undefined,
    });
    return response.data;
  },

  async versionHtml(id: number, versionId: number): Promise<{ version_number: number; html: string }> {
    const response = await api.get(`/api/documents/${id}/versions/${versionId}/preview`);
    return response.data;
  },

  async download(id: number, versionId?: number): Promise<Blob> {
    const url = versionId
      ? `/api/documents/${id}/versions/${versionId}/download`
      : `/api/documents/${id}/download`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  /* ---------------- templates ---------------- */

  async templates(params?: { published_only?: boolean; document_type_id?: number }): Promise<DocumentTemplate[]> {
    const response = await api.get('/api/document-templates', { params });
    return response.data.data;
  },

  async template(id: number): Promise<DocumentTemplate> {
    const response = await api.get(`/api/document-templates/${id}`);
    return response.data;
  },

  async createTemplate(payload: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const response = await api.post('/api/document-templates', payload);
    return response.data.data;
  },

  async updateTemplate(id: number, payload: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const response = await api.put(`/api/document-templates/${id}`, payload);
    return response.data.data;
  },

  async publishTemplate(id: number, published: boolean): Promise<DocumentTemplate> {
    const response = await api.post(`/api/document-templates/${id}/publish`, { published });
    return response.data.data;
  },

  async removeTemplate(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/document-templates/${id}`);
    return response.data;
  },

  /**
   * Render a body without saving — the editor's preview.
   *
   * `lead_id`/`sale_id` are the "Preview with CRM data" path: the server
   * resolves variables against a real record without creating a document, so
   * no draft contract and no burnt contract number results from looking.
   */
  async previewTemplate(
    id: number,
    payload: { body_html?: string; document_id?: number; lead_id?: number; sale_id?: number },
  ): Promise<{
    html: string;
    page_settings?: PageSettingsPayload;
    header_html?: string | null;
    footer_html?: string | null;
    resolved_against?: { id: number; number: string; title: string } | null;
  }> {
    const response = await api.post(`/api/document-templates/${id}/preview`, payload);
    return response.data;
  },

  /** Lead lookup for the preview picker. The endpoint requires 3+ characters. */
  async searchLeadsForPreview(term: string): Promise<{ id: number; name: string }[]> {
    if (term.trim().length < 3) return [];

    const response = await api.get('/api/leads/search', { params: { q: term.trim() } });
    const rows = response.data?.data ?? response.data ?? [];

    return rows.map((row: any) => ({
      id: row.id,
      name: [row.first_name, row.last_name].filter(Boolean).join(' ') || `#${row.id}`,
    }));
  },

  /* ---------------- settings ---------------- */

  async types(includeInactive = false): Promise<{ data: DocumentType[]; categories: DocumentCategory[] }> {
    const response = await api.get('/api/document-types', {
      params: includeInactive ? { include_inactive: 1 } : undefined,
    });
    return response.data;
  },

  async createType(payload: Partial<DocumentType>): Promise<DocumentType> {
    const response = await api.post('/api/document-types', payload);
    return response.data.data;
  },

  async updateType(id: number, payload: Partial<DocumentType>): Promise<DocumentType> {
    const response = await api.put(`/api/document-types/${id}`, payload);
    return response.data.data;
  },

  async removeType(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/document-types/${id}`);
    return response.data;
  },

  async variables(): Promise<DocumentVariable[]> {
    const response = await api.get('/api/document-variables');
    return response.data.data;
  },

  async createVariable(payload: Partial<DocumentVariable>): Promise<DocumentVariable> {
    const response = await api.post('/api/document-variables', payload);
    return response.data.data;
  },

  async updateVariable(id: number, payload: Partial<DocumentVariable>): Promise<DocumentVariable> {
    const response = await api.put(`/api/document-variables/${id}`, payload);
    return response.data.data;
  },

  async removeVariable(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/document-variables/${id}`);
    return response.data;
  },

  /** What an author may insert — drives the editor's picker. */
  async variableRegistry(): Promise<VariableGroup[]> {
    const response = await api.get('/api/documents/variables/registry');
    return response.data.groups;
  },

  /* ---------------- editor assets ---------------- */

  /**
   * Upload an image and get a reference back.
   *
   * The URL is what goes into the document — never the bytes. The server
   * inlines them as a data URI once, at generation time.
   */
  async uploadAsset(file: File, templateId?: number): Promise<DocumentAsset> {
    const form = new FormData();
    form.append('file', file);
    if (templateId) form.append('template_id', String(templateId));

    const response = await api.post('/api/document-assets', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  },

  /**
   * Download the template itself as a file.
   *
   * Without a lead the variables come back visible as `{{lead.name}}`, which
   * is what somebody reviewing wording wants to see; with one they resolve to
   * real values. Either way nothing is persisted — no document, no number.
   */
  async downloadTemplate(
    id: number,
    format: 'pdf' | 'docx',
    leadId?: number,
  ): Promise<Blob> {
    const response = await api.get(`/api/document-templates/${id}/download`, {
      params: { format, ...(leadId ? { lead_id: leadId } : {}) },
      responseType: 'blob',
    });
    return response.data;
  },

  /* ---------------- template revisions ---------------- */

  async revisions(templateId: number): Promise<TemplateRevision[]> {
    const response = await api.get(`/api/document-templates/${templateId}/revisions`);
    return response.data.data;
  },

  async restoreRevision(templateId: number, revisionId: number): Promise<DocumentTemplate> {
    const response = await api.post(
      `/api/document-templates/${templateId}/revisions/${revisionId}/restore`
    );
    return response.data.data;
  },
};

/** Still moving, so the UI should keep polling. */
export function isDocumentOpen(status: DocumentStatus): boolean {
  return status === 'waiting_signature' || status === 'partially_signed';
}

export function isDocumentTerminal(status: DocumentStatus): boolean {
  return ['signed', 'rejected', 'expired', 'cancelled', 'archived'].includes(status);
}
