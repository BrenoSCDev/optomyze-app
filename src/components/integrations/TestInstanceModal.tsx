/**
 * TEST INSTANCE MODAL
 * 
 * Modal for testing WhatsApp Evolution API instances
 */

import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Info, Phone, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { toast } from '../../hooks/use-toast';
import api from '../../services/api';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
}

interface TestInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
}

const TestInstanceModal: React.FC<TestInstanceModalProps> = ({
  open,
  onOpenChange,
  instance
}) => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setPhoneNumber('');
    setMessage('');
    setSuccess(false);
    onOpenChange(false);
  };

  const handleSendTest = async () => {
    if (!instance || !phoneNumber.trim() || !message.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      await api.post(`/api/integrations/whatsapp-evo-instances/send-message/${instance.id}`, {
        number: phoneNumber.trim(),
        text: message.trim()
      });

      setSuccess(true);
      toast({
        title: t('integrations.panel.test.success-title'),
        description: t('integrations.panel.test.success-description'),
      });
    } catch (err) {
      console.error('Error sending test message:', err);
      toast({
        title: t('integrations.panel.test.error-title'),
        description: t('integrations.panel.test.error-description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = phoneNumber.trim() && message.trim();

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="w-5 h-5 text-green-500" />
            {t('integrations.panel.test.title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.panel.test.description')}
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

          {/* Success Message */}
          {success && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                {t('integrations.panel.test.success-message')}
              </AlertDescription>
            </Alert>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone-number" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('integrations.panel.test.phone-label')}
            </Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+5511999999999"
              type="tel"
              disabled={loading}
            />
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="test-message" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t('integrations.panel.test.message-label')}
            </Label>
            <Textarea
              id="test-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('integrations.panel.test.message-placeholder')}
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
              {t('integrations.panel.test.info-message')}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.close')}
          </Button>
          <Button onClick={handleSendTest} disabled={!isFormValid || loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('integrations.panel.test.send-test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestInstanceModal;
