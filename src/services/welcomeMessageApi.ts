/**
 * WELCOME MESSAGE API SERVICE
 *
 * Per-connected-account welcome message configuration.
 */

import api from './api';
import { WelcomeMessageAccount } from '@/types/inbox';

/**
 * List every connected account (WhatsApp/Instagram/Facebook) for the
 * company, merged with its welcome message config if one has been saved.
 */
export const fetchWelcomeMessageAccounts = async (): Promise<WelcomeMessageAccount[]> => {
  const response = await api.get('/api/welcome-message-configs');
  return response.data.data;
};

export interface UpsertWelcomeMessagePayload {
  channelable_type: string;
  channelable_id: number;
  channel: string;
  is_enabled: boolean;
  message?: string | null;
}

export const upsertWelcomeMessageConfig = async (
  payload: UpsertWelcomeMessagePayload
): Promise<WelcomeMessageAccount> => {
  const response = await api.put('/api/welcome-message-configs', payload);
  return response.data.data;
};
