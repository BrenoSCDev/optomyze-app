import { useState, useEffect, useCallback } from 'react';
import { FunnelSettings, Funnel, FunnelStage, defaultFunnelSettings } from '@/services/funnelSettingsApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';

export const useFunnelSettings = () => {
  const [settings, setSettings] = useState<FunnelSettings>(defaultFunnelSettings);
  const [originalSettings, setOriginalSettings] = useState<FunnelSettings>(defaultFunnelSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all funnels from API
      const response = await api.get('/api/funnels');
      const funnelsFromApi = response.data || [];
      
      // Map API response to our Funnel type
      const mappedFunnels: Funnel[] = funnelsFromApi.map((f: any) => ({
        id: String(f.id),
        name: f.name,
        type: f.type || 'regular',
        isDefault: f.is_default || false,
        appliesTo: f.applies_to || 'both',
        stages: (f.stages || []).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          type: s.type || 'lead',
          order: s.order,
          probability: s.probability || 50,
          color: s.color || '#3b82f6',
          isFinalStage: s.is_final_stage || false,
          finalType: s.final_type,
          allowBackward: s.allow_backward !== false,
          entryRules: s.entry_requirement || {
            requireAssignedOwner: false,
            requireCompanyLinked: false,
            requireContactEmail: false,
            requirePhoneNumber: false,
            requireAtLeastOneProduct: false,
            requireDealValue: false,
            requireExpectedCloseDate: false,
            requireLastActivityDays: null,
          },
          actions: s.actions || [],
        })),
      }));

      const loadedSettings = {
        ...defaultFunnelSettings,
        funnels: mappedFunnels.length > 0 ? mappedFunnels : defaultFunnelSettings.funnels,
      };

      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      
      // Set default selected funnel (regular funnels only)
      const regularFunnels = loadedSettings.funnels.filter(f => f.type !== 'model');
      if (regularFunnels.length > 0) {
        setSelectedFunnelId(regularFunnels[0].id);
      }
      
      // Set default selected template
      const templateFunnels = loadedSettings.funnels.filter(f => f.type === 'model');
      if (templateFunnels.length > 0) {
        setSelectedTemplateId(templateFunnels[0].id);
      }
    } catch (error) {
      console.error('Failed to load funnel settings:', error);
      // Use defaults on error
      setSettings(defaultFunnelSettings);
      setOriginalSettings(defaultFunnelSettings);
      
      const regularFunnels = defaultFunnelSettings.funnels.filter(f => f.type !== 'model');
      if (regularFunnels.length > 0) {
        setSelectedFunnelId(regularFunnels[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Add new funnel (regular) via API
  const addFunnel = useCallback(async (funnel: Funnel) => {
    try {
      const response = await api.post('/api/funnels', {
        name: funnel.name,
        description: funnel.name,
        type: 'regular',
        applies_to: funnel.appliesTo,
        is_default: funnel.isDefault,
      });
      
      const createdFunnel: Funnel = {
        id: String(response.data.id),
        name: response.data.name,
        type: 'regular',
        isDefault: response.data.is_default || false,
        appliesTo: response.data.applies_to || 'both',
        stages: [],
      };
      
      setSettings(prev => ({
        ...prev,
        funnels: [...prev.funnels, createdFunnel],
      }));
      setSelectedFunnelId(createdFunnel.id);
      
      toast({
        title: t('common.success'),
        description: t('settings.funnels.create-success'),
      });
    } catch (error) {
      console.error('Failed to create funnel:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.create-error'),
        variant: 'destructive',
      });
    }
  }, [toast, t]);

  // Add new template funnel via API
  const addTemplate = useCallback(async (funnel: Funnel) => {
    try {
      const response = await api.post('/api/funnels', {
        name: funnel.name,
        description: funnel.name,
        type: 'model', // Always send type as 'model' for templates
        applies_to: funnel.appliesTo,
        is_default: false,
      });
      
      const createdTemplate: Funnel = {
        id: String(response.data.id),
        name: response.data.name,
        type: 'model',
        isDefault: false,
        appliesTo: response.data.applies_to || 'both',
        stages: [],
      };
      
      setSettings(prev => ({
        ...prev,
        funnels: [...prev.funnels, createdTemplate],
      }));
      setSelectedTemplateId(createdTemplate.id);
      
      toast({
        title: t('common.success'),
        description: t('settings.funnels.template-create-success'),
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.template-create-error'),
        variant: 'destructive',
      });
    }
  }, [toast, t]);

  // Delete funnel via API
  const deleteFunnel = useCallback(async (funnelId: string) => {
    try {
      await api.delete(`/api/funnels/${funnelId}`);
      
      setSettings(prev => {
        const newFunnels = prev.funnels.filter(f => f.id !== funnelId);
        const regularFunnels = newFunnels.filter(f => f.type !== 'model');
        if (selectedFunnelId === funnelId && regularFunnels.length > 0) {
          setSelectedFunnelId(regularFunnels[0].id);
        }
        return { ...prev, funnels: newFunnels };
      });
      
      toast({
        title: t('common.success'),
        description: t('settings.funnels.delete-success'),
      });
    } catch (error) {
      console.error('Failed to delete funnel:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.delete-error'),
        variant: 'destructive',
      });
    }
  }, [selectedFunnelId, toast, t]);

  // Delete template via API
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      await api.delete(`/api/funnels/${templateId}`);
      
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
      
      toast({
        title: t('common.success'),
        description: t('settings.funnels.template-delete-success'),
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.template-delete-error'),
        variant: 'destructive',
      });
    }
  }, [selectedTemplateId, toast, t]);

  // Add stage to template via API
  const addTemplateStage = useCallback(async (templateId: string, stage: Omit<FunnelStage, 'id'>) => {
    try {
      const response = await api.post(`/api/funnels/${templateId}/stages`, {
        name: stage.name,
        description: stage.name,
        type: stage.type,
        color: stage.color,
        order: stage.order,
        probability: stage.probability,
        is_final_stage: stage.isFinalStage,
        final_type: stage.finalType,
        allow_backward: stage.allowBackward,
        entry_requirement: stage.entryRules,
        template_type: 'model', // Always send template_type as 'model' for template stages
      });
      
      const createdStage: FunnelStage = {
        id: String(response.data.id),
        name: response.data.name,
        type: response.data.type || 'lead',
        order: response.data.order,
        probability: response.data.probability || 50,
        color: response.data.color || '#3b82f6',
        isFinalStage: response.data.is_final_stage || false,
        finalType: response.data.final_type,
        allowBackward: response.data.allow_backward !== false,
        entryRules: response.data.entry_requirement || stage.entryRules,
        actions: [],
      };
      
      setSettings(prev => ({
        ...prev,
        funnels: prev.funnels.map(f =>
          f.id === templateId
            ? { ...f, stages: [...f.stages, createdStage].sort((a, b) => a.order - b.order) }
            : f
        ),
      }));
      
      toast({
        title: t('common.success'),
        description: t('stages.create_success'),
      });
      
      return createdStage;
    } catch (error) {
      console.error('Failed to create template stage:', error);
      toast({
        title: t('common.error'),
        description: t('stages.create_error'),
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, t]);

  // Update stage in template via API
  const updateTemplateStage = useCallback(async (templateId: string, stageId: string, updates: Partial<FunnelStage>) => {
    try {
      await api.put(`/api/funnels/${templateId}/stages/${stageId}`, {
        name: updates.name,
        description: updates.name,
        type: updates.type,
        color: updates.color,
        order: updates.order,
        probability: updates.probability,
        is_final_stage: updates.isFinalStage,
        final_type: updates.finalType,
        allow_backward: updates.allowBackward,
        entry_requirement: updates.entryRules,
        template_type: 'model', // Always send template_type as 'model' for template stages
      });
      
      setSettings(prev => ({
        ...prev,
        funnels: prev.funnels.map(f =>
          f.id === templateId
            ? {
                ...f,
                stages: f.stages.map(s =>
                  s.id === stageId ? { ...s, ...updates } : s
                ).sort((a, b) => a.order - b.order),
              }
            : f
        ),
      }));
      
      toast({
        title: t('common.success'),
        description: t('stages.update_success'),
      });
    } catch (error) {
      console.error('Failed to update template stage:', error);
      toast({
        title: t('common.error'),
        description: t('stages.update_error'),
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, t]);

  // Delete stage from template via API
  const deleteTemplateStage = useCallback(async (templateId: string, stageId: string) => {
    try {
      await api.delete(`/api/funnels/${templateId}/stages/${stageId}`);
      
      setSettings(prev => ({
        ...prev,
        funnels: prev.funnels.map(f =>
          f.id === templateId
            ? { ...f, stages: f.stages.filter(s => s.id !== stageId) }
            : f
        ),
      }));
      
      toast({
        title: t('common.success'),
        description: t('stages.delete_success'),
      });
    } catch (error) {
      console.error('Failed to delete template stage:', error);
      toast({
        title: t('common.error'),
        description: t('stages.delete_error'),
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, t]);

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

  // Create funnel from template via API
  const createFunnelFromTemplate = useCallback(async (templateId: string, newFunnelName?: string) => {
    const template = settings.funnels.find(f => f.id === templateId && f.type === 'model');
    if (!template) return;

    try {
      // Create the new funnel
      const funnelResponse = await api.post('/api/funnels', {
        name: newFunnelName || `${template.name} (Copy)`,
        description: newFunnelName || `${template.name} (Copy)`,
        type: 'regular', // New funnel from template is always regular
        applies_to: template.appliesTo,
        is_default: false,
      });

      const newFunnelId = String(funnelResponse.data.id);
      
      // Create all stages from template
      const createdStages: FunnelStage[] = [];
      for (const stage of template.stages.sort((a, b) => a.order - b.order)) {
        try {
          const stageResponse = await api.post(`/api/funnels/${newFunnelId}/stages`, {
            name: stage.name,
            description: stage.name,
            type: stage.type,
            color: stage.color,
            order: stage.order,
            probability: stage.probability,
            is_final_stage: stage.isFinalStage,
            final_type: stage.finalType,
            allow_backward: stage.allowBackward,
            entry_requirement: stage.entryRules,
          });
          
          createdStages.push({
            id: String(stageResponse.data.id),
            name: stageResponse.data.name,
            type: stageResponse.data.type || 'lead',
            order: stageResponse.data.order,
            probability: stageResponse.data.probability || 50,
            color: stageResponse.data.color || '#3b82f6',
            isFinalStage: stageResponse.data.is_final_stage || false,
            finalType: stageResponse.data.final_type,
            allowBackward: stageResponse.data.allow_backward !== false,
            entryRules: stageResponse.data.entry_requirement || stage.entryRules,
            actions: [],
          });
        } catch (stageError) {
          console.error('Failed to create stage from template:', stageError);
        }
      }

      const newFunnel: Funnel = {
        id: newFunnelId,
        name: funnelResponse.data.name,
        type: 'regular',
        isDefault: false,
        appliesTo: funnelResponse.data.applies_to || 'both',
        stages: createdStages,
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
    } catch (error) {
      console.error('Failed to create funnel from template:', error);
      toast({
        title: t('common.error'),
        description: t('settings.funnels.create-from-template-error'),
        variant: 'destructive',
      });
    }
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
    addTemplateStage,
    updateTemplateStage,
    deleteTemplateStage,
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
