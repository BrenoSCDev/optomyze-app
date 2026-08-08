import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  documentService,
  type DocumentTemplate,
  type DocumentType,
  type DocumentRecord,
} from '@/services/documentsApi';
import { Loader2, AlertTriangle, FileText } from 'lucide-react';

interface NewDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-attach to the record the modal was opened from. */
  leadId?: number | null;
  saleId?: number | null;
  onCreated?: (document: DocumentRecord) => void;
}

/**
 * Compose a document from a type and a template.
 *
 * The template list is filtered to published ones, and a template that needs a
 * Deal is flagged when the document has none — catching the mismatch here
 * rather than letting the contract render with blanks where the money should be.
 */
const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  open, onOpenChange, leadId, saleId, onCreated,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const [typeId, setTypeId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generateNow, setGenerateNow] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [typesResult, templatesResult] = await Promise.all([
        documentService.types(),
        documentService.templates({ published_only: true }),
      ]);

      setTypes(typesResult.data.filter((type) => type.is_active));
      setTemplates(templatesResult);
    } catch {
      toast({
        title: t('documents.new.load-failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (!open) return;

    load();
    setTypeId('');
    setTemplateId('');
    setTitle('');
    setValue('');
    setStartDate('');
    setEndDate('');
    setGenerateNow(true);
    setError(null);
  }, [open, load]);

  const selectedType = types.find((type) => String(type.id) === typeId) ?? null;

  // A type's default template is a strong hint; picking the type should fill it.
  useEffect(() => {
    if (selectedType?.default_template_id) {
      setTemplateId(String(selectedType.default_template_id));
    }
  }, [selectedType]);

  const availableTemplates = templates.filter(
    (template) => !typeId || !template.document_type_id || String(template.document_type_id) === typeId,
  );

  const selectedTemplate = templates.find((template) => String(template.id) === templateId) ?? null;

  // What the chosen template needs versus what this document actually has.
  const missingRecords = (selectedTemplate?.variables_schema?.requires ?? []).filter((requirement) => {
    if (requirement === 'sale') return !saleId;
    if (requirement === 'lead') return !leadId;
    return false;
  });

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const document = await documentService.create({
        document_type_id: Number(typeId),
        title,
        document_template_id: templateId ? Number(templateId) : null,
        lead_id: leadId ?? null,
        sale_id: saleId ?? null,
        value: value ? Number(value) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        generate: generateNow && Boolean(templateId),
      });

      toast({ title: t('documents.new.created'), description: document.number });
      onCreated?.(document);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('documents.new.create-failed'));
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = typeId !== '' && title.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('documents.new.title')}</DialogTitle>
          <DialogDescription>{t('documents.new.description')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="break-words">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>{t('documents.new.type')} *</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.new.type-placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-title">{t('documents.new.name')} *</Label>
              <Input
                id="document-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('documents.new.name-placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('documents.new.template')}</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('documents.new.template-placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('documents.new.no-templates')}
                </p>
              )}
            </div>

            {/* Caught here rather than as blanks in a signed contract. */}
            {missingRecords.length > 0 && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle className="text-sm">{t('documents.new.missing-records-title')}</AlertTitle>
                <AlertDescription className="text-xs">
                  {missingRecords.includes('sale')
                    ? t('documents.new.missing-deal')
                    : t('documents.new.missing-lead')}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="document-value">{t('documents.new.value')}</Label>
                <Input
                  id="document-value"
                  type="number"
                  min={0}
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-start">{t('documents.new.start-date')}</Label>
                <Input
                  id="document-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-end">{t('documents.new.end-date')}</Label>
                <Input
                  id="document-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {templateId && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="generate-now"
                  checked={generateNow}
                  onCheckedChange={(checked) => setGenerateNow(checked === true)}
                />
                <Label htmlFor="generate-now" className="text-sm font-normal">
                  {t('documents.new.generate-now')}
                </Label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('documents.new.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            {t('documents.new.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentModal;
