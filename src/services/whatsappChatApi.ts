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
