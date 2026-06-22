import { useState, useCallback, useEffect } from 'react';
import { ConversationSettings } from '@/types/inbox';
import {
  activateConversationSettings,
  patchConversationSettings,
  PatchConversationSettingsPayload,
} from '@/services/conversationSettingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseConversationSettingsProps {
  initialData?: ConversationSettings | null;
}

export const useConversationSettings = ({ initialData }: UseConversationSettingsProps = {}) => {
  const [settings, setSettings] = useState<ConversationSettings | null>(initialData ?? null);
  const [activating, setActivating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (initialData) {
      setSettings(initialData);
    }
  }, [initialData]);

  const isActivated = settings !== null;

  const activate = useCallback(async () => {
    try {
      setActivating(true);
      const data = await activateConversationSettings();
      setSettings(data);
      toast({
        title: t('common.success'),
        description: t('settings.conversations.activated'),
      });
    } catch (error) {
      console.error('Failed to activate conversation settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.conversations.activate-error'),
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  }, [toast, t]);

  const patchSettings = useCallback(async (patch: PatchConversationSettingsPayload) => {
    if (!settings) return;

    // Optimistic update
    setSettings(prev => prev ? { ...prev, ...patch } : null);

    try {
      const updated = await patchConversationSettings(patch);
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update conversation settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.conversations.save-error'),
        variant: 'destructive',
      });
    }
  }, [settings, toast, t]);

  const setFromApi = useCallback((data: ConversationSettings | null) => {
    setSettings(data ?? null);
  }, []);

  return {
    settings,
    isActivated,
    activating,
    activate,
    patchSettings,
    setFromApi,
  };
};
