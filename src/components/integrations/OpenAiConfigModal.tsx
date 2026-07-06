import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../../services/api';
import {
  Loader2,
  Key,
  Info,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import { SiOpenai } from 'react-icons/si';

interface OpenAiIntegrationData {
  id: number;
  name: string;
  has_api_key: boolean;
  api_key_hint: string | null;
  organization_id: string | null;
  connection_status: 'not_configured' | 'connected' | 'error';
  last_tested_at: string | null;
  is_active: boolean;
}

interface OpenAiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const OpenAiConfigModal: React.FC<OpenAiConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState<OpenAiIntegrationData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchIntegration = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/integrations/openai');
      setIntegration(response.data);
      setOrganizationId(response.data?.organization_id || '');
    } catch (error) {
      console.error('Error fetching OpenAI integration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchIntegration();
      setApiKey('');
    }
  }, [open, fetchIntegration]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;

    setSaving(true);
    try {
      const response = await api.put('/api/integrations/openai/configure', {
        api_key: apiKey.trim(),
        organization_id: organizationId.trim() || null,
      });
      setIntegration(response.data.integration);
      setApiKey('');

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.openai.key-saved-description'),
      });

      onConfigurationSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving OpenAI API key:', error);

      const data = error?.response?.data;
      if (data?.integration) {
        setIntegration(data.integration);
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
    setTesting(true);
    try {
      const response = await api.post('/api/integrations/openai/test-connection');
      setIntegration(response.data.integration);

      toast({
        title: t('integrations.openai.connection-successful'),
        description: t('integrations.openai.connection-successful-description'),
      });

      onConfigurationSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error testing OpenAI connection:', error);

      const data = error?.response?.data;
      if (data?.integration) {
        setIntegration(data.integration);
      }

      toast({
        title: t('integrations.openai.connection-failed'),
        description: data?.error || t('integrations.openai.connection-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await api.post('/api/integrations/openai/disconnect');
      setIntegration(response.data.integration);
      setApiKey('');
      setOrganizationId('');

      toast({
        title: t('integrations.openai.disconnect-success'),
        description: t('integrations.openai.disconnect-success-description'),
      });

      onConfigurationSaved();
    } catch (error) {
      console.error('Error disconnecting OpenAI:', error);
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
    if (!integration) return null;

    if (integration.connection_status === 'connected') {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {t('integrations.openai.status-connected')}
        </Badge>
      );
    }

    if (integration.connection_status === 'error') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          {t('integrations.openai.status-error')}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1">
        {t('integrations.openai.status-not-configured')}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiOpenai className="w-5 h-5 text-[#10A37F]" />
            {t('integrations.openai.modal-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.openai.modal-description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Connection status */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">
                  {t('integrations.openai.connection-status')}
                </span>
                {integration?.has_api_key && integration.api_key_hint && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {integration.api_key_hint}
                  </span>
                )}
              </div>
              {connectionBadge()}
            </div>

            {/* API key form */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="openai-api-key" className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  {t('integrations.openai.api-key-label')}
                </Label>
                <Input
                  id="openai-api-key"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="openai-org-id">
                  {t('integrations.openai.organization-label')}
                </Label>
                <Input
                  id="openai-org-id"
                  autoComplete="off"
                  placeholder="org-... (optional)"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                />
              </div>

              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>{t('integrations.openai.key-help-title')}</AlertTitle>
                <AlertDescription className="text-xs">
                  {t('integrations.openai.key-help-description')}
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveKey}
                  disabled={saving || !apiKey.trim()}
                  className="flex-1"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t('integrations.openai.save-key')}
                </Button>

                {integration?.has_api_key && (
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t('integrations.openai.test-connection')}
                  </Button>
                )}
              </div>
            </div>

            {integration?.has_api_key && (
              <>
                <Separator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={disconnecting}>
                      {disconnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {t('integrations.openai.disconnect')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('integrations.openai.disconnect-confirm-title')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('integrations.openai.disconnect-confirm-description')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisconnect}>
                        {t('integrations.openai.disconnect')}
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

export default OpenAiConfigModal;
