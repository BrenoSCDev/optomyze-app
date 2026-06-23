/**
 * GLOBAL INBOX API SERVICE
 *
 * API service for the channel-agnostic Global Inbox (InboxChat / InboxMessage)
 */

import api from './api';
import { InboxChannel, InboxChatResponse, InboxMessage, InboxReplySnapshot, PaginationMeta } from '@/types/inbox';

/**
 * Fetch paginated inbox chats (20 per page), optionally filtered by channel
 * and/or searched by lead first/last name, phone, or chat contact name.
 * Search runs on the backend so it works across companies with hundreds of
 * chats, not just the currently loaded page.
 */
export const fetchInboxChats = async (page = 1, channel?: InboxChannel | 'all', search?: string): Promise<InboxChatResponse> => {
  const params: Record<string, string | number> = { page };
  if (channel && channel !== 'all') {
    params.channel = channel;
  }
  if (search && search.trim() !== '') {
    params.search = search.trim();
  }
  const response = await api.get('/api/inbox/chats', { params });
  return response.data;
};

export interface ChatMessagesResponse {
  data: InboxMessage[]; // newest first from API
  meta: PaginationMeta;
}

/**
 * Fetch paginated messages for a specific chat (50 per page, newest first)
 */
export const fetchInboxChatMessages = async (chatId: number, page = 1): Promise<ChatMessagesResponse> => {
  const response = await api.get(`/api/inbox/chats/${chatId}/messages`, {
    params: { page },
  });
  return response.data;
};

export interface SendMessagePayload {
  lead_id: number;
  text: string;
  message_mode?: 'external' | 'internal';
}

export interface SentMessageData {
  id: number;
  inbox_chat_id: number;
  external_message_id: string;
  direction: 'incoming' | 'outgoing';
  type?: string;
  text: string;
  media_url?: string | null;
  media_mime?: string | null;
  media_size?: number | null;
  status: string;
  sent_at: string;
  updated_at: string;
  created_at: string;
  user_id?: number | null;
  message_mode?: 'external' | 'internal';
  user?: { id: number; name: string } | null;
  reply_to_message_id?: number | null;
  reply_to_snapshot?: InboxReplySnapshot | null;
}

export interface SendMessageResponse {
  status: string;
  message: SentMessageData;
}

/**
 * Send a text message to a lead via a WhatsApp instance
 */
export const sendInboxMessage = async (
  instanceId: number,
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {
  const response = await api.post(
    `/api/inbox/instances/${instanceId}/messages`,
    payload
  );
  return response.data;
};

/**
 * Send a media message (image or audio) to a lead via a WhatsApp instance
 */
export const sendInboxMedia = async (
  instanceId: number,
  leadId: number,
  type: 'image' | 'audio',
  file: File,
  messageMode: 'external' | 'internal' = 'external'
): Promise<SendMessageResponse> => {
  const formData = new FormData();
  formData.append('lead_id', String(leadId));
  formData.append('type', type);
  formData.append('file', file);
  formData.append('message_mode', messageMode);
  const response = await api.post(
    `/api/inbox/instances/${instanceId}/media`,
    formData,
    { headers: { 'Content-Type': undefined } }
  );
  return response.data;
};

/**
 * Send a text message to a chat via an Instagram integration, optionally
 * replying to an existing message in the same chat.
 */
export const sendInstagramMessage = async (
  integrationId: number,
  chatId: number,
  text: string,
  messageMode: 'external' | 'internal' = 'external',
  replyToMessageId?: number
): Promise<SendMessageResponse> => {
  const response = await api.post(
    `/api/inbox/instagram/${integrationId}/messages`,
    { chat_id: chatId, text, message_mode: messageMode, reply_to_message_id: replyToMessageId }
  );
  return response.data;
};

/**
 * Send a media message (image or audio) to a chat via an Instagram integration
 */
export const sendInstagramMedia = async (
  integrationId: number,
  chatId: number,
  type: 'image' | 'audio',
  file: File,
  messageMode: 'external' | 'internal' = 'external'
): Promise<SendMessageResponse> => {
  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('type', type);
  formData.append('file', file);
  formData.append('message_mode', messageMode);
  const response = await api.post(
    `/api/inbox/instagram/${integrationId}/media`,
    formData,
    { headers: { 'Content-Type': undefined } }
  );
  return response.data;
};

/**
 * Clear all messages from a chat
 */
export const clearInboxChatMessages = async (chatId: number): Promise<{ message: string }> => {
  const response = await api.delete(`/api/inbox/chats/${chatId}/messages`);
  return response.data;
};

export interface SendReactionResponse {
  status: string;
  message: InboxMessage;
}

/**
 * Send (or, with an empty string, remove) an emoji reaction to a WhatsApp message
 */
export const sendInboxReaction = async (messageId: number, emoji: string): Promise<SendReactionResponse> => {
  const response = await api.post(`/api/inbox/messages/${messageId}/reaction`, { emoji });
  return response.data;
};

export interface TranscribeMessageResponse {
  status: string;
  transcription: string;
  message: InboxMessage;
}

/**
 * Transcribe an audio message to text. The result is cached server-side,
 * so repeat calls for the same message return instantly.
 */
export const transcribeInboxMessage = async (messageId: number): Promise<TranscribeMessageResponse> => {
  const response = await api.post(`/api/inbox/messages/${messageId}/transcribe`);
  return response.data;
};

export interface WhatsAppInstanceOption {
  id: number;
  instance_name: string;
  status: string;
}

/**
 * Fetch all WhatsApp instances for the company
 */
export const fetchWhatsAppInstances = async (): Promise<WhatsAppInstanceOption[]> => {
  const response = await api.get('/api/integrations/whatsapp-evo-instances');
  return response.data;
};

export interface LeadSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  funnel_id: number;
  stage_id: number;
}

/**
 * Search leads by name or phone for starting an inbox conversation
 */
export const searchLeadsForInbox = async (q: string): Promise<LeadSearchResult[]> => {
  const response = await api.get('/api/inbox/leads/search', { params: { q } });
  return response.data;
};
