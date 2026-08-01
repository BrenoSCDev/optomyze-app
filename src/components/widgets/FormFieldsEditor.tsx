/**
 * FORM FIELDS EDITOR
 *
 * The visual form builder: reorder fields by dragging, toggle the built-in CRM
 * fields on and off, and add unlimited custom fields whose values are stored
 * as lead custom fields on submission.
 */

import React, { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Plus, ChevronDown, X, Lock,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useLanguage } from '../../contexts/LanguageContext';
import { FormField, FormFieldType } from '../../services/widgetApi';

interface FormFieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const CUSTOM_FIELD_TYPES: { type: FormFieldType; labelKey: string; fallback: string }[] = [
  { type: 'text', labelKey: 'widgets.form.field-type.text', fallback: 'Short text' },
  { type: 'textarea', labelKey: 'widgets.form.field-type.textarea', fallback: 'Long text' },
  { type: 'select', labelKey: 'widgets.form.field-type.select', fallback: 'Dropdown' },
  { type: 'radio', labelKey: 'widgets.form.field-type.radio', fallback: 'Radio buttons' },
  { type: 'checkbox', labelKey: 'widgets.form.field-type.checkbox', fallback: 'Checkbox' },
  { type: 'number', labelKey: 'widgets.form.field-type.number', fallback: 'Number' },
  { type: 'date', labelKey: 'widgets.form.field-type.date', fallback: 'Date' },
];

const isLeadField = (field: FormField) => field.source === 'lead';

/** Field keys become CRM custom-field keys, so they must be snake_case and unique. */
const toFieldKey = (label: string, existing: string[]): string => {
  const base = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, 'f$1') || 'field';

  if (!existing.includes(base)) return base;

  let index = 2;
  while (existing.includes(`${base}_${index}`)) index++;
  return `${base}_${index}`;
};

const SortableFieldRow: React.FC<{
  field: FormField;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<FormField>) => void;
  onRemove: () => void;
}> = ({ field, expanded, onToggleExpand, onUpdate, onRemove }) => {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const typeLabel = CUSTOM_FIELD_TYPES.find((option) => option.type === field.type);
  const hasOptions = field.type === 'select' || field.type === 'radio';

  const updateOption = (index: number, patch: Partial<{ label: string; value: string }>) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], ...patch };
    onUpdate({ options });
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          title={t('widgets.form.reorder')}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{field.label || field.key}</span>
            <Badge variant="secondary" className="text-[10px]">
              {t(typeLabel?.labelKey || '') || typeLabel?.fallback}
            </Badge>
            {isLeadField(field) && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Lock className="h-2.5 w-2.5" />
                {t('widgets.form.crm-field')}
              </Badge>
            )}
            {field.required && (
              <Badge variant="outline" className="border-orange-500/30 text-[10px] text-orange-600 dark:text-orange-400">
                {t('widgets.form.required')}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{field.key}</p>
        </div>

        <Switch
          checked={field.enabled}
          onCheckedChange={(enabled) => onUpdate({ enabled })}
          aria-label={t('widgets.form.enable-field')}
        />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>

        {!isLeadField(field) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('widgets.form.field-label')}</Label>
              <Input value={field.label} onChange={(e) => onUpdate({ label: e.target.value })} />
            </div>

            {!isLeadField(field) && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t('widgets.form.field-name')}</Label>
                <Input
                  value={field.key}
                  onChange={(e) =>
                    onUpdate({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
                  }
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">{t('widgets.form.field-name-hint')}</p>
              </div>
            )}

            {field.type !== 'checkbox' && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t('widgets.form.placeholder')}</Label>
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{t('widgets.form.help-text')}</Label>
              <Input value={field.help_text || ''} onChange={(e) => onUpdate({ help_text: e.target.value })} />
            </div>

            {field.type === 'number' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('widgets.form.min-value')}</Label>
                  <Input
                    type="number"
                    value={field.validation?.min ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: { ...field.validation, min: e.target.value === '' ? null : Number(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('widgets.form.max-value')}</Label>
                  <Input
                    type="number"
                    value={field.validation?.max ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        validation: { ...field.validation, max: e.target.value === '' ? null : Number(e.target.value) },
                      })
                    }
                  />
                </div>
              </>
            )}

            {(field.type === 'text' || field.type === 'textarea') && !isLeadField(field) && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t('widgets.form.max-length')}</Label>
                <Input
                  type="number"
                  value={field.validation?.max_length ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        max_length: e.target.value === '' ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {hasOptions && (
            <div className="space-y-2">
              <Label className="text-xs">{t('widgets.form.options')}</Label>
              {(field.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    placeholder={t('widgets.form.option-label')}
                    onChange={(e) => {
                      const label = e.target.value;
                      // Keep value in step with the label until it's edited directly.
                      const autoValue = toFieldKey(label, []);
                      updateOption(index, { label, value: option.value === '' ? autoValue : option.value });
                    }}
                  />
                  <Input
                    value={option.value}
                    placeholder={t('widgets.form.option-value')}
                    className="font-mono text-xs"
                    onChange={(e) => updateOption(index, { value: e.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    onClick={() => onUpdate({ options: (field.options || []).filter((_, i) => i !== index) })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onUpdate({
                    options: [
                      ...(field.options || []),
                      { label: '', value: `option_${(field.options || []).length + 1}` },
                    ],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                {t('widgets.form.add-option')}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{t('widgets.form.required')}</p>
              <p className="text-xs text-muted-foreground">{t('widgets.form.required-hint')}</p>
            </div>
            <Switch checked={field.required} onCheckedChange={(required) => onUpdate({ required })} />
          </div>
        </div>
      )}
    </div>
  );
};

const FormFieldsEditor: React.FC<FormFieldsEditorProps> = ({ fields, onChange }) => {
  const { t } = useLanguage();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((field) => field.key === active.id);
    const newIndex = fields.findIndex((field) => field.key === over.id);

    onChange(arrayMove(fields, oldIndex, newIndex));
  };

  const updateField = (key: string, patch: Partial<FormField>) => {
    onChange(fields.map((field) => (field.key === key ? { ...field, ...patch } : field)));

    // Follow the row if its key was just renamed.
    if (patch.key && expandedKey === key) setExpandedKey(patch.key);
  };

  const addCustomField = (type: FormFieldType) => {
    const typeOption = CUSTOM_FIELD_TYPES.find((option) => option.type === type);
    const label = t(typeOption?.labelKey || '') || typeOption?.fallback || 'Field';
    const key = toFieldKey(label, fields.map((field) => field.key));

    const field: FormField = {
      key,
      source: 'custom',
      type,
      label,
      placeholder: '',
      required: false,
      enabled: true,
      ...(type === 'select' || type === 'radio'
        ? { options: [{ label: 'Option 1', value: 'option_1' }] }
        : {}),
    };

    onChange([...fields, field]);
    setExpandedKey(key);
  };

  const leadFieldCount = fields.filter((field) => isLeadField(field) && field.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('widgets.form.fields-title')}</h3>
          <p className="text-xs text-muted-foreground">{t('widgets.form.fields-description')}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('widgets.form.add-field')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CUSTOM_FIELD_TYPES.map((option) => (
              <DropdownMenuItem key={option.type} onClick={() => addCustomField(option.type)}>
                {t(option.labelKey) || option.fallback}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((field) => field.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {fields.map((field) => (
              <SortableFieldRow
                key={field.key}
                field={field}
                expanded={expandedKey === field.key}
                onToggleExpand={() => setExpandedKey(expandedKey === field.key ? null : field.key)}
                onUpdate={(patch) => updateField(field.key, patch)}
                onRemove={() => onChange(fields.filter((item) => item.key !== field.key))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {leadFieldCount === 0 && (
        <p className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-700 dark:text-orange-400">
          {t('widgets.form.no-lead-fields-warning')}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {t('widgets.form.custom-fields-hint')}
      </p>
    </div>
  );
};

export default FormFieldsEditor;
