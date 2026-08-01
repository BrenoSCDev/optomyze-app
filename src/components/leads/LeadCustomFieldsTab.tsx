import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  LeadCustomField,
  getLeadFields,
  saveLeadField,
  deleteLeadField,
} from '@/services/leadCustomFieldsApi';

interface Props {
  leadId: number;
}

type FieldType = 'title' | 'text' | 'number' | 'boolean' | 'json' | 'date';

interface FormData {
  field_key: string;
  field_type: FieldType;
  field_value: string;
}

const emptyForm: FormData = { field_key: '', field_type: 'text', field_value: '' };

const LeadCustomFieldsTab = ({ leadId }: Props) => {
  const { t } = useLanguage();
  const [fields, setFields] = useState<LeadCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<LeadCustomField | null>(null);
  const [deletingField, setDeletingField] = useState<LeadCustomField | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLeadFields(leadId);
        setFields(data || []);
      } catch {
        toast.error(t('settings.leads.load-fields-error') || 'Failed to load fields');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [leadId]);

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

  const handleSave = async () => {
    if (!formData.field_key) return;
    try {
      setSaving(true);
      const saved = await saveLeadField(leadId, {
        ...formData,
        type: 'lead',
        lead_id: leadId,
      });
      setFields(prev => {
        const exists = prev.find(f => f.field_key === saved.field_key);
        return exists ? prev.map(f => f.field_key === saved.field_key ? saved : f) : [...prev, saved];
      });
      setIsDialogOpen(false);
      toast.success(editingField
        ? (t('settings.leads.field-updated') || 'Field updated')
        : (t('settings.leads.field-created') || 'Field added'));
    } catch {
      toast.error(t('settings.leads.field-create-error') || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingField) return;
    try {
      setSaving(true);
      await deleteLeadField(leadId, deletingField.field_key);
      setFields(prev => prev.filter(f => f.id !== deletingField.id));
      setDeleteDialogOpen(false);
      setDeletingField(null);
      toast.success(t('settings.leads.field-deleted') || 'Field removed');
    } catch {
      toast.error(t('settings.leads.field-delete-error') || 'Failed to delete field');
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type: FieldType) => {
    const labels: Record<FieldType, string> = {
      title: 'Title', text: 'Text', number: 'Number',
      boolean: 'Boolean', json: 'JSON', date: 'Date',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('settings.leads.lead-fields-desc') || 'Custom fields for this lead.'}
        </p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          {t('settings.leads.add-field') || 'Add Field'}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.leads.no-lead-fields') || 'No custom fields for this lead.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.id} className="p-4 border rounded-lg bg-background/50 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-foreground text-sm">{field.field_key}</div>
                  <div className="text-xs text-muted-foreground">{getTypeLabel(field.field_type)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(field)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDeletingField(field); setDeleteDialogOpen(true); }}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-foreground bg-muted/30 rounded px-2 py-1 break-all">
                {field.field_value || <span className="text-muted-foreground italic">empty</span>}
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
                ? (t('settings.leads.edit-field') || 'Edit Field')
                : (t('settings.leads.add-field') || 'Add Field')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.products.field-key')}</Label>
              <Input
                value={formData.field_key}
                onChange={(e) => setFormData({ ...formData, field_key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="e.g. budget_range"
                disabled={!!editingField}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.products.field-type')}</Label>
              <Select
                value={formData.field_type}
                onValueChange={(v: FieldType) => setFormData({ ...formData, field_type: v })}
                disabled={!!editingField}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('settings.products.field-value')}</Label>
              <Input
                value={formData.field_value}
                onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
                placeholder="Value..."
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

export default LeadCustomFieldsTab;
