import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Key, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
  funnel_id?: number;
  funnel?: {
    id: number;
    name: string;
  };
}

interface CredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  open,
  onOpenChange,
  instance,
}) => {
  const { t } = useLanguage();
  const [apiToken, setApiToken] = useState('');

  const handleClose = () => {
    setApiToken('');
    onOpenChange(false);
  };

  const handleSave = () => {
    // Not functional yet - just close the modal
    handleClose();
  };

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {t('integrations.panel.credentials.title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.panel.credentials.description')} <strong>{instance.instance_name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('integrations.panel.credentials.purpose-title')}</AlertTitle>
            <AlertDescription>
              {t('integrations.panel.credentials.purpose-description')}
            </AlertDescription>
          </Alert>

          <Alert variant="default" className="border-primary/50 bg-primary/5">
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>{t('integrations.panel.credentials.token-notice-title')}</AlertTitle>
            <AlertDescription>
              {t('integrations.panel.credentials.token-notice-description')}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="api-token">{t('integrations.panel.credentials.api-token-label')}</Label>
            <Input
              id="api-token"
              type="password"
              placeholder={t('integrations.panel.credentials.api-token-placeholder')}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {t('integrations.panel.credentials.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!apiToken.trim()}>
            {t('integrations.panel.credentials.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CredentialsModal;
