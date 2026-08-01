/**
 * CONNECTION STATUS MODAL
 *
 * Checks whether a WhatsApp Evolution instance is really connected by reading
 * Evolution's /instance/connectionState — this is the default way of verifying
 * a connection, no test message required. When connected, the paired WhatsApp
 * account (name / picture / number) is shown back to the user.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, RefreshCw, QrCode, AlertTriangle } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import api from '../../services/api';
import WhatsAppProfileCard, { WhatsAppProfile } from './WhatsAppProfileCard';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  status?: string;
}

export interface ConnectionStatusResponse {
  id: number;
  instance_name: string;
  status: string;
  connected: boolean;
  profile: WhatsAppProfile | null;
  message?: string | null;
}

interface ConnectionStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  onStatusChange?: (result: ConnectionStatusResponse) => void;
  onShowQrCode?: (instance: WhatsAppInstance) => void;
}

const ConnectionStatusModal: React.FC<ConnectionStatusModalProps> = ({
  open,
  onOpenChange,
  instance,
  onStatusChange,
  onShowQrCode,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<ConnectionStatusResponse | null>(null);

  const instanceId = instance?.id;

  // Kept in a ref so an inline parent callback doesn't retrigger the effect below.
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  const checkConnection = useCallback(async () => {
    if (!instanceId) return;

    setLoading(true);
    setError(false);

    try {
      const response = await api.get<ConnectionStatusResponse>(
        `/api/integrations/whatsapp-evo-instances/connection-status/${instanceId}`
      );
      setResult(response.data);
      onStatusChangeRef.current?.(response.data);
    } catch (err) {
      console.error('Error checking WhatsApp connection status:', err);
      setError(true);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (open && instanceId) {
      checkConnection();
    }
  }, [open, instanceId, checkConnection]);

  const handleClose = () => {
    setResult(null);
    setError(false);
    setLoading(false);
    onOpenChange(false);
  };

  const handleShowQrCode = () => {
    if (!instance) return;
    handleClose();
    onShowQrCode?.(instance);
  };

  if (!instance) return null;

  const connected = result?.connected === true;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="w-5 h-5 text-green-500" />
            {t('integrations.panel.connection.title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.panel.connection.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Instance Info */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t('integrations.panel.test.instance-name')}</p>
                <p className="font-medium truncate">{instance.instance_name}</p>
              </div>
              <Badge
                variant="secondary"
                className={
                  connected
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : result
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : ''
                }
              >
                {result?.status || instance.status || 'created'}
              </Badge>
            </div>
          </div>

          {/* Result area */}
          <div className="min-h-[120px] flex items-center justify-center">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-sm">{t('integrations.panel.connection.checking')}</p>
              </div>
            )}

            {!loading && error && (
              <div className="w-full flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-destructive">{t('integrations.panel.connection.error-title')}</p>
                  <p className="text-sm text-muted-foreground">{t('integrations.panel.connection.error-description')}</p>
                </div>
              </div>
            )}

            {!loading && !error && connected && (
              <div className="w-full space-y-3">
                <WhatsAppProfileCard profile={result?.profile} />
                <p className="text-sm text-muted-foreground">
                  {t('integrations.panel.connection.connected-description')}
                </p>
              </div>
            )}

            {!loading && !error && result && !connected && (
              <div className="w-full space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-orange-600 dark:text-orange-400">
                      {t('integrations.panel.connection.disconnected-title')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.message || t('integrations.panel.connection.disconnected-description')}
                    </p>
                  </div>
                </div>
                {onShowQrCode && (
                  <Button variant="outline" className="w-full" onClick={handleShowQrCode}>
                    <QrCode className="w-4 h-4" />
                    {t('integrations.panel.connection.show-qr')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.close')}
          </Button>
          <Button onClick={checkConnection} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t('integrations.panel.connection.recheck')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectionStatusModal;
