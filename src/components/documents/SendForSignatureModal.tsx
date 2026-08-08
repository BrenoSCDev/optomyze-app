import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { signatureService, type SignatureProvider } from '@/services/signatureApi';
import { documentService, type DocumentRecord } from '@/services/documentsApi';
import { Loader2, Plus, Trash2, Upload, AlertTriangle } from 'lucide-react';

interface SendForSignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentRecord | null;
  defaultSigner?: { name?: string; email?: string; phone?: string; leadId?: number };
  onSent?: () => void;
}

interface SignerForm {
  name: string;
  email: string;
  phone: string;
  document_number: string;
  signing_group: number;
  refusable: boolean;
  auth_methods: string[];
  lead_id?: number | null;
}

const emptySigner = (): SignerForm => ({
  name: '', email: '', phone: '', document_number: '',
  signing_group: 1, refusable: true, auth_methods: ['email'],
});

/**
 * Send a generated document for signature.
 *
 * Who signs belongs to *this* sending, not to the document — resending a
 * rejected contract often means sending it to somebody else — so the signer
 * list is composed here rather than stored on the record.
 *
 * Every option is rendered from the provider's declared capabilities, so a new
 * signature vendor changes what this form offers without changing this file.
 */
const SendForSignatureModal: React.FC<SendForSignatureModalProps> = ({
  open, onOpenChange, document, defaultSigner, onSent,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<SignatureProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [message, setMessage] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reminderInterval, setReminderInterval] = useState('3');
  const [blockAfterRefusal, setBlockAfterRefusal] = useState(false);
  const [signers, setSigners] = useState<SignerForm[]>([emptySigner()]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { default_provider, providers } = await signatureService.listProviders();
      setProvider(
        providers.find((p) => p.account?.is_usable)
          ?? providers.find((p) => p.key === default_provider)
          ?? null,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    load();
    setErrors([]);
    setMessage('');
    setDeadline('');
    setSigners([{
      ...emptySigner(),
      name: defaultSigner?.name ?? '',
      email: defaultSigner?.email ?? '',
      phone: defaultSigner?.phone ?? '',
      lead_id: defaultSigner?.leadId ?? null,
    }]);
  }, [open, load, defaultSigner]);

  const capabilities = provider?.capabilities;
  const connected = provider?.account?.is_usable ?? false;

  const updateSigner = (index: number, patch: Partial<SignerForm>) =>
    setSigners((current) => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const toggleAuthMethod = (index: number, method: string) =>
    setSigners((current) => current.map((signer, i) => {
      if (i !== index) return signer;

      const next = signer.auth_methods.includes(method)
        ? signer.auth_methods.filter((m) => m !== method)
        : [...signer.auth_methods, method];

      // At least one identity check is required for a signature to be
      // collectable, so the last one cannot be removed.
      return { ...signer, auth_methods: next.length > 0 ? next : signer.auth_methods };
    }));

  const handleSubmit = async () => {
    if (!document) return;

    setErrors([]);
    setSubmitting(true);

    try {
      await documentService.send(document.id, {
        signers: signers.map((signer) => ({
          name: signer.name,
          email: signer.email || undefined,
          phone: signer.phone || undefined,
          document_number: signer.document_number || undefined,
          signing_group: signer.signing_group,
          refusable: signer.refusable,
          auth_methods: signer.auth_methods,
          lead_id: signer.lead_id ?? null,
        })),
        message: message || undefined,
        deadline_at: deadline || null,
        reminder_interval: reminderInterval === 'none' ? null : Number(reminderInterval),
        block_after_refusal: blockAfterRefusal,
      });

      toast({
        title: t('documents.send.sent-title'),
        description: t('documents.send.sent-description'),
      });

      onSent?.();
      onOpenChange(false);
    } catch (error: any) {
      // The backend validates against the provider's own rules before
      // spending an API call, so these messages are actionable.
      const validation = error?.response?.data?.errors;

      setErrors(validation
        ? (Object.values(validation).flat() as string[])
        : [error?.response?.data?.message ?? t('documents.send.failed')]);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = signers.every((signer) => signer.name.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('documents.send.title')}</DialogTitle>
          <DialogDescription>
            {document?.number}
            {provider ? ` · ${t('documents.send.via')} ${provider.label}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !connected ? (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>{t('documents.send.not-connected-title')}</AlertTitle>
            <AlertDescription>{t('documents.send.not-connected-description')}</AlertDescription>
          </Alert>
        ) : !document?.has_pdf ? (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>{t('documents.send.not-generated-title')}</AlertTitle>
            <AlertDescription>{t('documents.send.not-generated-description')}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-5">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>{t('documents.send.errors-title')}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="send-message">{t('documents.send.message')}</Label>
              <Textarea
                id="send-message"
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('documents.send.message-placeholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities?.supports_deadline && (
                <div className="space-y-2">
                  <Label htmlFor="send-deadline">{t('documents.send.deadline')}</Label>
                  <Input
                    id="send-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('documents.send.reminders')}</Label>
                <Select value={reminderInterval} onValueChange={setReminderInterval}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(capabilities?.reminder_intervals ?? [3]).map((interval) => (
                      <SelectItem key={String(interval)} value={interval === null ? 'none' : String(interval)}>
                        {interval === null
                          ? t('documents.send.reminder-none')
                          : t('documents.send.reminder-every').replace('{days}', String(interval))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {capabilities?.supports_refusal && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="block-after-refusal"
                  checked={blockAfterRefusal}
                  onCheckedChange={(checked) => setBlockAfterRefusal(checked === true)}
                />
                <Label htmlFor="block-after-refusal" className="text-sm font-normal">
                  {t('documents.send.block-after-refusal')}
                </Label>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('documents.send.signers')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSigners((current) => [...current, emptySigner()])}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('documents.send.add-signer')}
                </Button>
              </div>

              {signers.map((signer, index) => (
                <div key={index} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t('documents.send.signer-number').replace('{n}', String(index + 1))}
                    </span>
                    {signers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setSigners((c) => c.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('documents.send.signer-name')} *</Label>
                      <Input
                        value={signer.name}
                        onChange={(e) => updateSigner(index, { name: e.target.value })}
                        placeholder="Maria Silva"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('documents.send.signer-email')}</Label>
                      <Input
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, { email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('documents.send.signer-phone')}</Label>
                      <Input
                        value={signer.phone}
                        onChange={(e) => updateSigner(index, { phone: e.target.value })}
                        placeholder="11987654321"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('documents.send.signer-document')}</Label>
                      <Input
                        value={signer.document_number}
                        onChange={(e) => updateSigner(index, { document_number: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  {capabilities?.supports_signing_order && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('documents.send.signing-order')}</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        value={signer.signing_group}
                        onChange={(e) => updateSigner(index, { signing_group: Number(e.target.value) || 1 })}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        {t('documents.send.signing-order-hint')}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">{t('documents.send.authentication')}</Label>
                    <div className="flex flex-wrap gap-3">
                      {capabilities?.auth_methods.map((method) => (
                        <label key={method.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox
                            checked={signer.auth_methods.includes(method.key)}
                            onCheckedChange={() => toggleAuthMethod(index, method.key)}
                          />
                          {method.label}
                          {/* Vendors charge per use for some checks — say so. */}
                          {method.billed && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {t('documents.send.billed')}
                            </Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('documents.send.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!connected || !document?.has_pdf || !canSubmit || submitting}
          >
            {submitting
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Upload className="w-4 h-4 mr-2" />}
            {t('documents.send.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendForSignatureModal;
