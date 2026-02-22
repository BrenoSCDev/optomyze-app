/**
 * WHATSAPP CHAT API SERVICE
 * 
 * API service for WhatsApp Evolution chat operations
 */

import api from './api';
import { WhatsAppChatResponse } from '@/types/whatsappChat';

/**
 * Fetch all WhatsApp chats
 */
export const fetchWhatsAppChats = async (): Promise<WhatsAppChatResponse> => {
  const response = await api.get('/api/integrations/whatsapp-evo-chat');
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
