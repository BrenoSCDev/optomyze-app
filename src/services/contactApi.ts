/**
 * CONTACTS API
 *
 * Every lead in the company, viewed as a contact. Pipeline membership is
 * optional, so this is the canonical list — the funnel board is one view onto
 * a subset of it.
 */

import api from './api';

export interface ContactTag { id: number; name: string; color: string | null; }

export interface Contact {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  username: string | null;
  /** Illustrated face shown when the contact has no photo of their own. */
  avatar_key?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  /** false = archived. Archived contacts are hidden unless filtered for. */
  is_active: boolean;
  source_platform: string | null;
  created_at: string;
  updated_at: string;
  /** Null when the contact sits outside any pipeline. */
  funnel_id: number | null;
  stage_id: number | null;
  funnel?: { id: number; name: string; type: string } | null;
  stage?: { id: number; name: string } | null;
  assigned_user?: { id: number; name: string; email: string; profile_pic: string | null } | null;
  tags?: ContactTag[];
  /**
   * Leads have no avatar column; their picture comes from the linked WhatsApp
   * conversation, which is why this is a relation rather than a field.
   */
  whatsapp_inbox_chat?: { id: number; profile_pic_url: string | null } | null;
}

/** Private storage path for a contact's avatar, or null if they have none. */
export const contactAvatarPath = (c: Contact): string | null =>
  c.whatsapp_inbox_chat?.profile_pic_url ?? null;

export interface ContactsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  /** Page sizes the API accepts; anything else is clamped server-side. */
  page_sizes: number[];
}

export interface ContactsResponse {
  data: Contact[];
  meta: ContactsMeta;
}

export interface ContactFilters {
  page?: number;
  per_page?: number;
  search?: string;
  funnel_id?: number | string;
  stage_id?: number | string;
  assigned_to?: number | 'unassigned';
  priority?: string;
  source_platform?: string;
  without_funnel?: boolean;
  /** 'active' (default) | 'archived' | 'all' */
  archived?: 'active' | 'archived' | 'all';
  sort?: 'created_at' | 'updated_at' | 'first_name' | 'last_name';
  direction?: 'asc' | 'desc';
}

export const fetchContacts = async (filters: ContactFilters = {}): Promise<ContactsResponse> => {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
  }
  const res = await api.get('/api/contacts', { params });
  return res.data;
};

/* ---------------- archiving & bulk actions ---------------- */

export const setContactArchived = async (leadId: number, archived: boolean): Promise<void> => {
  await api.patch(`/api/leads/${leadId}/${archived ? 'archive' : 'unarchive'}`);
};

export const bulkArchiveContacts = async (leadIds: number[], archived: boolean): Promise<number> => {
  const res = await api.post('/api/leads/bulk/archive', { lead_ids: leadIds, archived });
  return res.data?.updated ?? 0;
};

export const bulkAssignContacts = async (leadIds: number[], userId: number | null): Promise<number> => {
  const res = await api.post('/api/leads/bulk/assign', { lead_ids: leadIds, user_id: userId });
  return res.data?.updated ?? 0;
};

/**
 * Files a selection of contacts into a funnel, at its entry stage.
 * Contacts already in that funnel are skipped, so the count returned can be
 * lower than the number selected.
 */
export const bulkMoveContactsToFunnel = async (leadIds: number[], funnelId: number): Promise<number> => {
  const res = await api.post('/api/leads/bulk/move-funnel', { lead_ids: leadIds, funnel_id: funnelId });
  return res.data?.updated ?? 0;
};

export const bulkTagContacts = async (
  leadIds: number[], tagIds: number[], mode: 'attach' | 'replace' = 'attach'
): Promise<number> => {
  const res = await api.post('/api/leads/bulk/tag', { lead_ids: leadIds, tag_ids: tagIds, mode });
  return res.data?.updated ?? 0;
};

export const contactDisplayName = (c: Contact): string => {
  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
  return name || c.email || c.phone || c.username || `#${c.id}`;
};
