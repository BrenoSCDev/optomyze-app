/**
 * GLOBAL INBOX TYPES
 *
 * Type definitions for the channel-agnostic Global Inbox (InboxChat / InboxMessage).
 *
 * NOTE: These types are unrelated to the `InboxConversation` / `InboxMessage` mock
 * types in `data/mockInboxData.ts`, which back the separate internal CRM chat
 * (OptomyzeInbox / Conversation / InternalMessage).
 */

export type InboxChannel = 'whatsapp' | 'instagram' | 'messenger' | 'sms' | 'telegram' | 'internal';

export interface InboxContactEntry {
  contact_name?: string;
  contact_phone?: string;
  vcard?: string;
}

export interface InboxMessageMetadata extends InboxContactEntry {
  // Single contact fields (contact_name, contact_phone, vcard inherited above)
  // Multiple contacts
  contacts?: InboxContactEntry[];
  // Set on 'video' messages that are actually a WhatsApp GIF (a looping,
  // muted mp4 under the hood rather than a distinct message type).
  gif_playback?: boolean;
}

export interface InboxMessageUser {
  id: number;
  name: string;
  profile_pic?: string | null;
}

/** Preview of a quoted/replied-to message, snapshotted at receive time. */
export interface InboxReplySnapshot {
  type: 'text' | 'image' | 'video' | 'audio' | 'sticker' | 'document' | 'location' | 'contact' | 'story_reply' | null;
  text?: string | null;
  participant?: string | null;
}

/** Emoji reaction applied to a message, keyed by who reacted. */
export interface InboxReaction {
  emoji: string;
  timestamp?: string | number | null;
}

export interface InboxMessage {
  id: number;
  inbox_chat_id: number;
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'sticker' | 'shared_post' | 'story_reply';
  text: string | null;
  metadata?: InboxMessageMetadata | null;
  media_url?: string | null;
  media_mime?: string | null;
  media_size?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  reply_to_message_id?: number | null;
  reply_to_snapshot?: InboxReplySnapshot | null;
  reactions?: Record<string, InboxReaction> | null;
  is_edited?: boolean;
  transcription?: string | null;
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
  username?: string | null;
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

export interface ChatSession {
  id: number;
  status: 'active' | 'closed';
  started_at: string;
  first_message_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  assigned_agent: { id: number; name: string } | null;
}

export type ClosingReasonOutcome = 'won' | 'lost' | 'neutral';

export interface ClosingReason {
  id: number;
  name: string;
  description?: string | null;
  // Present only in the management list (GET /api/closing-reasons?all=1)
  is_active?: boolean;
  sort_order?: number;
  outcome?: ClosingReasonOutcome;
  closing_messages?: { id: number; name: string }[];
}

export interface ClosingMessage {
  id: number;
  company_id: number;
  name: string;
  message: string;
  closing_reasons: { id: number; name: string }[];
}

export interface ConversationSettings {
  id: number;
  company_id: number;
  welcome_messages_enabled: boolean;
  closing_messages_enabled: boolean;
}

export interface WelcomeMessageAccount {
  channel: InboxChannel;
  channelable_type: string;
  channelable_id: number;
  label: string;
  is_enabled: boolean;
  message: string | null;
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
