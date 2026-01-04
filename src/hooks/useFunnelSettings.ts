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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load settings (mock for now)
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setSettings(defaultFunnelSettings);
      setOriginalSettings(defaultFunnelSettings);
      
      // Set default selected funnel (regular funnels only)
      const regularFunnels = defaultFunnelSettings.funnels.filter(f => f.type !== 'model');
      if (regularFunnels.length > 0) {
        setSelectedFunnelId(regularFunnels[0].id);
      }
      
      // Set default selected template
      const templateFunnels = defaultFunnelSettings.funnels.filter(f => f.type === 'model');
      if (templateFunnels.length > 0) {
        setSelectedTemplateId(templateFunnels[0].id);
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

  // Get regular funnels (exclude templates)
  const regularFunnels = settings.funnels.filter(f => f.type !== 'model');
  
  // Get template funnels only
  const templateFunnels = settings.funnels.filter(f => f.type === 'model');

  // Get currently selected funnel (regular)
  const selectedFunnel = regularFunnels.find(f => f.id === selectedFunnelId) || null;
  
  // Get currently selected template
  const selectedTemplate = templateFunnels.find(f => f.id === selectedTemplateId) || null;

  // Check for unsaved changes
  const hasChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [settings, originalSettings]);

  // Update entire settings
  const updateSettings = useCallback((updates: Partial<FunnelSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  // Update a specific funnel (regular or template)
  const updateFunnel = useCallback((funnelId: string, updates: Partial<Funnel>) => {
    setSettings(prev => ({
      ...prev,
      funnels: prev.funnels.map(f =>
        f.id === funnelId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  // Add new funnel (regular)
  const addFunnel = useCallback((funnel: Funnel) => {
    const regularFunnel = { ...funnel, type: 'regular' as const };
    setSettings(prev => ({
      ...prev,
      funnels: [...prev.funnels, regularFunnel],
    }));
    setSelectedFunnelId(funnel.id);
  }, []);

  // Add new template funnel
  const addTemplate = useCallback((funnel: Funnel) => {
    const templateFunnel = { ...funnel, type: 'model' as const };
    setSettings(prev => ({
      ...prev,
      funnels: [...prev.funnels, templateFunnel],
    }));
    setSelectedTemplateId(funnel.id);
  }, []);

  // Delete funnel
  const deleteFunnel = useCallback((funnelId: string) => {
    setSettings(prev => {
      const newFunnels = prev.funnels.filter(f => f.id !== funnelId);
      const regularFunnels = newFunnels.filter(f => f.type !== 'model');
      if (selectedFunnelId === funnelId && regularFunnels.length > 0) {
        setSelectedFunnelId(regularFunnels[0].id);
      }
      return { ...prev, funnels: newFunnels };
    });
  }, [selectedFunnelId]);

  // Delete template
  const deleteTemplate = useCallback((templateId: string) => {
    setSettings(prev => {
      const newFunnels = prev.funnels.filter(f => f.id !== templateId);
      const templateFunnels = newFunnels.filter(f => f.type === 'model');
      if (selectedTemplateId === templateId && templateFunnels.length > 0) {
        setSelectedTemplateId(templateFunnels[0].id);
      } else if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
      return { ...prev, funnels: newFunnels };
    });
  }, [selectedTemplateId]);

  // Set default funnel
  const setDefaultFunnel = useCallback((funnelId: string) => {
    setSettings(prev => ({
      ...prev,
      funnels: prev.funnels.map(f => ({
        ...f,
        isDefault: f.type !== 'model' && f.id === funnelId,
      })),
    }));
  }, []);

  // Create funnel from template
  const createFunnelFromTemplate = useCallback((templateId: string, newFunnelName?: string) => {
    const template = settings.funnels.find(f => f.id === templateId && f.type === 'model');
    if (!template) return;

    const newFunnel: Funnel = {
      id: crypto.randomUUID(),
      name: newFunnelName || `${template.name} (Copy)`,
      type: 'regular',
      isDefault: false,
      appliesTo: template.appliesTo,
      stages: template.stages.map(stage => ({
        ...stage,
        id: crypto.randomUUID(),
        // Preserve all settings: order, color, entryRules, etc.
      })),
    };

    setSettings(prev => ({
      ...prev,
      funnels: [...prev.funnels, newFunnel],
    }));
    setSelectedFunnelId(newFunnel.id);

    toast({
      title: t('common.success'),
      description: `Funnel "${newFunnel.name}" created from template`,
    });
  }, [settings.funnels, toast, t]);

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
    // Regular funnels
    regularFunnels,
    selectedFunnelId,
    selectedFunnel,
    setSelectedFunnelId,
    addFunnel,
    deleteFunnel,
    setDefaultFunnel,
    // Template funnels
    templateFunnels,
    selectedTemplateId,
    selectedTemplate,
    setSelectedTemplateId,
    addTemplate,
    deleteTemplate,
    createFunnelFromTemplate,
    // Shared
    hasChanges,
    updateSettings,
    updateFunnel,
    saveSettings,
    resetChanges,
    reload: loadSettings,
  };
};
