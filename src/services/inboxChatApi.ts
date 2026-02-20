import api from './api';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface ChatSender {
  id: number;
  name: string;
}

export interface ChatParticipant {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  type: 'text' | 'image' | 'audio';
  body: string | null;
  file_url: string | null;
  sender: ChatSender;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  type: 'private' | 'group';
  name: string;
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatContact {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface MessagesMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── API CALLS ───────────────────────────────────────────────────────────────

export async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await api.get('/api/chat/conversations');
  return res.data.data;
}

export async function fetchContacts(): Promise<ChatContact[]> {
  const res = await api.get('/api/chat/contacts');
  return res.data.data;
}

export async function openPrivateConversation(userId: number): Promise<ChatConversation> {
  const res = await api.post('/api/chat/private', { user_id: userId });
  return res.data.data;
}

export async function createGroupConversation(name: string, userIds: number[]): Promise<ChatConversation> {
  const res = await api.post('/api/chat/group', { name, users: userIds });
  return res.data.data;
}

export async function fetchMessages(conversationId: number, page: number): Promise<{ data: ChatMessage[]; meta: MessagesMeta }> {
  const res = await api.get(`/api/chat/${conversationId}/messages`, { params: { page } });
  return res.data;
}

export async function sendTextMessage(conversationId: number, body: string): Promise<ChatMessage> {
  const res = await api.post('/api/chat/messages', {
    conversation_id: conversationId,
    type: 'text',
    body,
  });
  return res.data.data;
}

export async function sendFileMessage(conversationId: number, type: 'image' | 'audio', file: File): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append('conversation_id', String(conversationId));
  formData.append('type', type);
  formData.append('file', file);
  const res = await api.post('/api/chat/messages', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}
