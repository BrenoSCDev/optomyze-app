/**
 * WHATSAPP CHAT API SERVICE
 * 
 * API service for WhatsApp Evolution chat operations
 */

import api from './api';
import { WhatsAppChatResponse, WhatsAppMessage, PaginationMeta } from '@/types/whatsappChat';

/**
 * Fetch paginated WhatsApp chats (20 per page)
 */
export const fetchWhatsAppChats = async (page = 1): Promise<WhatsAppChatResponse> => {
  const response = await api.get('/api/integrations/whatsapp-evo-chat', { params: { page } });
  return response.data;
};

export interface ChatMessagesResponse {
  data: WhatsAppMessage[]; // newest first from API
  meta: PaginationMeta;
}

/**
 * Fetch paginated messages for a specific chat (50 per page, newest first)
 */
export const fetchChatMessages = async (chatId: number, page = 1): Promise<ChatMessagesResponse> => {
  const response = await api.get(`/api/integrations/whatsapp-evo-chat/${chatId}/messages`, {
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
  whatsapp_evo_chat_id: number;
  wa_message_id: string;
  direction: 'incoming' | 'outgoing';
  text: string;
  status: string;
  sent_at: string;
  updated_at: string;
  created_at: string;
  user_id?: number | null;
  message_mode?: 'external' | 'internal';
  user?: { id: number; name: string } | null;
}

export interface SendMessageResponse {
  status: string;
  message: SentMessageData;
}

/**
 * Send a WhatsApp message to a lead
 */
export const sendWhatsAppMessage = async (
  instanceId: number,
  payload: SendMessagePayload
): Promise<SendMessageResponse> => {
  const response = await api.post(
    `/api/integrations/whatsapp-evo-chat/message/${instanceId}`,
    payload
  );
  return response.data;
};

/**
 * Clear all messages from a chat
 */
export const clearWhatsAppChatMessages = async (chatId: number): Promise<{ message: string }> => {
  const response = await api.delete(`/api/integrations/whatsapp-evo-chats/${chatId}/clear-messages`);
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
 * Search leads by name or phone for WhatsApp conversation
 */
export const searchLeadsForWhatsApp = async (q: string): Promise<LeadSearchResult[]> => {
  const response = await api.get('/api/integrations/whatsapp-leads/search', { params: { q } });
  return response.data;
};
