/**
 * Request Body Editor Component
 * Handles different body types with syntax highlighting and validation
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyType, KeyValuePair, generateId } from './types';

interface RequestBodyEditorProps {
  bodyType: BodyType;
  body: string;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
}

export const RequestBodyEditor: React.FC<RequestBodyEditorProps> = ({
  bodyType,
  body,
  onBodyTypeChange,
  onBodyChange,
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formData, setFormData] = useState<KeyValuePair[]>([
    { id: generateId(), key: '', value: '', enabled: true },
  ]);

  useEffect(() => {
    if (bodyType === 'raw-json' && body.trim()) {
      try {
        JSON.parse(body);
        setIsValid(true);
        setErrorMessage('');
      } catch (e) {
        setIsValid(false);
        setErrorMessage((e as Error).message);
      }
    } else if (bodyType === 'raw-xml' && body.trim()) {
      // Basic XML validation
      const hasOpenTag = /<[^>]+>/.test(body);
      const hasCloseTag = /<\/[^>]+>/.test(body);
      setIsValid(hasOpenTag && hasCloseTag);
      setErrorMessage(hasOpenTag && hasCloseTag ? '' : 'Invalid XML format');
    } else {
      setIsValid(null);
      setErrorMessage('');
    }
  }, [body, bodyType]);

  const handleFormat = () => {
    if (bodyType === 'raw-json') {
      try {
        const parsed = JSON.parse(body);
        onBodyChange(JSON.stringify(parsed, null, 2));
      } catch {
        // Can't format invalid JSON
      }
    }
  };

  const handleFormDataChange = (items: KeyValuePair[]) => {
    setFormData(items);
    // Convert form data to URL encoded string for the body
    const encoded = items
      .filter(item => item.enabled && item.key)
      .map(item => `${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
      .join('&');
    onBodyChange(encoded);
  };

  const bodyTypes = [
    { value: 'none', label: 'None' },
    { value: 'raw-json', label: 'JSON' },
    { value: 'raw-xml', label: 'XML' },
    { value: 'raw-text', label: 'Text' },
    { value: 'form-data', label: 'Form Data' },
    { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={bodyType} onValueChange={(v) => onBodyTypeChange(v as BodyType)}>
          <SelectTrigger className="w-48 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bodyTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {bodyType === 'raw-json' && (
          <div className="flex items-center gap-2">
            {isValid !== null && (
              <span className={`flex items-center gap-1 text-xs ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                {isValid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {isValid ? 'Valid JSON' : 'Invalid JSON'}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleFormat}
              disabled={!isValid}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Format
            </Button>
          </div>
        )}
      </div>

      {bodyType === 'none' && (
        <div className="p-8 text-center text-muted-foreground text-sm bg-muted/20 rounded-lg border border-dashed border-border/50">
          This request does not have a body
        </div>
      )}

      {(bodyType === 'raw-json' || bodyType === 'raw-xml' || bodyType === 'raw-text') && (
        <div className="relative">
          <Textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder={
              bodyType === 'raw-json'
                ? '{\n  "key": "value"\n}'
                : bodyType === 'raw-xml'
                ? '<root>\n  <element>value</element>\n</root>'
                : 'Enter text...'
            }
            className={`min-h-[200px] font-mono text-sm resize-y ${
              isValid === false ? 'border-red-500/50 focus-visible:ring-red-500' : ''
            }`}
          />
          {errorMessage && (
            <p className="text-xs text-red-400 mt-1">{errorMessage}</p>
          )}
        </div>
      )}

      {(bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded') && (
        <KeyValueEditor
          items={formData}
          onChange={handleFormDataChange}
          keyPlaceholder="Field name"
          valuePlaceholder="Value"
        />
      )}
    </div>
  );
};
