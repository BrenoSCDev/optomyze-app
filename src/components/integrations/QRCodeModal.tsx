/**
 * QR CODE MODAL
 * 
 * Modal for generating and displaying WhatsApp Evolution API QR codes
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Loader2, RefreshCw, Info, Smartphone } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import api from '../../services/api';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
}

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
}

interface QRCodeResponse {
  pairingCode: string | null;
  code: string;
  base64: string;
  count: number;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  open,
  onOpenChange,
  instance
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);

  useEffect(() => {
    if (open && instance) {
      fetchQRCode();
    }
  }, [open, instance]);

  const fetchQRCode = async () => {
    if (!instance) return;
    
    setLoading(true);
    setError(false);
    setQrData(null);
    
    try {
      const response = await api.get(`/api/integrations/whatsapp-evo-instances/qrcode/${instance.id}`);
      setQrData(response.data);
    } catch (err) {
      console.error('Error fetching QR code:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQrData(null);
    setError(false);
    setLoading(false);
    onOpenChange(false);
  };

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="w-5 h-5 text-green-500" />
            {t('integrations.panel.qrcode.title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.panel.qrcode.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Instance Info */}
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('integrations.panel.test.instance-name')}</p>
                <p className="font-medium">{instance.instance_name}</p>
              </div>
              <Badge variant="secondary">
                {instance.status || 'created'}
              </Badge>
            </div>
          </div>

          {/* Instructions */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Smartphone className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('integrations.panel.qrcode.instructions')}
            </p>
          </div>

          {/* QR Code Display Area */}
          <div className="flex items-center justify-center min-h-[280px] border border-border rounded-lg bg-background">
            {loading && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-sm">{t('integrations.panel.qrcode.loading')}</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center gap-4 text-center px-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <SiWhatsapp className="w-6 h-6 text-destructive" />
                </div>
                <p className="text-sm text-destructive font-medium">
                  {t('integrations.panel.qrcode.error')}
                </p>
                <Button variant="outline" size="sm" onClick={fetchQRCode}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('integrations.panel.qrcode.retry')}
                </Button>
              </div>
            )}

            {qrData && !loading && !error && (
              <div className="p-4">
                <img 
                  src={qrData.base64} 
                  alt="WhatsApp QR Code" 
                  className="w-64 h-64 object-contain mx-auto"
                />
              </div>
            )}
          </div>

          {/* Post-Connection Info */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
              {t('integrations.panel.qrcode.post-connection-info')}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
