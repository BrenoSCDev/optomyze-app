/**
 * WHATSAPP CHAT TYPES
 * 
 * Type definitions for WhatsApp Evolution API chat data
 */

export interface WhatsAppMessage {
  id: number;
  whatsapp_evo_chat_id: number;
  direction: 'incoming' | 'outgoing';
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  text: string | null;
  media_url?: string | null;
  media_mime?: string | null;
  media_size?: number | null;
  status: string;
  sent_at: string;
}

export interface WhatsAppFunnel {
  id: number;
  name: string;
}

export interface WhatsAppStage {
  id: number;
  name: string;
}

export interface WhatsAppLead {
  id: number;
  company_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  funnel_id: number;
  stage_id: number;
  funnel: WhatsAppFunnel;
  stage: WhatsAppStage;
}

export interface WhatsAppInstance {
  id: number;
  instance_name: string;
  company_id: number;
}

export interface WhatsAppChat {
  id: number;
  company_id: number;
  whatsapp_instance_id: number;
  lead_id: number;
  remote_jid: string;
  phone_number: string;
  is_group: number;
  is_archived: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  instance: WhatsAppInstance;
  lead: WhatsAppLead;
  messages: WhatsAppMessage[];
}

export interface WhatsAppChatResponse {
  data: WhatsAppChat[];
}
