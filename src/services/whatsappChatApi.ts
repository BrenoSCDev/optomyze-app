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
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
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
