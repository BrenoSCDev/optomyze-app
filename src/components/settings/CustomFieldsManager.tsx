import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Loader2, X } from 'lucide-react';
import {
  CustomProductField,
  FieldType,
  CustomProductFieldFormData,
  getCustomProductFields,
  createCustomProductField,
  updateCustomProductField,
  deleteCustomProductField,
} from '@/services/customProductFieldApi';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'json', label: 'JSON' },
];

interface CustomFieldsManagerProps {
  productId?: number;
}

const CustomFieldsManager = ({ productId }: CustomFieldsManagerProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [fields, setFields] = useState<CustomProductField[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomProductField | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomProductField | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CustomProductFieldFormData>>({
    field_key: '',
    field_type: 'text',
    label: '',
    options: null,
    display_order: 0,
    is_visible: true,
  });
  const [optionsInput, setOptionsInput] = useState('');

  const fetchFields = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    try {
      const data = await getCustomProductFields({ product_id: productId });
      setFields(data);
    } catch (error) {
      console.error('Failed to fetch custom fields:', error);
      toast({
        title: t('common.error'),
        description: t('settings.customFields.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [productId, t, toast]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const resetForm = () => {
    setFormData({
      field_key: '',
      field_type: 'text',
      label: '',
      options: null,
      display_order: fields.length,
      is_visible: true,
    });
    setOptionsInput('');
    setEditingField(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomProductField) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_type: field.field_type,
      label: field.label,
      options: field.options,
      display_order: field.display_order,
      is_visible: field.is_visible,
    });
    setOptionsInput(field.options?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!productId) return;

    // Validation
    if (!formData.field_key?.trim()) {
      toast({ title: t('common.error'), description: t('settings.customFields.keyRequired'), variant: 'destructive' });
      return;
    }
    if (!formData.label?.trim()) {
      toast({ title: t('common.error'), description: t('settings.customFields.labelRequired'), variant: 'destructive' });
      return;
    }

    // Parse options for select/multiselect
    let options: string[] | null = null;
    if (formData.field_type === 'select' || formData.field_type === 'multiselect') {
      if (optionsInput.trim()) {
        options = optionsInput.split(',').map(o => o.trim()).filter(Boolean);
      }
    }

    setSubmitting(true);
    try {
      const payload: CustomProductFieldFormData = {
        product_id: productId,
        field_key: formData.field_key!.trim(),
        field_type: formData.field_type!,
        label: formData.label!.trim(),
        options,
        display_order: formData.display_order ?? fields.length,
        is_visible: formData.is_visible ?? true,
      };

      if (editingField) {
        await updateCustomProductField(editingField.id, payload);
        toast({ title: t('common.success'), description: t('settings.customFields.updated') });
      } else {
        await createCustomProductField(payload);
        toast({ title: t('common.success'), description: t('settings.customFields.created') });
      }

      setIsModalOpen(false);
      resetForm();
      fetchFields();
    } catch (error: any) {
      console.error('Failed to save custom field:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('settings.customFields.saveError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!fieldToDelete) return;

    setSubmitting(true);
    try {
      await deleteCustomProductField(fieldToDelete.id);
      toast({ title: t('common.success'), description: t('settings.customFields.deleted') });
      setIsDeleteDialogOpen(false);
      setFieldToDelete(null);
      fetchFields();
    } catch (error: any) {
      console.error('Failed to delete custom field:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('settings.customFields.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (field: CustomProductField) => {
    try {
      await updateCustomProductField(field.id, { is_visible: !field.is_visible });
      fetchFields();
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      toast({
        title: t('common.error'),
        description: t('settings.customFields.toggleError'),
        variant: 'destructive',
      });
    }
  };

  const getFieldTypeLabel = (type: FieldType) => {
    return FIELD_TYPES.find(ft => ft.value === type)?.label || type;
  };

  if (!productId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('settings.customFields.selectProduct')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.customFields.description')}
        </p>
        <Button onClick={openCreateModal} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          {t('settings.customFields.addField')}
        </Button>
      </div>

      {/* Fields List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">{t('settings.customFields.noFields')}</p>
          <Button variant="outline" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            {t('settings.customFields.addFirstField')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              className={`flex items-center gap-3 p-3 rounded-lg border bg-background/50 ${!field.is_visible ? 'opacity-60' : ''}`}
            >
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{field.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getFieldTypeLabel(field.field_type)}
                  </Badge>
                  {!field.is_visible && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <EyeOff className="w-3 h-3" />
                      {t('settings.customFields.hidden')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{field.field_key}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleVisibility(field)}
                  title={field.is_visible ? t('settings.customFields.hide') : t('settings.customFields.show')}
                >
                  {field.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(field)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFieldToDelete(field);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.customFields.editField') : t('settings.customFields.addField')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">{t('settings.customFields.labelField')}</Label>
              <Input
                id="label"
                value={formData.label || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder={t('settings.customFields.labelPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_key">{t('settings.customFields.keyField')}</Label>
              <Input
                id="field_key"
                value={formData.field_key || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, field_key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                placeholder={t('settings.customFields.keyPlaceholder')}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">{t('settings.customFields.keyHint')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_type">{t('settings.customFields.typeField')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value: FieldType) => setFormData(prev => ({ ...prev, field_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.field_type === 'select' || formData.field_type === 'multiselect') && (
              <div className="space-y-2">
                <Label htmlFor="options">{t('settings.customFields.optionsField')}</Label>
                <Input
                  id="options"
                  value={optionsInput}
                  onChange={(e) => setOptionsInput(e.target.value)}
                  placeholder={t('settings.customFields.optionsPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">{t('settings.customFields.optionsHint')}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="display_order">{t('settings.customFields.orderField')}</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order ?? 0}
                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_visible">{t('settings.customFields.visibleField')}</Label>
              <Switch
                id="is_visible"
                checked={formData.is_visible ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_visible: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingField ? t('common.save') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.customFields.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.customFields.deleteDescription')} "{fieldToDelete?.label}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting} className="bg-destructive hover:bg-destructive/90">
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomFieldsManager;
