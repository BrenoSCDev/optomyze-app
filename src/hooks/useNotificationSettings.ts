import { useState, useCallback, useEffect } from 'react';
import {
  NotificationSettings,
  NotificationChannels,
  DefaultRecipients,
  QuietHoursSettings,
  NotificationEventConfig,
  activateNotificationSettings,
  patchNotificationSettings,
  transformApiToFrontend,
  ApiNotificationSettings,
  PatchNotificationPayload,
} from '@/services/notificationSettingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseNotificationSettingsProps {
  initialData?: ApiNotificationSettings | null;
}

export const useNotificationSettings = ({ initialData }: UseNotificationSettingsProps = {}) => {
  // Convert initial data if provided, otherwise null (not activated)
  const [settings, setSettings] = useState<NotificationSettings | null>(
    initialData ? transformApiToFrontend(initialData) : null
  );
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Sync settings when initialData changes (e.g., after useSettingsPanel loads)
  useEffect(() => {
    if (initialData) {
      setSettings(transformApiToFrontend(initialData));
    }
  }, [initialData]);

  // Check if settings are activated
  const isActivated = settings !== null;

  // Activate notification settings (POST /api/notification-settings)
  const activate = useCallback(async () => {
    try {
      setActivating(true);
      const data = await activateNotificationSettings();
      setSettings(data);
      toast({
        title: t('common.success'),
        description: t('settings.notifications.activated'),
      });
    } catch (error) {
      console.error('Failed to activate notification settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.notifications.activate-error'),
        variant: 'destructive',
      });
    } finally {
      setActivating(false);
    }
  }, [toast, t]);

  // Generic patch function that immediately persists to backend
  const patchSettings = useCallback(async (patch: PatchNotificationPayload) => {
    if (!settings) return;

    try {
      const updatedSettings = await patchNotificationSettings(patch);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.notifications.save-error'),
        variant: 'destructive',
      });
    }
  }, [settings, toast, t]);

  // Update channels - PATCH immediately
  const updateChannels = useCallback(async (updates: Partial<NotificationChannels>) => {
    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      channels: { ...prev.channels, ...updates },
    } : null);

    await patchSettings({ channels: updates });
  }, [patchSettings]);

  // Update default recipients - PATCH immediately
  const updateDefaultRecipients = useCallback(async (updates: Partial<DefaultRecipients>) => {
    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      defaultRecipients: { ...prev.defaultRecipients, ...updates },
    } : null);

    await patchSettings({ default_recipients: updates });
  }, [patchSettings]);

  // Update a single event - PATCH immediately
  const updateEvent = useCallback(async (
    eventKey: string,
    updates: Partial<NotificationEventConfig>
  ) => {
    if (!settings) return;

    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: { ...prev.events[eventKey], ...updates },
      },
    } : null);

    await patchSettings({
      events: {
        [eventKey]: updates,
      },
    });
  }, [settings, patchSettings]);

  // Update quiet hours - PATCH immediately
  const updateQuietHours = useCallback(async (updates: Partial<QuietHoursSettings>) => {
    // Optimistic update
    setSettings(prev => prev ? {
      ...prev,
      quietHours: { ...prev.quietHours, ...updates },
    } : null);

    await patchSettings({ quiet_hours: updates });
  }, [patchSettings]);

  // Set settings from external source (e.g., from useSettingsPanel)
  const setFromApi = useCallback((data: ApiNotificationSettings | null) => {
    setSettings(data ? transformApiToFrontend(data) : null);
  }, []);

  return {
    settings,
    isActivated,
    loading,
    activating,
    activate,
    updateChannels,
    updateDefaultRecipients,
    updateEvent,
    updateQuietHours,
    setFromApi,
  };
};
