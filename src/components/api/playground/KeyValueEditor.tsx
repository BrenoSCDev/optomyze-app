/**
 * Key-Value Editor Component
 * Reusable component for editing headers, query params, and form data
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { KeyValuePair, generateId } from './types';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showPresets?: boolean;
  presets?: KeyValuePair[];
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
  showPresets,
  presets,
}) => {
  const { t } = useLanguage();
  
  const handleAdd = () => {
    onChange([...items, { id: generateId(), key: '', value: '', enabled: true }]);
  };

  const handleRemove = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleChange = (id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    onChange(
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddPreset = (preset: KeyValuePair) => {
    const exists = items.some(item => item.key === preset.key);
    if (!exists) {
      onChange([...items, { ...preset, id: generateId() }]);
    }
  };

  return (
    <div className="space-y-3">
      {showPresets && presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
          <span className="text-xs text-muted-foreground">{t('api.playground.presets')}:</span>
          {presets.map(preset => (
            <Button
              key={preset.id}
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 bg-muted/30 hover:bg-muted/50"
              onClick={() => handleAddPreset(preset)}
            >
              {preset.key}
            </Button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          {t('api.playground.no-items')}
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(checked) => handleChange(item.id, 'enabled', !!checked)}
              className="data-[state=checked]:bg-primary"
            />
            <Input
              value={item.key}
              onChange={(e) => handleChange(item.id, 'key', e.target.value)}
              placeholder={keyPlaceholder || t('api.playground.key')}
              className={`flex-1 h-8 text-sm ${!item.enabled ? 'opacity-50' : ''}`}
            />
            <Input
              value={item.value}
              onChange={(e) => handleChange(item.id, 'value', e.target.value)}
              placeholder={valuePlaceholder || t('api.playground.value')}
              className={`flex-1 h-8 text-sm ${!item.enabled ? 'opacity-50' : ''}`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full border border-dashed border-border/50 text-muted-foreground hover:text-foreground"
        onClick={handleAdd}
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('api.playground.add')}
      </Button>
    </div>
  );
};
