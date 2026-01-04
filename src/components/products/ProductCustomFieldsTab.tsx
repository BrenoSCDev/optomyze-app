/**
 * PRODUCT CUSTOM FIELDS TAB COMPONENT
 * 
 * Manages custom fields for a specific product within the edit product modal
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { ProductCustomField } from '@/services/productApi';
import { createCustomProductField, updateCustomProductField, deleteCustomProductField, CustomProductFieldFormData } from '@/services/customProductFieldsApi';

interface ProductCustomFieldsTabProps {
  productId: number;
  fields: ProductCustomField[];
  onFieldsChange: (fields: ProductCustomField[]) => void;
}

interface FormData {
  field_key: string;
  field_type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  field_value: string;
}

const initialFormData: FormData = {
  field_key: '',
  field_type: 'text',
  field_value: '',
};

const ProductCustomFieldsTab = ({ productId, fields, onFieldsChange }: ProductCustomFieldsTabProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<ProductCustomField | null>(null);
  const [deletingField, setDeletingField] = useState<ProductCustomField | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const handleOpenCreate = () => {
    setEditingField(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (field: ProductCustomField) => {
    setEditingField(field);
    setFormData({
      field_key: field.field_key,
      field_type: field.field_type,
      field_value: field.field_value,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (field: ProductCustomField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    setSaving(true);
    try {
      await deleteCustomProductField(deletingField.id);
      const updatedFields = fields.filter(f => f.id !== deletingField.id);
      onFieldsChange(updatedFields);
      toast({
        title: t('common.success'),
        description: t('settings.products.field-deleted'),
      });
      setDeleteDialogOpen(false);
      setDeletingField(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.products.field-delete-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.field_key.trim()) {
      toast({
        title: t('common.error'),
        description: t('products.custom-fields.key-required'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    const payload: CustomProductFieldFormData = {
      field_key: formData.field_key.trim(),
      field_type: formData.field_type,
      field_value: formData.field_value,
      type: 'product',
      product_id: productId,
    };

    try {
      if (editingField) {
        const updatedField = await updateCustomProductField(editingField.id, payload);
        const updatedFields = fields.map(f => 
          f.id === editingField.id ? { ...updatedField, product_id: productId, type: 'product' as const } : f
        );
        onFieldsChange(updatedFields);
        toast({
          title: t('common.success'),
          description: t('settings.products.field-updated'),
        });
      } else {
        const newField = await createCustomProductField(payload);
        onFieldsChange([...fields, { ...newField, product_id: productId, type: 'product' as const }]);
        toast({
          title: t('common.success'),
          description: t('settings.products.field-created'),
        });
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingField(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: editingField 
          ? t('settings.products.field-update-error')
          : t('settings.products.field-create-error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getFieldTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      text: t('settings.products.field-type-text'),
      number: t('settings.products.field-type-number'),
      select: t('settings.products.field-type-select'),
      boolean: t('settings.products.field-type-boolean'),
      date: t('settings.products.field-type-date'),
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground">{t('products.custom-fields.title')}</h4>
          <p className="text-xs text-muted-foreground mt-1">{t('products.custom-fields.description')}</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          {t('settings.products.add-field')}
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <p>{t('products.custom-fields.no-fields')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border"
            >
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('settings.products.field-key')}</p>
                  <p className="text-sm font-medium text-foreground">{field.field_key}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('settings.products.field-type')}</p>
                  <p className="text-sm text-foreground">{getFieldTypeLabel(field.field_type)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('settings.products.field-value')}</p>
                  <p className="text-sm text-foreground">{field.field_value || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(field)}
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDelete(field)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.products.edit-field') : t('settings.products.add-field')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="field-key">{t('settings.products.field-key')}</Label>
              <Input
                id="field-key"
                value={formData.field_key}
                onChange={(e) => setFormData(prev => ({ ...prev, field_key: e.target.value }))}
                placeholder={t('settings.products.field-key-placeholder')}
                className="mt-2"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="field-type">{t('settings.products.field-type')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value: FormData['field_type']) => 
                  setFormData(prev => ({ ...prev, field_type: value }))
                }
                disabled={saving || !!editingField}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">{t('settings.products.field-type-text')}</SelectItem>
                  <SelectItem value="number">{t('settings.products.field-type-number')}</SelectItem>
                  <SelectItem value="select">{t('settings.products.field-type-select')}</SelectItem>
                  <SelectItem value="boolean">{t('settings.products.field-type-boolean')}</SelectItem>
                  <SelectItem value="date">{t('settings.products.field-type-date')}</SelectItem>
                </SelectContent>
              </Select>
              {editingField && (
                <p className="text-xs text-muted-foreground mt-1">{t('products.custom-fields.type-readonly')}</p>
              )}
            </div>
            <div>
              <Label htmlFor="field-value">{t('settings.products.field-value')}</Label>
              <Input
                id="field-value"
                value={formData.field_value}
                onChange={(e) => setFormData(prev => ({ ...prev, field_value: e.target.value }))}
                placeholder={t('settings.products.field-value-placeholder')}
                className="mt-2"
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('common.saving')}
                  </div>
                ) : (
                  editingField ? t('common.update') : t('common.create')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.products.delete-field-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.products.delete-field-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.deleting')}
                </div>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductCustomFieldsTab;
