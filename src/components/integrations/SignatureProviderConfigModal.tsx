import React, { useCallback, useEffect, useState } from 'react';
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
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  signatureService,
  type SignatureProvider,
} from '../../services/signatureApi';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  Copy,
  Webhook,
} from 'lucide-react';

interface SignatureProviderConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which vendor to configure. Defaults to the backend's default provider. */
  providerKey?: string;
  onConfigurationSaved?: () => void;
}

/**
 * Connect the CRM to a digital-signature vendor.
 *
 * Every field on this form is rendered from what the backend says the vendor
 * needs — its credential fields, its environments, its capabilities. There is
 * no vendor-specific branch anywhere in this component, so a new provider
 * appears here complete, without this file changing.
 */
const SignatureProviderConfigModal: React.FC<SignatureProviderConfigModalProps> = ({
  open,
  onOpenChange,
  providerKey,
  onConfigurationSaved,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<SignatureProvider | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [environment, setEnvironment] = useState<string>('sandbox');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { default_provider, providers } = await signatureService.listProviders();
      const target = providers.find((p) => p.key === (providerKey ?? default_provider)) ?? providers[0] ?? null;

      setProvider(target);
      setEnvironment(
        target?.account?.environment ?? target?.capabilities.environments[0] ?? 'sandbox',
      );
      // Credentials are never returned by the API, so the inputs always start
      // empty — saving replaces whatever is stored.
      setCredentials({});
    } catch (error) {
      toast({
        title: t('signatures.provider.error'),
        description: t('signatures.provider.load-failed'),
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
  const capabilities = provider?.capabilities;

  const missingRequired = (capabilities?.credential_fields ?? [])
    .filter((field) => field.required)
    .some((field) => !credentials[field.key]?.trim());

  const handleSave = async () => {
    if (!provider) return;

    setSaving(true);
    try {
      const result = await signatureService.configureProvider(provider.key, {
        credentials,
        environment,
      });

      toast({ title: t('signatures.provider.connected'), description: result.message });
      setCredentials({});
      await load();
      onConfigurationSaved?.();
    } catch (error: any) {
      toast({
        title: t('signatures.provider.connect-failed'),
        description:
          error?.response?.data?.message ?? t('signatures.provider.connect-failed-description'),
        variant: 'destructive',
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!provider) return;

    setTesting(true);
    try {
      const result = await signatureService.testProvider(provider.key);
      toast({ title: t('signatures.provider.test-success'), description: result.message });
      await load();
    } catch (error: any) {
      toast({
        title: t('signatures.provider.test-failed'),
        description: error?.response?.data?.message ?? t('signatures.provider.test-failed-description'),
        variant: 'destructive',
      });
      await load();
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!provider) return;

    setDisconnecting(true);
    try {
      await signatureService.disconnectProvider(provider.key);
      toast({
        title: t('signatures.provider.disconnected'),
        description: t('signatures.provider.disconnected-description'),
      });
      await load();
      onConfigurationSaved?.();
    } catch (error: any) {
      toast({
        title: t('signatures.provider.error'),
        description: error?.response?.data?.message ?? t('signatures.provider.disconnect-failed'),
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (!account?.webhook_url) return;
    navigator.clipboard.writeText(account.webhook_url);
    toast({
      title: t('signatures.provider.copied'),
      description: t('signatures.provider.copied-description'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {provider?.label ?? t('signatures.provider.title')}
            {account?.connection_status === 'connected' && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t('signatures.provider.connected')}
              </Badge>
            )}
            {account?.connection_status === 'error' && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="w-3 h-3" /> {t('signatures.provider.error')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {t('signatures.provider.description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !provider ? (
          <Alert variant="destructive">
            <AlertTitle>{t('signatures.provider.none-title')}</AlertTitle>
            <AlertDescription>{t('signatures.provider.none-description')}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {account?.last_error && account.connection_status === 'error' && (
              <Alert variant="destructive">
                <AlertTitle>{t('signatures.provider.last-failure')}</AlertTitle>
                <AlertDescription className="break-words">{account.last_error}</AlertDescription>
              </Alert>
            )}

            {capabilities && capabilities.environments.length > 1 && (
              <div className="space-y-2">
                <Label>{t('signatures.provider.environment')}</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.environments.map((env) => (
                      <SelectItem key={env} value={env}>
                        {env === 'sandbox'
                          ? t('signatures.provider.environment-sandbox')
                          : t('signatures.provider.environment-production')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('signatures.provider.environment-hint')}
                </p>
              </div>
            )}

            {/* Rendered from the driver's own declaration — no vendor logic here. */}
            {capabilities?.credential_fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`cred-${field.key}`}>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>
                <Input
                  id={`cred-${field.key}`}
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={credentials[field.key] ?? ''}
                  placeholder={account?.has_credentials ? t('signatures.provider.credentials-placeholder') : ''}
                  onChange={(e) =>
                    setCredentials((current) => ({ ...current, [field.key]: e.target.value }))
                  }
                />
                {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
              </div>
            ))}

            {account?.has_credentials && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Webhook className="w-4 h-4" /> {t('signatures.provider.webhook-url')}
                  </Label>
                  <div className="flex gap-2">
                    <Input readOnly value={account.webhook_url} className="text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={copyWebhookUrl}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {account.webhook_status === 'registered' && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {t('signatures.provider.webhook-registered')}
                    </p>
                  )}
                  {account.webhook_status === 'unsupported' && (
                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        {t('signatures.provider.webhook-unsupported')}
                      </AlertDescription>
                    </Alert>
                  )}
                  {account.webhook_status === 'error' && (
                    <p className="text-xs text-destructive">
                      {t('signatures.provider.webhook-error')}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving || missingRequired}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {account?.has_credentials
                  ? t('signatures.provider.update-credentials')
                  : t('signatures.provider.connect')}
              </Button>

              {account?.has_credentials && (
                <>
                  <Button variant="outline" onClick={handleTest} disabled={testing}>
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('signatures.provider.test-connection')}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {t('signatures.provider.disconnect')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignatureProviderConfigModal;
