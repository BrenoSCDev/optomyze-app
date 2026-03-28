import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { LeadCustomField, LeadCustomFieldFormData } from '@/services/leadCustomFieldsApi';

interface Props {
  fields: LeadCustomField[];
  saving: boolean;
  onAdd: (data: LeadCustomFieldFormData) => Promise<LeadCustomField>;
  onEdit: (id: number, data: LeadCustomFieldFormData) => Promise<LeadCustomField>;
  onDelete: (id: number) => Promise<void>;
}

type FieldType = 'title' | 'text' | 'number' | 'boolean' | 'json' | 'date';

interface FormData {
  field_key: string;
  field_type: FieldType;
  field_value: string;
}

const emptyForm: FormData = { field_key: '', field_type: 'text', field_value: '' };

const LeadCustomFieldsSection = ({ fields, saving, onAdd, onEdit, onDelete }: Props) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<LeadCustomField | null>(null);
  const [deletingField, setDeletingField] = useState<LeadCustomField | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const handleAdd = () => {
    setEditingField(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleEdit = (field: LeadCustomField) => {
    setEditingField(field);
    setFormData({ field_key: field.field_key, field_type: field.field_type, field_value: field.field_value });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (field: LeadCustomField) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    try {
      await onDelete(deletingField.id);
      setDeleteDialogOpen(false);
      setDeletingField(null);
    } catch {}
  };

  const handleSave = async () => {
    if (!formData.field_key) return;
    try {
      if (editingField) {
        await onEdit(editingField.id, formData);
      } else {
        await onAdd(formData);
      }
      setIsDialogOpen(false);
    } catch {}
  };

  const getTypeLabel = (type: FieldType) => {
    const labels: Record<FieldType, string> = {
      title: t('settings.products.field-type-title') || 'Title',
      text: t('settings.products.field-type-text'),
      number: t('settings.products.field-type-number'),
      boolean: t('settings.products.field-type-boolean'),
      json: 'JSON',
      date: t('settings.products.field-type-date'),
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.leads.custom-fields-desc') || 'Default fields added to every new lead.'}
        </p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.leads.add-field') || 'Add Field'}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.leads.no-custom-fields') || 'No default lead fields defined.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div key={field.id} className="p-4 border rounded-lg bg-background/50 space-y-3">
              <div className="flex items-start justify-between">
                <div className="font-medium text-foreground">{field.field_key}</div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(field)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(field)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.products.field-type')}:</span>
                  <span className="text-foreground">{getTypeLabel(field.field_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('settings.products.field-value')}:</span>
                  <span className="text-foreground truncate max-w-[120px]">{field.field_value || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField
                ? (t('settings.leads.edit-field') || 'Edit Lead Field')
                : (t('settings.leads.add-field') || 'Add Lead Field')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.products.field-key')}</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder={t('settings.products.field-key-placeholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.products.field-type')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(v: FieldType) => setFormData({ ...formData, field_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">{getTypeLabel('title')}</SelectItem>
                  <SelectItem value="text">{getTypeLabel('text')}</SelectItem>
                  <SelectItem value="number">{getTypeLabel('number')}</SelectItem>
                  <SelectItem value="boolean">{getTypeLabel('boolean')}</SelectItem>
                  <SelectItem value="date">{getTypeLabel('date')}</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.products.field-value')}</Label>
              <Input
                value={formData.field_value}
                onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
                placeholder={t('settings.products.field-value-placeholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.field_key || saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.products.delete-field-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.products.delete-field-description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadCustomFieldsSection;
