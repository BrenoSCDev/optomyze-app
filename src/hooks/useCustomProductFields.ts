import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CustomProductField,
  CustomProductFieldFormData,
  getSettingsPanel,
  createCustomProductField,
  updateCustomProductField,
  deleteCustomProductField,
} from '@/services/customProductFieldsApi';

export const useCustomProductFields = () => {
  const [fields, setFields] = useState<CustomProductField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSettingsPanel();
      setFields(response.customProductFields || []);
    } catch (error) {
      console.error('Failed to load custom product fields:', error);
      toast({
        title: t('common.error'),
        description: t('settings.products.load-fields-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const addField = useCallback(async (data: CustomProductFieldFormData) => {
    try {
      setSaving(true);
      const newField = await createCustomProductField(data);
      setFields(prev => [...prev, newField]);
      toast({
        title: t('common.success'),
        description: t('settings.products.field-created'),
      });
      return newField;
    } catch (error) {
      console.error('Failed to create custom product field:', error);
      toast({
        title: t('common.error'),
        description: t('settings.products.field-create-error'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  const editField = useCallback(async (id: number, data: CustomProductFieldFormData) => {
    try {
      setSaving(true);
      const updatedField = await updateCustomProductField(id, data);
      setFields(prev => prev.map(f => f.id === id ? updatedField : f));
      toast({
        title: t('common.success'),
        description: t('settings.products.field-updated'),
      });
      return updatedField;
    } catch (error) {
      console.error('Failed to update custom product field:', error);
      toast({
        title: t('common.error'),
        description: t('settings.products.field-update-error'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  const removeField = useCallback(async (id: number) => {
    try {
      setSaving(true);
      await deleteCustomProductField(id);
      setFields(prev => prev.filter(f => f.id !== id));
      toast({
        title: t('common.success'),
        description: t('settings.products.field-deleted'),
      });
    } catch (error) {
      console.error('Failed to delete custom product field:', error);
      toast({
        title: t('common.error'),
        description: t('settings.products.field-delete-error'),
        variant: 'destructive',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  return {
    fields,
    loading,
    saving,
    addField,
    editField,
    removeField,
    reload: loadFields,
  };
};
