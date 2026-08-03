/**
 * OPTUS API
 *
 * Talks to the server-side assistant. The OpenAI key lives on the backend and
 * is never present in the browser, so every turn goes through these endpoints.
 */

import api from './api';

export interface OptusMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface OptusConversation {
  id: number;
  messages: OptusMessage[];
}

/** Why a turn failed, so the UI can say something useful instead of "error". */
export type OptusFailure = 'not_configured' | 'provider_error' | 'rate_limited' | 'unknown';

export class OptusError extends Error {
  constructor(public readonly reason: OptusFailure) {
    super(reason);
  }
}

export const optusService = {
  /** The signed-in user's thread, created on the server if none exists. */
  async conversation(): Promise<OptusConversation> {
    const res = await api.get('/api/optus/conversation');
    return res.data.data;
  },

  async send(message: string): Promise<OptusMessage> {
    try {
      const res = await api.post('/api/optus/messages', { message });
      return res.data.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const reason = error?.response?.data?.reason;

      if (status === 429) throw new OptusError('rate_limited');
      if (reason === 'not_configured') throw new OptusError('not_configured');
      if (reason === 'provider_error') throw new OptusError('provider_error');

      throw new OptusError('unknown');
    }
  },

  async clear(): Promise<void> {
    await api.delete('/api/optus/conversation');
  },
};
