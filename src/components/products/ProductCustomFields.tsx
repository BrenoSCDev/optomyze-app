/**
 * PRODUCT CUSTOM FIELDS COMPONENT
 * 
 * Manages custom fields attached to a product in the edit modal
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { type CustomField } from '@/services/productApi';
import {
  addProductCustomField,
  updateProductCustomField,
  deleteProductCustomField,
  type ProductCustomField,
} from '@/services/productCustomFieldsApi';

interface ProductCustomFieldsProps {
  productId: number;
  productCustomFields: ProductCustomField[];
  availableFields: CustomField[];
  onFieldsChange: (fields: ProductCustomField[]) => void;
}

const ProductCustomFields = ({
  productId,
  productCustomFields,
  availableFields,
  onFieldsChange,
}: ProductCustomFieldsProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Ensure we always have an array
  const normalizeFields = (fields: ProductCustomField[] | null | undefined): ProductCustomField[] => {
    if (!fields) return [];
    if (!Array.isArray(fields)) return [];
    return fields;
  };

  const [customFields, setCustomFields] = useState<ProductCustomField[]>(normalizeFields(productCustomFields));
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('');
  const [addingField, setAddingField] = useState(false);
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  const [deletingFields, setDeletingFields] = useState<Record<string, boolean>>({});

  // Sync with parent when productCustomFields changes
  useEffect(() => {
    setCustomFields(normalizeFields(productCustomFields));
  }, [productCustomFields]);

  // Get available fields that are not already attached
  const unattachedFields = availableFields.filter(
    (field) => !customFields.some((cf) => cf.field_key === field.field_key)
  );

  // Get field definition by key
  const getFieldDefinition = (fieldKey: string): CustomField | undefined => {
    return availableFields.find((f) => f.field_key === fieldKey);
  };

  // Handle adding a new field
  const handleAddField = async () => {
    if (!selectedFieldKey) return;

    setAddingField(true);
    try {
      const fieldDef = getFieldDefinition(selectedFieldKey);
      const defaultValue = fieldDef?.field_value ?? null;
      
      await addProductCustomField(productId, {
        field_key: selectedFieldKey,
        field_value: defaultValue,
      });

      const newField: ProductCustomField = {
        field_key: selectedFieldKey,
        field_value: defaultValue,
      };

      const updatedFields = [...customFields, newField];
      setCustomFields(updatedFields);
      onFieldsChange(updatedFields);
      setSelectedFieldKey('');

      toast({
        title: t('common.success'),
        description: t('products.custom-fields.added'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('products.custom-fields.add-error'),
        variant: 'destructive',
      });
    } finally {
      setAddingField(false);
    }
  };

  // Handle updating a field value
  const handleUpdateField = async (fieldKey: string, newValue: string | boolean | number | null) => {
    setSavingFields((prev) => ({ ...prev, [fieldKey]: true }));
    try {
      await updateProductCustomField(productId, fieldKey, { field_value: newValue });

      const updatedFields = customFields.map((f) =>
        f.field_key === fieldKey ? { ...f, field_value: newValue } : f
      );
      setCustomFields(updatedFields);
      onFieldsChange(updatedFields);

      toast({
        title: t('common.success'),
        description: t('products.custom-fields.updated'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('products.custom-fields.update-error'),
        variant: 'destructive',
      });
    } finally {
      setSavingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  // Handle deleting a field
  const handleDeleteField = async (fieldKey: string) => {
    setDeletingFields((prev) => ({ ...prev, [fieldKey]: true }));
    try {
      await deleteProductCustomField(productId, fieldKey);

      const updatedFields = customFields.filter((f) => f.field_key !== fieldKey);
      setCustomFields(updatedFields);
      onFieldsChange(updatedFields);

      toast({
        title: t('common.success'),
        description: t('products.custom-fields.deleted'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('products.custom-fields.delete-error'),
        variant: 'destructive',
      });
    } finally {
      setDeletingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Field Section */}
      {unattachedFields.length > 0 && (
        <div className="p-4 bg-muted/20 rounded-lg border border-border">
          <Label className="text-sm font-medium mb-3 block">
            {t('products.custom-fields.add-field')}
          </Label>
          <div className="flex items-center gap-3">
            <Select value={selectedFieldKey} onValueChange={setSelectedFieldKey}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('products.custom-fields.select-field')} />
              </SelectTrigger>
              <SelectContent>
                {unattachedFields.map((field) => (
                  <SelectItem key={field.id} value={field.field_key}>
                    <div className="flex items-center gap-2">
                      <span>{field.field_key}</span>
                      <Badge variant="secondary" className="text-xs">
                        {field.field_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddField}
              disabled={!selectedFieldKey || addingField}
              size="sm"
            >
              {addingField ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('common.add')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Attached Fields List */}
      {customFields.length > 0 ? (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('products.custom-fields.attached-fields')}
          </Label>
          {customFields.map((field) => {
            const fieldDef = getFieldDefinition(field.field_key);
            const isDeleting = deletingFields[field.field_key];

            return (
              <div
                key={field.field_key}
                className="flex items-center justify-between p-4 rounded-lg border bg-background/50"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-foreground">
                      {field.field_key}
                    </span>
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium uppercase">
                      {fieldDef?.field_type || 'text'}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <FieldInputWrapper
                      field={field}
                      fieldDef={fieldDef}
                      isSaving={savingFields[field.field_key]}
                      onUpdate={handleUpdateField}
                      t={t}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteField(field.field_key)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive ml-4"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('products.custom-fields.no-fields')}</p>
          {unattachedFields.length > 0 && (
            <p className="text-sm mt-1">{t('products.custom-fields.add-hint')}</p>
          )}
        </div>
      )}

      {/* No Available Fields Message */}
      {availableFields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p>{t('products.custom-fields.no-definitions')}</p>
          <p className="text-sm mt-1">{t('products.custom-fields.create-hint')}</p>
        </div>
      )}
    </div>
  );
};

// Separate component to properly use hooks for local input state
interface FieldInputWrapperProps {
  field: ProductCustomField;
  fieldDef: CustomField | undefined;
  isSaving: boolean;
  onUpdate: (fieldKey: string, value: string | boolean | number | null) => void;
  t: (key: string) => string;
}

const FieldInputWrapper = ({ field, fieldDef, isSaving, onUpdate, t }: FieldInputWrapperProps) => {
  const fieldType = fieldDef?.field_type || 'text';
  const [localValue, setLocalValue] = useState(field.field_value);

  // Sync local value when field value changes
  useEffect(() => {
    setLocalValue(field.field_value);
  }, [field.field_value]);

  const handleSave = () => {
    if (localValue !== field.field_value) {
      onUpdate(field.field_key, localValue);
    }
  };

  switch (fieldType) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(field.field_value)}
            onCheckedChange={(checked) => onUpdate(field.field_key, checked)}
            disabled={isSaving}
          />
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      );

    case 'number':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={localValue as string ?? ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            disabled={isSaving}
            className="max-w-[200px]"
          />
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : localValue !== field.field_value ? (
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      );

    case 'date':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={localValue as string ?? ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            disabled={isSaving}
            className="max-w-[200px]"
          />
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : localValue !== field.field_value ? (
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      );

    default: // text, title, json
      return (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={localValue as string ?? ''}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            disabled={isSaving}
            placeholder={t('products.custom-fields.enter-value')}
            className="max-w-[300px]"
          />
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : localValue !== field.field_value ? (
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      );
  }
};

export default ProductCustomFields;
