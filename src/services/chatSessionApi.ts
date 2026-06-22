/**
 * CHAT SESSION API SERVICE
 *
 * API service for ChatSession lifecycle (active session lookup, manual close)
 * and the company's closing reasons.
 */

import api from './api';
import { ChatSession, ClosingReason } from '@/types/inbox';

/**
 * Fetch the currently active chat session for a chat, or null if none.
 */
export const fetchActiveSession = async (chatId: number): Promise<ChatSession | null> => {
  const response = await api.get(`/api/inbox/chats/${chatId}/active-session`);
  return response.data.data;
};

export interface CloseChatSessionPayload {
  closing_reason_id: number;
  notes?: string;
  closing_message?: string;
}

/**
 * Manually close an active chat session with a required closing reason.
 */
export const closeChatSession = async (
  chatId: number,
  sessionId: number,
  payload: CloseChatSessionPayload
): Promise<ChatSession> => {
  const response = await api.post(
    `/api/inbox/chats/${chatId}/sessions/${sessionId}/close`,
    payload
  );
  return response.data.data;
};

/**
 * Fetch the company's active closing reasons (seeded with defaults on first use).
 * Pass `all: true` for the full management list (incl. disabled reasons + outcome/template).
 */
export const fetchClosingReasons = async (all = false): Promise<ClosingReason[]> => {
  const response = await api.get('/api/closing-reasons', { params: all ? { all: 1 } : undefined });
  return response.data.data;
};

export interface ClosingReasonPayload {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  outcome?: ClosingReason['outcome'];
}

export const createClosingReason = async (payload: ClosingReasonPayload): Promise<ClosingReason> => {
  const response = await api.post('/api/closing-reasons', payload);
  return response.data.data;
};

export const updateClosingReason = async (id: number, payload: ClosingReasonPayload): Promise<ClosingReason> => {
  const response = await api.put(`/api/closing-reasons/${id}`, payload);
  return response.data.data;
};

export const deleteClosingReason = async (id: number): Promise<void> => {
  await api.delete(`/api/closing-reasons/${id}`);
};

export const reorderClosingReasons = async (ids: number[]): Promise<ClosingReason[]> => {
  const response = await api.post('/api/closing-reasons/reorder', { ids });
  return response.data.data;
};

/**
 * Render the selected closing reason's automatic closing message for this
 * chat's lead, or null if automatic closing messages are disabled / the
 * reason has no template configured.
 */
export const fetchClosingMessagePreview = async (chatId: number, closingReasonId: number): Promise<string | null> => {
  const response = await api.get(`/api/inbox/chats/${chatId}/closing-message-preview`, {
    params: { closing_reason_id: closingReasonId },
  });
  return response.data.data;
};
