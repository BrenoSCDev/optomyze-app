import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CustomProductField,
  CustomProductFieldPayload,
  getSettingsPanel,
  createCustomProductField,
  updateCustomProductField,
  deleteCustomProductField,
  getCustomProductField,
} from '@/services/customProductFieldsApi';

const FIELD_TYPES = ['text', 'title', 'number', 'boolean', 'json', 'date'] as const;

const CustomProductFields = () => {
  const { t } = useLanguage();
  const [fields, setFields] = useState<CustomProductField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomProductField | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<CustomProductFieldPayload>({
    field_key: '',
    field_type: 'text',
    field_value: '',
  });

  // Fetch fields on mount
  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setIsLoading(true);
      const response = await getSettingsPanel();
      setFields(response.customProductFields || []);
    } catch (error) {
      toast({
        title: t('settings.crm-panel.products.customFields.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.field_key.trim()) {
      toast({
        title: t('settings.crm-panel.products.customFields.keyRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newField = await createCustomProductField(formData);
      setFields([...fields, newField]);
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: t('settings.crm-panel.products.customFields.createSuccess'),
      });
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || t('settings.crm-panel.products.customFields.createError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = async (field: CustomProductField) => {
    try {
      const fullField = await getCustomProductField(field.id);
      setSelectedField(fullField);
      setFormData({
        field_key: fullField.field_key,
        field_type: fullField.field_type,
        field_value: fullField.field_value || '',
      });
      setIsEditOpen(true);
    } catch (error) {
      toast({
        title: t('settings.crm-panel.products.customFields.fetchError'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedField || !formData.field_key.trim()) {
      toast({
        title: t('settings.crm-panel.products.customFields.keyRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedField = await updateCustomProductField(selectedField.id, formData);
      setFields(fields.map(f => f.id === selectedField.id ? updatedField : f));
      setIsEditOpen(false);
      setSelectedField(null);
      resetForm();
      toast({
        title: t('settings.crm-panel.products.customFields.updateSuccess'),
      });
    } catch (error: any) {
      toast({
        title: error.response?.data?.message || t('settings.crm-panel.products.customFields.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (field: CustomProductField) => {
    setSelectedField(field);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedField) return;

    try {
      setIsSubmitting(true);
      await deleteCustomProductField(selectedField.id);
      setFields(fields.filter(f => f.id !== selectedField.id));
      setIsDeleteOpen(false);
      setSelectedField(null);
      toast({
        title: t('settings.crm-panel.products.customFields.deleteSuccess'),
      });
    } catch (error) {
      toast({
        title: t('settings.crm-panel.products.customFields.deleteError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      field_key: '',
      field_type: 'text',
      field_value: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const renderFieldValue = (field: CustomProductField) => {
    switch (field.field_type) {
      case 'title':
        return (
          <h4 className="text-lg font-semibold text-foreground">
            {field.field_value || field.field_key}
          </h4>
        );
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch checked={field.field_value === 'true'} disabled />
            <span className="text-sm text-muted-foreground">
              {field.field_value === 'true' ? 'Yes' : 'No'}
            </span>
          </div>
        );
      case 'number':
        return (
          <span className="font-mono text-foreground">{field.field_value || '0'}</span>
        );
      case 'date':
        return (
          <span className="text-foreground">
            {field.field_value ? format(new Date(field.field_value), 'PPP') : '-'}
          </span>
        );
      case 'json':
        return (
          <pre className="text-xs bg-muted/50 p-2 rounded max-w-xs overflow-auto">
            {field.field_value || '{}'}
          </pre>
        );
      case 'text':
      default:
        return <span className="text-foreground">{field.field_value || '-'}</span>;
    }
  };

  const renderFormValueInput = () => {
    switch (formData.field_type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.field_value === 'true'}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, field_value: checked ? 'true' : 'false' })
              }
            />
            <span className="text-sm">
              {formData.field_value === 'true' ? 'Yes' : 'No'}
            </span>
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={formData.field_value || ''}
            onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
            placeholder="0"
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.field_value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.field_value
                  ? format(new Date(formData.field_value), 'PPP')
                  : t('settings.crm-panel.products.customFields.pickDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.field_value ? new Date(formData.field_value) : undefined}
                onSelect={(date) =>
                  setFormData({ ...formData, field_value: date?.toISOString() || '' })
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );
      case 'json':
        return (
          <Textarea
            value={formData.field_value || ''}
            onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
            placeholder='{"key": "value"}'
            className="font-mono text-sm"
            rows={4}
          />
        );
      case 'title':
      case 'text':
      default:
        return (
          <Input
            value={formData.field_value || ''}
            onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
            placeholder={t('settings.crm-panel.products.customFields.valuePlaceholder')}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4 px-2 border-t space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.crm-panel.products.customFields.description')}
        </p>
        <Button size="sm" onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('settings.crm-panel.products.customFields.add')}
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('settings.crm-panel.products.customFields.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
            >
              <div className="flex-1 space-y-2">
                {/* Primary info - Field Key & Type with emphasis */}
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-foreground">
                    {field.field_key}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium uppercase rounded-md bg-primary/10 text-primary">
                    {field.field_type}
                  </span>
                </div>
                {/* Default value display */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{t('settings.crm-panel.products.customFields.fieldValue')}:</span>
                  {renderFieldValue(field)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditClick(field)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(field)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.crm-panel.products.customFields.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldKey')}</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                placeholder="e.g., national_option"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldType')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value: typeof FIELD_TYPES[number]) =>
                  setFormData({ ...formData, field_type: value, field_value: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldValue')}</Label>
              {renderFormValueInput()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              {t('settings.crm-panel.products.customFields.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('settings.crm-panel.products.customFields.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.crm-panel.products.customFields.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldKey')}</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value })}
                placeholder="e.g., national_option"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldType')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value: typeof FIELD_TYPES[number]) =>
                  setFormData({ ...formData, field_type: value, field_value: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.crm-panel.products.customFields.fieldValue')}</Label>
              {renderFormValueInput()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('settings.crm-panel.products.customFields.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('settings.crm-panel.products.customFields.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.crm-panel.products.customFields.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.crm-panel.products.customFields.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('settings.crm-panel.products.customFields.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('settings.crm-panel.products.customFields.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomProductFields;
