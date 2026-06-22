/**
 * CLOSING MESSAGE API SERVICE
 *
 * Reusable closing-message templates, each linked to one or more closing
 * reasons (many-to-many) — sent automatically when an agent closes a
 * conversation with a linked reason.
 */

import api from './api';
import { ClosingMessage } from '@/types/inbox';

export const fetchClosingMessages = async (): Promise<ClosingMessage[]> => {
  const response = await api.get('/api/closing-messages');
  return response.data.data;
};

export interface ClosingMessagePayload {
  name?: string;
  message?: string;
  closing_reason_ids?: number[];
}

export const createClosingMessage = async (payload: ClosingMessagePayload): Promise<ClosingMessage> => {
  const response = await api.post('/api/closing-messages', payload);
  return response.data.data;
};

export const updateClosingMessage = async (id: number, payload: ClosingMessagePayload): Promise<ClosingMessage> => {
  const response = await api.put(`/api/closing-messages/${id}`, payload);
  return response.data.data;
};

export const deleteClosingMessage = async (id: number): Promise<void> => {
  await api.delete(`/api/closing-messages/${id}`);
};
