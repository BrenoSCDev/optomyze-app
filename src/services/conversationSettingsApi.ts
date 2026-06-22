/**
 * CONVERSATION SETTINGS API SERVICE
 *
 * Activation-gated settings for the Conversation Lifecycle feature
 * (welcome messages / automatic closing messages), mirroring the
 * notificationSettingsApi.ts activation pattern.
 */

import api from './api';
import { ConversationSettings } from '@/types/inbox';

/**
 * Activate conversation settings (POST /api/conversation-settings).
 * Uses firstOrCreate server-side, so calling this repeatedly is safe.
 */
export const activateConversationSettings = async (): Promise<ConversationSettings> => {
  const response = await api.post('/api/conversation-settings');
  return response.data;
};

export interface PatchConversationSettingsPayload {
  welcome_messages_enabled?: boolean;
  closing_messages_enabled?: boolean;
}

export const patchConversationSettings = async (
  patch: PatchConversationSettingsPayload
): Promise<ConversationSettings> => {
  const response = await api.patch('/api/conversation-settings', patch);
  return response.data;
};
