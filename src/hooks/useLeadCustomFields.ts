import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LeadCustomField,
  LeadCustomFieldFormData,
  getLeadCustomFields,
  createLeadCustomField,
  updateLeadCustomField,
  deleteLeadCustomField,
} from '@/services/leadCustomFieldsApi';

export const useLeadCustomFields = () => {
  const [fields, setFields] = useState<LeadCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeadCustomFields();
      setFields(data || []);
    } catch (error) {
      console.error('Failed to load lead custom fields:', error);
      toast({
        title: t('common.error'),
        description: t('settings.leads.load-fields-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const addField = useCallback(async (data: LeadCustomFieldFormData) => {
    try {
      setSaving(true);
      const newField = await createLeadCustomField({ ...data, type: 'model' });
      setFields(prev => [...prev, newField]);
      toast({ title: t('common.success'), description: t('settings.leads.field-created') });
      return newField;
    } catch (error) {
      toast({ title: t('common.error'), description: t('settings.leads.field-create-error'), variant: 'destructive' });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  const editField = useCallback(async (id: number, data: LeadCustomFieldFormData) => {
    try {
      setSaving(true);
      const updated = await updateLeadCustomField(id, data);
      setFields(prev => prev.map(f => f.id === id ? updated : f));
      toast({ title: t('common.success'), description: t('settings.leads.field-updated') });
      return updated;
    } catch (error) {
      toast({ title: t('common.error'), description: t('settings.leads.field-update-error'), variant: 'destructive' });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  const removeField = useCallback(async (id: number) => {
    try {
      setSaving(true);
      await deleteLeadCustomField(id);
      setFields(prev => prev.filter(f => f.id !== id));
      toast({ title: t('common.success'), description: t('settings.leads.field-deleted') });
    } catch (error) {
      toast({ title: t('common.error'), description: t('settings.leads.field-delete-error'), variant: 'destructive' });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, t]);

  return { fields, loading, saving, addField, editField, removeField, reload: loadFields };
};
