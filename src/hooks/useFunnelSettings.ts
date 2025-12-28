import { useState, useEffect, useCallback } from 'react';
import { FunnelSettings, Funnel, defaultFunnelSettings } from '@/services/funnelSettingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const useFunnelSettings = () => {
  const [settings, setSettings] = useState<FunnelSettings>(defaultFunnelSettings);
  const [originalSettings, setOriginalSettings] = useState<FunnelSettings>(defaultFunnelSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load settings (mock for now)
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setSettings(defaultFunnelSettings);
      setOriginalSettings(defaultFunnelSettings);
      if (defaultFunnelSettings.funnels.length > 0) {
        setSelectedFunnelId(defaultFunnelSettings.funnels[0].id);
      }
    } catch (error) {
      console.error('Failed to load funnel settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.load-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Get currently selected funnel
  const selectedFunnel = settings.funnels.find(f => f.id === selectedFunnelId) || null;

  // Check for unsaved changes
  const hasChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Update entire settings
  const updateSettings = useCallback((updates: Partial<FunnelSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Update a specific funnel
  const updateFunnel = useCallback((funnelId: string, updates: Partial<Funnel>) => {
    setSettings(prev => ({
      ...prev,
      funnels: prev.funnels.map(f =>
        f.id === funnelId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  // Add new funnel
  const addFunnel = useCallback((funnel: Funnel) => {
    setSettings(prev => ({
      ...prev,
      funnels: [...prev.funnels, funnel],
    }));
    setSelectedFunnelId(funnel.id);
  }, []);

  // Delete funnel
  const deleteFunnel = useCallback((funnelId: string) => {
    setSettings(prev => {
      const newFunnels = prev.funnels.filter(f => f.id !== funnelId);
      if (selectedFunnelId === funnelId && newFunnels.length > 0) {
        setSelectedFunnelId(newFunnels[0].id);
      }
      return { ...prev, funnels: newFunnels };
    });
  }, [selectedFunnelId]);

  // Set default funnel
  const setDefaultFunnel = useCallback((funnelId: string) => {
    setSettings(prev => ({
      ...prev,
      funnels: prev.funnels.map(f => ({
        ...f,
        isDefault: f.id === funnelId,
      })),
    }));
  }, []);

  // Save settings (mock for now)
  const saveSettings = useCallback(async () => {
    try {
      setSaving(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setOriginalSettings(settings);
      toast({
        title: t('common.success'),
        description: t('settings.funnels.save-success'),
      });
    } catch (error) {
      console.error('Failed to save funnel settings:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.save-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [settings, toast, t]);

  // Reset changes
  const resetChanges = useCallback(() => {
    setSettings(originalSettings);
  }, [originalSettings]);

  return {
    settings,
    loading,
    saving,
    selectedFunnelId,
    selectedFunnel,
    setSelectedFunnelId,
    hasChanges,
    updateSettings,
    updateFunnel,
    addFunnel,
    deleteFunnel,
    setDefaultFunnel,
    saveSettings,
    resetChanges,
    reload: loadSettings,
  };
};
