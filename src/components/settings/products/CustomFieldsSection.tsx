import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { CustomField, ProductSettings } from '@/services/settingsApi';

interface Props {
  settings: ProductSettings;
  onUpdate: (updates: Partial<ProductSettings>) => void;
}

const emptyField: Omit<CustomField, 'id'> = {
  label: '',
  key: '',
  type: 'text',
  required: false,
  defaultValue: '',
  applyTo: 'all',
};

const CustomFieldsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [formData, setFormData] = useState<Omit<CustomField, 'id'>>(emptyField);

  const handleAdd = () => {
    setEditingField(null);
    setFormData(emptyField);
    setIsDialogOpen(true);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      key: field.key,
      type: field.type,
      required: field.required,
      defaultValue: field.defaultValue,
      applyTo: field.applyTo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (fieldId: string) => {
    const updatedFields = settings.default_custom_fields.filter(f => f.id !== fieldId);
    onUpdate({ default_custom_fields: updatedFields });
  };

  const handleSave = () => {
    if (!formData.label || !formData.key) return;

    if (editingField) {
      const updatedFields = settings.default_custom_fields.map(f =>
        f.id === editingField.id ? { ...formData, id: editingField.id } : f
      );
      onUpdate({ default_custom_fields: updatedFields });
    } else {
      const newField: CustomField = {
        ...formData,
        id: crypto.randomUUID(),
      };
      onUpdate({ default_custom_fields: [...settings.default_custom_fields, newField] });
    }
    setIsDialogOpen(false);
  };

  const getApplyToLabel = (applyTo: string) => {
    switch (applyTo) {
      case 'all': return t('settings.products.apply-all');
      case 'services': return t('settings.products.apply-services');
      case 'physical': return t('settings.products.apply-physical');
      default: return applyTo;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return t('settings.products.field-type-text');
      case 'number': return t('settings.products.field-type-number');
      case 'select': return t('settings.products.field-type-select');
      case 'boolean': return t('settings.products.field-type-boolean');
      case 'date': return t('settings.products.field-type-date');
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.products.custom-fields-desc')}</p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          {t('settings.products.add-field')}
        </Button>
      </div>

      {settings.default_custom_fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>{t('settings.products.no-custom-fields')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {settings.default_custom_fields.map((field) => (
            <div 
              key={field.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-xs px-1.5 py-0.5 bg-destructive/20 text-destructive rounded">
                      {t('settings.products.required')}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex gap-3">
                  <span>{field.key}</span>
                  <span>•</span>
                  <span>{getTypeLabel(field.type)}</span>
                  <span>•</span>
                  <span>{getApplyToLabel(field.applyTo)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(field)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(field.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.products.edit-field') : t('settings.products.add-field')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>{t('settings.products.field-label')}</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder={t('settings.products.field-label-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.field-key')}</Label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder={t('settings.products.field-key-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.field-type')}</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: CustomField['type']) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
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
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.default-value')}</Label>
              <Input
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                placeholder={t('settings.products.default-value-placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.products.apply-to')}</Label>
              <Select 
                value={formData.applyTo} 
                onValueChange={(value: CustomField['applyTo']) => setFormData({ ...formData, applyTo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('settings.products.apply-all')}</SelectItem>
                  <SelectItem value="services">{t('settings.products.apply-services')}</SelectItem>
                  <SelectItem value="physical">{t('settings.products.apply-physical')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('settings.products.required')}</Label>
              <Switch
                checked={formData.required}
                onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!formData.label || !formData.key}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomFieldsSection;
