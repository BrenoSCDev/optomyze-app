/**
 * DIGITAL SIGNATURE API
 *
 * One client for the whole signature module, regardless of which vendor is
 * behind it. The provider is a string the backend resolves; nothing in this
 * file — or in the components using it — knows what Clicksign is.
 *
 * Adding a vendor means the `providers` list returns one more entry with its
 * own `capabilities`, and the UI renders it. No frontend change.
 */

import api from './api';

export type SignatureStatus =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'completed'
  | 'canceled'
  | 'refused'
  | 'expired'
  | 'failed';

export type SignerStatus =
  | 'pending'
  | 'notified'
  | 'viewed'
  | 'signed'
  | 'refused'
  | 'auth_failed';

export type SignatureEventType =
  | 'document_uploaded'
  | 'signer_added'
  | 'signer_removed'
  | 'signature_started'
  | 'signed'
  | 'refused'
  | 'completed'
  | 'canceled'
  | 'expired'
  | 'auth_failed'
  | 'settings_updated'
  | 'unknown';

/** One identity check a vendor offers, as the vendor's driver declares it. */
export interface SignatureAuthMethod {
  key: string;
  label: string;
  /** Signer fields this method cannot work without. */
  requires?: string[];
  /** Charged per use by the vendor — the UI must say so. */
  billed?: boolean;
  note?: string;
}

/**
 * What a vendor supports. The form renders from this rather than from
 * hard-coded assumptions, which is what keeps it vendor-agnostic.
 */
/** One credential input the vendor needs, so the form can be generic. */
export interface SignatureCredentialField {
  key: string;
  label: string;
  type?: 'text' | 'password';
  required?: boolean;
  help?: string;
}

export interface SignatureProviderCapabilities {
  credential_fields: SignatureCredentialField[];
  environments: string[];
  auth_methods: SignatureAuthMethod[];
  accepted_mime_types: string[];
  max_file_bytes: number | null;
  locales: string[];
  reminder_intervals: (number | null)[];
  registers_webhooks: boolean;
  supports_signing_order: boolean;
  supports_cancel: boolean;
  supports_resend: boolean;
  supports_multiple_documents: boolean;
  supports_deadline: boolean;
  supports_refusal: boolean;
  required_signer_fields: string[];
}

/** A company's account with one vendor. Credentials never come back. */
export interface SignatureProviderAccount {
  id: number;
  provider: string;
  name: string | null;
  environment: 'sandbox' | 'production';
  has_credentials: boolean;
  connection_status: 'not_configured' | 'connected' | 'error';
  webhook_status: 'pending' | 'registered' | 'unsupported' | 'error';
  webhook_url: string;
  last_tested_at: string | null;
  last_error: string | null;
  is_active: boolean;
  is_usable: boolean;
}

export interface SignatureProvider {
  key: string;
  label: string;
  capabilities: SignatureProviderCapabilities;
  account: SignatureProviderAccount | null;
}

export interface SignatureDocument {
  id: number;
  filename: string;
  mime: string | null;
  size_bytes: number;
  position: number;
  download_status: 'pending' | 'stored' | 'unavailable';
  download_error: string | null;
  downloaded_at: string | null;
  has_signed_copy: boolean;
}

export interface SignatureSigner {
  id: number;
  lead_id: number | null;
  user_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  document_number: string | null;
  signing_group: number;
  refusable: boolean;
  auth_methods: string[];
  status: SignerStatus;
  notified_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  refused_at: string | null;
  refusal_reason: string | null;
}

export interface SignatureEvent {
  id: number;
  type: SignatureEventType;
  provider: string;
  provider_event_name: string;
  signature_signer_id: number | null;
  occurred_at: string | null;
  created_at: string;
}

export interface SignatureRequest {
  id: number;
  provider: string;
  provider_label: string;
  title: string;
  subject: string | null;
  message: string | null;
  status: SignatureStatus;
  locale: string;
  auto_close: boolean;
  reminder_interval: number | null;
  block_after_refusal: boolean;
  deadline_at: string | null;
  sent_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  refused_at: string | null;
  last_error: string | null;
  signable_type: string | null;
  signable_id: number | null;
  created_by: string | null;
  created_at: string;
  documents: SignatureDocument[];
  signers: SignatureSigner[];
  events?: SignatureEvent[];
}

export interface SignerPayload {
  name: string;
  email?: string;
  phone?: string;
  document_number?: string;
  birthdate?: string;
  signing_group?: number;
  refusable?: boolean;
  lead_id?: number | null;
  auth_methods?: string[];
  communication?: Record<string, string>;
}

export interface CreateSignatureRequestPayload {
  provider?: string;
  title: string;
  subject?: string;
  message?: string;
  locale?: string;
  auto_close?: boolean;
  reminder_interval?: number | null;
  block_after_refusal?: boolean;
  deadline_at?: string | null;
  signable_type?: 'Lead' | 'Sale';
  signable_id?: number;
  files: File[];
  signers: SignerPayload[];
  send_now?: boolean;
}

export const signatureService = {
  /* ---------------- Providers ---------------- */

  async listProviders(): Promise<{ default_provider: string; providers: SignatureProvider[] }> {
    const response = await api.get('/api/signatures/providers');
    return response.data;
  },

  /**
   * Credentials are an open map because each vendor names its own — one
   * access token here, an integration key plus account id elsewhere.
   */
  async configureProvider(
    provider: string,
    payload: { credentials: Record<string, string>; environment?: string; name?: string },
  ): Promise<{ message: string; account: SignatureProviderAccount }> {
    const response = await api.put(`/api/signatures/providers/${provider}`, payload);
    return response.data;
  },

  async testProvider(provider: string): Promise<{ message: string; account: SignatureProviderAccount }> {
    const response = await api.post(`/api/signatures/providers/${provider}/test`);
    return response.data;
  },

  async disconnectProvider(provider: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/signatures/providers/${provider}`);
    return response.data;
  },

  /* ---------------- Requests ---------------- */

  async list(params?: {
    status?: string;
    signable_type?: string;
    signable_id?: number;
    per_page?: number;
  }): Promise<{ data: SignatureRequest[]; meta: Record<string, number> }> {
    const response = await api.get('/api/signatures/requests', { params });
    return response.data;
  },

  async get(id: number): Promise<SignatureRequest> {
    const response = await api.get(`/api/signatures/requests/${id}`);
    return response.data;
  },

  /** Multipart because the documents ride along with the request. */
  async create(payload: CreateSignatureRequestPayload): Promise<SignatureRequest> {
    const form = new FormData();

    form.append('title', payload.title);
    if (payload.provider) form.append('provider', payload.provider);
    if (payload.subject) form.append('subject', payload.subject);
    if (payload.message) form.append('message', payload.message);
    if (payload.locale) form.append('locale', payload.locale);
    if (payload.deadline_at) form.append('deadline_at', payload.deadline_at);
    if (payload.signable_type) form.append('signable_type', payload.signable_type);
    if (payload.signable_id) form.append('signable_id', String(payload.signable_id));

    form.append('auto_close', payload.auto_close === false ? '0' : '1');
    form.append('block_after_refusal', payload.block_after_refusal ? '1' : '0');
    if (payload.reminder_interval !== undefined && payload.reminder_interval !== null) {
      form.append('reminder_interval', String(payload.reminder_interval));
    }
    if (payload.send_now) form.append('send_now', '1');

    payload.files.forEach((file) => form.append('files[]', file));

    payload.signers.forEach((signer, index) => {
      form.append(`signers[${index}][name]`, signer.name);
      if (signer.email) form.append(`signers[${index}][email]`, signer.email);
      if (signer.phone) form.append(`signers[${index}][phone]`, signer.phone);
      if (signer.document_number) {
        form.append(`signers[${index}][document_number]`, signer.document_number);
      }
      if (signer.birthdate) form.append(`signers[${index}][birthdate]`, signer.birthdate);
      if (signer.lead_id) form.append(`signers[${index}][lead_id]`, String(signer.lead_id));
      form.append(`signers[${index}][signing_group]`, String(signer.signing_group ?? 1));
      form.append(`signers[${index}][refusable]`, signer.refusable === false ? '0' : '1');

      (signer.auth_methods ?? ['email']).forEach((method, methodIndex) => {
        form.append(`signers[${index}][auth_methods][${methodIndex}]`, method);
      });

      Object.entries(signer.communication ?? {}).forEach(([key, value]) => {
        form.append(`signers[${index}][communication][${key}]`, value);
      });
    });

    const response = await api.post('/api/signatures/requests', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data;
  },

  async send(id: number): Promise<SignatureRequest> {
    const response = await api.post(`/api/signatures/requests/${id}/send`);
    return response.data.data;
  },

  async cancel(id: number): Promise<SignatureRequest> {
    const response = await api.post(`/api/signatures/requests/${id}/cancel`);
    return response.data.data;
  },

  /** Omit `signerId` to nudge everyone still outstanding. */
  async resend(id: number, signerId?: number): Promise<{ message: string }> {
    const response = await api.post(`/api/signatures/requests/${id}/resend`, {
      signer_id: signerId,
    });
    return response.data;
  },

  async remove(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/signatures/requests/${id}`);
    return response.data;
  },

  /** Downloads our stored copy — the signed one when it exists. */
  async downloadDocument(requestId: number, documentId: number): Promise<Blob> {
    const response = await api.get(
      `/api/signatures/requests/${requestId}/documents/${documentId}/download`,
      { responseType: 'blob' },
    );
    return response.data;
  },
};

/* ---------------- Presentation helpers ---------------- */

/**
 * Translation keys for the two status vocabularies. Labels live in
 * LanguageContext like every other user-facing string; this file only knows
 * which key belongs to which status.
 */
export const SIGNATURE_STATUS_KEYS: Record<SignatureStatus, string> = {
  draft: 'signatures.status.draft',
  queued: 'signatures.status.queued',
  sent: 'signatures.status.sent',
  completed: 'signatures.status.completed',
  canceled: 'signatures.status.canceled',
  refused: 'signatures.status.refused',
  expired: 'signatures.status.expired',
  failed: 'signatures.status.failed',
};

export const SIGNER_STATUS_KEYS: Record<SignerStatus, string> = {
  pending: 'signatures.signer-status.pending',
  notified: 'signatures.signer-status.notified',
  viewed: 'signatures.signer-status.viewed',
  signed: 'signatures.signer-status.signed',
  refused: 'signatures.signer-status.refused',
  auth_failed: 'signatures.signer-status.auth_failed',
};

export function isSignatureOpen(status: SignatureStatus): boolean {
  return status === 'queued' || status === 'sent' || status === 'refused';
}
