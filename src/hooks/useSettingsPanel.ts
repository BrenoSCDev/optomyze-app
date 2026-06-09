import { useState, useEffect, useCallback } from 'react';
import {
  SettingsPanel,
  ProductSettings,
  SalesSettings,
  defaultSettings,
  saveSettings,
} from '@/services/settingsApi';
import { ApiNotificationSettings } from '@/services/notificationSettingsApi';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SettingsPanelResponse extends SettingsPanel {
  notificationSettings?: ApiNotificationSettings | null;
}

export const useSettingsPanel = () => {
  const [settings, setSettings] = useState<SettingsPanel>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsPanel>(defaultSettings);
  const [notificationSettings, setNotificationSettings] = useState<ApiNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/settings-panel');
      const response = data as SettingsPanelResponse;

      setNotificationSettings(response.notificationSettings ?? null);

      setSettings({
        product_settings: response.product_settings || defaultSettings.product_settings,
        sales_settings: response.sales_settings || defaultSettings.sales_settings,
      });
      setOriginalSettings({
        product_settings: response.product_settings || defaultSettings.product_settings,
        sales_settings: response.sales_settings || defaultSettings.sales_settings,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.panel.load-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateProductSettings = useCallback((updates: Partial<ProductSettings>) => {
    setSettings(prev => ({
      ...prev,
      product_settings: { ...prev.product_settings, ...updates },
    }));
  }, []);

  const updateSalesSettings = useCallback((updates: Partial<SalesSettings>) => {
    setSettings(prev => ({
      ...prev,
      sales_settings: { ...prev.sales_settings, ...updates },
    }));
  }, []);

  const hasProductChanges = useCallback(() => {
    return JSON.stringify(settings.product_settings) !== JSON.stringify(originalSettings.product_settings);
  }, [settings.product_settings, originalSettings.product_settings]);

  const hasSalesChanges = useCallback(() => {
    return JSON.stringify(settings.sales_settings) !== JSON.stringify(originalSettings.sales_settings);
  }, [settings.sales_settings, originalSettings.sales_settings]);

  const saveProductSettings = useCallback(async () => {
    try {
      setSaving(true);
      await saveSettings({ product_settings: settings.product_settings, sales_settings: settings.sales_settings });
      setOriginalSettings(prev => ({ ...prev, product_settings: settings.product_settings }));
      toast({
        title: t('common.success'),
        description: t('settings.panel.save-success'),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.panel.save-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [settings, toast, t]);

  const saveSalesSettings = useCallback(async () => {
    try {
      setSaving(true);
      await saveSettings({ product_settings: settings.product_settings, sales_settings: settings.sales_settings });
      setOriginalSettings(prev => ({ ...prev, sales_settings: settings.sales_settings }));
      toast({
        title: t('common.success'),
        description: t('settings.panel.save-success'),
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.panel.save-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [settings, toast, t]);

  const resetProductSettings = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      product_settings: originalSettings.product_settings,
    }));
  }, [originalSettings.product_settings]);

  const resetSalesSettings = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      sales_settings: originalSettings.sales_settings,
    }));
  }, [originalSettings.sales_settings]);

  return {
    settings,
    loading,
    saving,
    notificationSettings,
    updateProductSettings,
    updateSalesSettings,
    hasProductChanges,
    hasSalesChanges,
    saveProductSettings,
    saveSalesSettings,
    resetProductSettings,
    resetSalesSettings,
    reload: loadSettings,
  };
};
