import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getEcho } from '../../services/echo';
import api from '../../services/api';
import {
  Loader2,
  Key,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Webhook,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import { SiInstagram } from 'react-icons/si';

interface InstagramIntegrationData {
  id: number;
  has_access_token: boolean;
  instagram_user_id: string | null;
  username: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
  connection_status: 'not_configured' | 'connected' | 'error';
  webhook_callback_id: string;
  webhook_verify_token: string;
  webhook_status: 'pending' | 'verified';
  webhook_callback_url: string;
}

type WebhookTestStatus =
  | 'waiting'
  | 'verification_attempt'
  | 'verified'
  | 'verification_failed'
  | 'subscribed'
  | 'subscription_failed';

interface InstagramConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const InstagramConfigModal: React.FC<InstagramConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState<InstagramIntegrationData | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const [webhookTesting, setWebhookTesting] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<WebhookTestStatus | null>(null);
  const [webhookTestReason, setWebhookTestReason] = useState<string | null>(null);

  const fetchIntegration = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/integrations/instagram');
      setIntegration(response.data);
    } catch (error) {
      console.error('Error fetching Instagram integration:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchIntegration();
      setAccessToken('');
      setWebhookTesting(false);
      setWebhookTestStatus(null);
      setWebhookTestReason(null);
    }
  }, [open, fetchIntegration]);

  // Listen for live webhook verification events while "Test Webhook Connection" is active
  const integrationId = integration?.id;
  const companyId = user?.company_id;

  useEffect(() => {
    if (!webhookTesting || !integrationId || !companyId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`company.${companyId}`);

    const onVerificationAttempt = (event: { integrationId: number }) => {
      if (event.integrationId !== integrationId) return;
      setWebhookTestStatus('verification_attempt');
    };
    const onVerified = (event: { integrationId: number }) => {
      if (event.integrationId !== integrationId) return;
      setWebhookTestStatus('verified');
      setIntegration(prev => (prev ? { ...prev, webhook_status: 'verified' } : prev));
    };
    const onVerificationFailed = (event: { integrationId: number; reason: string }) => {
      if (event.integrationId !== integrationId) return;
      setWebhookTestStatus('verification_failed');
      setWebhookTestReason(event.reason);
      setWebhookTesting(false);
    };
    const onSubscribed = (event: { integrationId: number }) => {
      if (event.integrationId !== integrationId) return;
      setWebhookTestStatus('subscribed');
      setWebhookTesting(false);
    };
    const onSubscriptionFailed = (event: { integrationId: number; reason: string }) => {
      if (event.integrationId !== integrationId) return;
      setWebhookTestStatus('subscription_failed');
      setWebhookTestReason(event.reason);
      setWebhookTesting(false);
    };

    channel.listen('.instagram.webhook.verification_attempt', onVerificationAttempt);
    channel.listen('.instagram.webhook.verified', onVerified);
    channel.listen('.instagram.webhook.verification_failed', onVerificationFailed);
    channel.listen('.instagram.webhook.subscribed', onSubscribed);
    channel.listen('.instagram.webhook.subscription_failed', onSubscriptionFailed);

    return () => {
      channel.stopListening('.instagram.webhook.verification_attempt');
      channel.stopListening('.instagram.webhook.verified');
      channel.stopListening('.instagram.webhook.verification_failed');
      channel.stopListening('.instagram.webhook.subscribed');
      channel.stopListening('.instagram.webhook.subscription_failed');
    };
  }, [webhookTesting, integrationId, companyId]);

  const handleSaveToken = async () => {
    if (!accessToken.trim()) return;

    setSaving(true);
    try {
      await api.put('/api/integrations/instagram/configure', {
        access_token: accessToken.trim(),
      });

      setAccessToken('');

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.instagram.token-saved-description'),
      });

      await fetchIntegration();
      onConfigurationSaved();
    } catch (error) {
      console.error('Error saving Instagram access token:', error);
      toast({
        title: t('integrations.configuration-failed'),
        description: t('integrations.configuration-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await api.post('/api/integrations/instagram/test-connection');
      setIntegration(response.data.integration);

      toast({
        title: t('integrations.instagram.connection-successful'),
        description: t('integrations.instagram.connection-successful-description'),
      });

      onConfigurationSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error testing Instagram connection:', error);

      const data = error?.response?.data;
      if (data?.integration) {
        setIntegration(data.integration);
      }

      toast({
        title: t('integrations.instagram.connection-failed'),
        description: data?.error || t('integrations.instagram.connection-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await api.post('/api/integrations/instagram/disconnect');
      setIntegration(response.data.integration);
      setAccessToken('');

      toast({
        title: t('integrations.instagram.disconnect-success'),
        description: t('integrations.instagram.disconnect-success-description'),
      });

      onConfigurationSaved();
    } catch (error) {
      console.error('Error disconnecting Instagram account:', error);
      toast({
        title: t('integrations.configuration-failed'),
        description: t('integrations.configuration-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTestWebhook = () => {
    setWebhookTestReason(null);
    setWebhookTestStatus('waiting');
    setWebhookTesting(true);
  };

  const handleStopWebhookTest = () => {
    setWebhookTesting(false);
    setWebhookTestStatus(null);
    setWebhookTestReason(null);
  };

  const handleDismissWebhookResult = () => {
    setWebhookTestStatus(null);
    setWebhookTestReason(null);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: t('integrations.instagram.copied'),
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setAccessToken('');
    }
    onOpenChange(next);
  };

  const isConnected = integration?.connection_status === 'connected';
  const isError = integration?.connection_status === 'error';

  const isWebhookListening =
    webhookTesting &&
    (webhookTestStatus === 'waiting' || webhookTestStatus === 'verification_attempt' || webhookTestStatus === 'verified');

  const webhookPhase: 'idle' | 'listening' | 'success' | 'failure' = isWebhookListening
    ? 'listening'
    : webhookTestStatus === 'subscribed'
      ? 'success'
      : webhookTestStatus === 'verification_failed' || webhookTestStatus === 'subscription_failed'
        ? 'failure'
        : 'idle';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
              <SiInstagram className="w-7 h-7 text-pink-500" />
            </div>
            {t('integrations.instagram.configure-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.instagram.configure-description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Connection Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_access_token" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {t('integrations.instagram.access-token-label')}
                </Label>
                <Input
                  id="instagram_access_token"
                  type="password"
                  placeholder={
                    integration?.has_access_token
                      ? t('integrations.instagram.access-token-placeholder-saved')
                      : t('integrations.instagram.access-token-placeholder')
                  }
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  disabled={saving}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t('integrations.instagram.access-token-description')}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveToken} disabled={!accessToken.trim() || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {saving ? t('integrations.instagram.saving-token') : t('integrations.instagram.save-token')}
                </Button>
                {integration?.has_access_token && (
                  <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {testing ? t('integrations.instagram.testing-connection') : t('integrations.instagram.test-connection')}
                  </Button>
                )}
                {integration?.has_access_token && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={disconnecting}
                      >
                        {disconnecting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        {disconnecting ? t('integrations.instagram.disconnecting') : t('integrations.instagram.disconnect-account')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('integrations.instagram.disconnect-confirm-title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('integrations.instagram.disconnect-confirm-description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnect}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('integrations.instagram.disconnect-confirm-action')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Connected account card */}
              {isConnected && (
                <div className="border border-border rounded-lg p-4 bg-card flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={integration?.profile_picture_url || undefined} alt={integration?.username || 'Instagram'} />
                    <AvatarFallback>
                      <SiInstagram className="w-5 h-5 text-pink-500" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {integration?.display_name || integration?.username}
                    </p>
                    {integration?.username && (
                      <p className="text-sm text-muted-foreground truncate">@{integration.username}</p>
                    )}
                  </div>
                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t('integrations.instagram.status-connected')}
                  </Badge>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>{t('integrations.instagram.connection-failed')}</AlertTitle>
                  <AlertDescription>
                    {t('integrations.instagram.connection-failed-description')}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Webhook Section - only after the account is connected */}
            {isConnected && integration && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Webhook className="w-4 h-4" />
                      {t('integrations.instagram.webhook-title')}
                    </h3>
                    {integration.webhook_status === 'verified' ? (
                      <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('integrations.instagram.webhook-status-verified')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('integrations.instagram.webhook-status-pending')}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {t('integrations.instagram.webhook-description')}
                  </p>

                  <div className="space-y-2">
                    <Label>{t('integrations.instagram.callback-url-label')}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={integration.webhook_callback_url} className="font-mono text-xs" />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(integration.webhook_callback_url)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('integrations.instagram.verify-token-label')}</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={integration.webhook_verify_token} className="font-mono text-xs" />
                      <Button type="button" variant="outline" size="icon" onClick={() => handleCopy(integration.webhook_verify_token)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">{t('integrations.instagram.webhook-instructions-title')}</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                      {t('integrations.instagram.webhook-instructions-description')}
                    </AlertDescription>
                  </Alert>

                  <AnimatePresence mode="wait">
                    {webhookPhase === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button type="button" variant="outline" onClick={handleTestWebhook}>
                          {t('integrations.instagram.test-webhook')}
                        </Button>
                      </motion.div>
                    )}

                    {/* Listening state - n8n-style ping/radar loader that shifts toward green as verification progresses */}
                    {webhookPhase === 'listening' && (
                      <motion.div
                        key="listening"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`flex flex-col items-center gap-4 rounded-lg border border-dashed px-4 py-8 transition-colors duration-500 ${
                          webhookTestStatus === 'verified'
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-primary/30 bg-primary/5'
                        }`}
                      >
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <span
                            className={`absolute inline-flex h-full w-full animate-ping rounded-full transition-colors duration-500 ${
                              webhookTestStatus === 'verified' ? 'bg-green-500/20' : 'bg-primary/20'
                            }`}
                          />
                          <span
                            className={`absolute inline-flex h-3/4 w-3/4 animate-ping rounded-full transition-colors duration-500 ${
                              webhookTestStatus === 'verified' ? 'bg-green-500/30' : 'bg-primary/30'
                            }`}
                            style={{ animationDelay: '300ms' }}
                          />
                          <span
                            className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-500 ${
                              webhookTestStatus === 'verified' ? 'bg-green-500' : 'bg-primary'
                            }`}
                          >
                            <Webhook className={`h-5 w-5 ${webhookTestStatus === 'verified' ? 'text-white' : 'text-primary-foreground'}`} />
                          </span>
                        </div>
                        <div className="space-y-1 text-center">
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={webhookTestStatus}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              transition={{ duration: 0.2 }}
                              className="font-medium text-foreground"
                            >
                              {webhookTestStatus === 'waiting' && t('integrations.instagram.webhook-waiting')}
                              {webhookTestStatus === 'verification_attempt' && t('integrations.instagram.webhook-verification-attempt')}
                              {webhookTestStatus === 'verified' && t('integrations.instagram.webhook-verified')}
                            </motion.p>
                          </AnimatePresence>
                          <p className="text-xs text-muted-foreground">
                            {t('integrations.instagram.webhook-listening-hint')}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleStopWebhookTest}>
                          <X className="mr-2 h-4 w-4" />
                          {t('integrations.instagram.stop-listening')}
                        </Button>
                      </motion.div>
                    )}

                    {/* Success state - celebratory pop animation */}
                    {webhookPhase === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col items-center gap-4 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-8"
                      >
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="absolute inline-flex h-full w-full rounded-full bg-green-500/30"
                          />
                          <motion.span
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.1 }}
                            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500"
                          >
                            <CheckCircle2 className="h-6 w-6 text-white" />
                          </motion.span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.25 }}
                          className="space-y-1 text-center"
                        >
                          <p className="font-medium text-foreground">
                            {t('integrations.instagram.webhook-subscribed')}
                          </p>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.25 }}
                        >
                          <Button type="button" variant="outline" size="sm" onClick={handleDismissWebhookResult}>
                            {t('common.close')}
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Failure state - subtle shake to draw attention */}
                    {webhookPhase === 'failure' && (
                      <motion.div
                        key="failure"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-8"
                      >
                        <motion.div
                          initial={{ x: 0 }}
                          animate={{ x: [0, -6, 6, -4, 4, 0] }}
                          transition={{ duration: 0.4, delay: 0.05 }}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15"
                        >
                          {webhookTestStatus === 'verification_failed' && <XCircle className="h-6 w-6 text-destructive" />}
                          {webhookTestStatus === 'subscription_failed' && <AlertTriangle className="h-6 w-6 text-destructive" />}
                        </motion.div>
                        <div className="space-y-1 text-center max-w-sm">
                          <p className="font-medium text-foreground">
                            {webhookTestStatus === 'verification_failed' && t('integrations.instagram.webhook-verification-failed')}
                            {webhookTestStatus === 'subscription_failed' && t('integrations.instagram.webhook-subscription-failed')}
                          </p>
                          {webhookTestReason && (
                            <p className="text-xs text-muted-foreground">{webhookTestReason}</p>
                          )}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleDismissWebhookResult}>
                          {t('integrations.instagram.test-again')}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstagramConfigModal;
