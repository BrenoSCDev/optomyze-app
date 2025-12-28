import { useState, useEffect, useCallback } from 'react';
import {
  NotificationSettings,
  NotificationEvent,
  NotificationTemplate,
  NotificationChannels,
  DefaultRecipients,
  FrequencySettings,
  QuietHoursSettings,
  defaultNotificationSettings,
} from '@/services/notificationSettingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Simulate loading from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setSettings(defaultNotificationSettings);
      setOriginalSettings(defaultNotificationSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.notifications.load-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateChannels = useCallback((updates: Partial<NotificationChannels>) => {
    setSettings(prev => ({
      ...prev,
      channels: { ...prev.channels, ...updates },
    }));
  }, []);

  const updateDefaultRecipients = useCallback((updates: Partial<DefaultRecipients>) => {
    setSettings(prev => ({
      ...prev,
      defaultRecipients: { ...prev.defaultRecipients, ...updates },
    }));
  }, []);

  const updateEvent = useCallback((eventId: string, updates: Partial<NotificationEvent>) => {
    setSettings(prev => ({
      ...prev,
      events: prev.events.map(e => e.id === eventId ? { ...e, ...updates } : e),
    }));
  }, []);

  const updateFrequency = useCallback((updates: Partial<FrequencySettings>) => {
    setSettings(prev => ({
      ...prev,
      frequency: { ...prev.frequency, ...updates },
    }));
  }, []);

  const updateQuietHours = useCallback((updates: Partial<QuietHoursSettings>) => {
    setSettings(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, ...updates },
    }));
  }, []);

  const updateTemplate = useCallback((templateId: string, updates: Partial<NotificationTemplate>) => {
    setSettings(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === templateId ? { ...t, ...updates } : t),
    }));
  }, []);

  const addTemplate = useCallback((template: Omit<NotificationTemplate, 'id'>) => {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
    };
    setSettings(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate],
    }));
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setSettings(prev => ({
      ...prev,
      templates: prev.templates.filter(t => t.id !== templateId),
    }));
  }, []);

  const hasChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  const saveSettings = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setOriginalSettings(settings);
      toast({
        title: t('common.success'),
        description: t('settings.notifications.save-success'),
      });
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.notifications.save-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [settings, toast, t]);

  const resetChanges = useCallback(() => {
    setSettings(originalSettings);
  }, [originalSettings]);

  return {
    settings,
    loading,
    saving,
    hasChanges,
    updateChannels,
    updateDefaultRecipients,
    updateEvent,
    updateFrequency,
    updateQuietHours,
    updateTemplate,
    addTemplate,
    deleteTemplate,
    saveSettings,
    resetChanges,
    reload: loadSettings,
  };
};
