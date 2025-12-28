import { useState, useEffect, useCallback } from 'react';
import { 
  SettingsPanel, 
  ProductSettings, 
  SalesSettings,
  defaultSettings 
} from '@/services/settingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const useSettingsPanel = () => {
  const [settings, setSettings] = useState<SettingsPanel>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<SettingsPanel>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Using mock data for now - replace with API call when backend is ready
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      // Use default settings as mock data
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
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

  // Mock save - replace with API call when backend is ready
  const saveProductSettings = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setOriginalSettings(settings);
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

  // Mock save - replace with API call when backend is ready
  const saveSalesSettings = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setOriginalSettings(settings);
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
