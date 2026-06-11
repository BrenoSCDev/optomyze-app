/**
 * GLOBAL INBOX TYPES
 *
 * Type definitions for the channel-agnostic Global Inbox (InboxChat / InboxMessage).
 *
 * NOTE: These types are unrelated to the `InboxConversation` / `InboxMessage` mock
 * types in `data/mockInboxData.ts`, which back the separate internal CRM chat
 * (OptomyzeInbox / Conversation / InternalMessage).
 */

export type InboxChannel = 'whatsapp' | 'instagram' | 'messenger' | 'sms' | 'internal';

export interface InboxContactEntry {
  contact_name?: string;
  contact_phone?: string;
  vcard?: string;
}

export interface InboxMessageMetadata extends InboxContactEntry {
  // Single contact fields (contact_name, contact_phone, vcard inherited above)
  // Multiple contacts
  contacts?: InboxContactEntry[];
}

export interface InboxMessageUser {
  id: number;
  name: string;
  profile_pic?: string | null;
}

export interface InboxMessage {
  id: number;
  inbox_chat_id: number;
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact';
  text: string | null;
  metadata?: InboxMessageMetadata | null;
  media_url?: string | null;
  media_mime?: string | null;
  media_size?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  sent_at: string;
  user_id?: number | null;
  message_mode?: 'external' | 'internal';
  user?: InboxMessageUser | null;
}

export interface InboxFunnel {
  id: number;
  name: string;
}

export interface InboxStage {
  id: number;
  name: string;
}

export interface InboxLead {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  funnel_id: number;
  stage_id: number;
  funnel: InboxFunnel;
  stage: InboxStage;
}

export interface InboxInstance {
  id: number;
  instance_name: string;
  company_id: number;
}

export interface InboxChat {
  id: number;
  company_id: number;
  channel: InboxChannel;
  channelable_id?: number | null;
  lead_id: number | null;
  external_chat_id: string;
  external_contact_id: string;
  contact_name?: string | null;
  is_group: number;
  is_archived: number;
  last_message_at: string;
  profile_pic_url?: string | null;
  created_at: string;
  updated_at: string;
  instance?: InboxInstance | null;
  lead: InboxLead | null;
  messages: InboxMessage[];
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface InboxChatResponse {
  data: InboxChat[];
  meta: PaginationMeta;
}
