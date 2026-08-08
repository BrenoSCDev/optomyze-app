import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  configureLlmProvider,
  disconnectLlmProvider,
  getLlmCatalog,
  testLlmProvider,
  type LlmProvider,
} from '../../services/llmProviderApi';
import {
  Loader2,
  Key,
  Info,
  CheckCircle2,
  XCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface LlmProviderConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which vendor to configure — a driver key from the backend registry. */
  providerKey?: string;
  onConfigurationSaved: () => void;
}

/**
 * Connect the CRM to an LLM vendor.
 *
 * Every field on this form is rendered from what the backend says the vendor
 * needs, so a newly registered provider appears here complete without this
 * file changing. There is deliberately no vendor-specific branch anywhere in
 * this component.
 */
const LlmProviderConfigModal: React.FC<LlmProviderConfigModalProps> = ({
  open,
  onOpenChange,
  providerKey,
  onConfigurationSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<LlmProvider | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    if (!providerKey) return;

    try {
      setLoading(true);
      const { providers } = await getLlmCatalog();
      setProvider(providers.find((p) => p.key === providerKey) ?? null);
      // Credentials are never returned by the API, so the inputs always start
      // empty — saving replaces whatever is stored.
      setCredentials({});
    } catch (error) {
      console.error('Error loading LLM provider:', error);
      toast({
        title: t('integrations.llm.load-failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [providerKey, toast, t]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const account = provider?.account ?? null;
  const fields = useMemo(() => provider?.credential_fields ?? [], [provider]);

  const missingRequired = fields
    .filter((field) => field.required)
    .some((field) => !credentials[field.key]?.trim());

  const handleSave = async () => {
    if (!provider) return;

    setSaving(true);
    try {
      const payload = Object.fromEntries(
        fields.map((field) => [field.key, credentials[field.key]?.trim() || '']),
      );

      const { account: saved } = await configureLlmProvider(provider.key, payload);
      setProvider((prev) => (prev ? { ...prev, account: saved } : prev));
      setCredentials({});

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.llm.key-saved-description'),
      });

      onConfigurationSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving LLM credentials:', error);

      const data = error?.response?.data;
      if (data?.account) {
        setProvider((prev) => (prev ? { ...prev, account: data.account } : prev));
      }

      toast({
        title: t('integrations.configuration-failed'),
        description: data?.error || t('integrations.configuration-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!provider) return;

    setTesting(true);
    try {
      const { account: tested } = await testLlmProvider(provider.key);
      setProvider((prev) => (prev ? { ...prev, account: tested } : prev));

      toast({
        title: t('integrations.llm.connection-successful'),
        description: t('integrations.llm.connection-successful-description'),
      });

      onConfigurationSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error testing LLM connection:', error);

      const data = error?.response?.data;
      if (data?.account) {
        setProvider((prev) => (prev ? { ...prev, account: data.account } : prev));
      }

      toast({
        title: t('integrations.llm.connection-failed'),
        description: data?.error || t('integrations.llm.connection-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!provider) return;

    setDisconnecting(true);
    try {
      const disconnected = await disconnectLlmProvider(provider.key);
      setProvider((prev) => (prev ? { ...prev, account: disconnected } : prev));
      setCredentials({});

      toast({
        title: t('integrations.llm.disconnect-success'),
        description: t('integrations.llm.disconnect-success-description'),
      });

      onConfigurationSaved();
    } catch (error) {
      console.error('Error disconnecting LLM provider:', error);
      toast({
        title: t('integrations.configuration-failed'),
        description: t('integrations.configuration-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const connectionBadge = () => {
    if (!account) return null;

    if (account.connection_status === 'connected') {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {t('integrations.llm.status-connected')}
        </Badge>
      );
    }

    if (account.connection_status === 'error') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          {t('integrations.llm.status-error')}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        {t('integrations.llm.status-not-configured')}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {provider?.label ?? t('integrations.llm.modal-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.llm.modal-description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !provider ? (
          <p className="py-6 text-sm text-muted-foreground text-center">
            {t('integrations.llm.load-failed')}
          </p>
        ) : (
          <div className="space-y-5">
            {/* Connection status */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {t('integrations.llm.connection-status')}
                </span>
                {account?.has_api_key && account.api_key_hint && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {account.api_key_hint}
                  </span>
                )}
              </div>
              {connectionBadge()}
            </div>

            {/* Credential form — rendered from the driver's declared fields */}
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`llm-${provider.key}-${field.key}`} className="flex items-center gap-1.5">
                    {field.type === 'password' && <Key className="w-3.5 h-3.5" />}
                    {field.label}
                  </Label>
                  <Input
                    id={`llm-${provider.key}-${field.key}`}
                    type={field.type === 'password' ? 'password' : 'text'}
                    autoComplete="off"
                    placeholder={field.placeholder}
                    value={credentials[field.key] ?? ''}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}

              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>{t('integrations.llm.key-help-title')}</AlertTitle>
                <AlertDescription className="text-xs">
                  {t('integrations.llm.key-help-description')}
                  {provider.docs_url && (
                    <a
                      href={provider.docs_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      {provider.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || missingRequired}
                  className="flex-1"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('integrations.llm.save-key')}
                </Button>

                {account?.has_api_key && (
                  <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('integrations.llm.test-connection')}
                  </Button>
                )}
              </div>
            </div>

            {/* Models this key can reach — the set an agent can be pointed at */}
            {account?.connection_status === 'connected' && provider.models.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('integrations.llm.available-models')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {provider.models.map((model) => (
                    <Badge key={model} variant="secondary" className="font-mono text-[11px]">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {account?.has_api_key && (
              <>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={disconnecting}>
                      {disconnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {t('integrations.llm.disconnect')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('integrations.llm.disconnect-confirm-title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('integrations.llm.disconnect-confirm-description')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnect}>
                        {t('integrations.llm.disconnect')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LlmProviderConfigModal;
