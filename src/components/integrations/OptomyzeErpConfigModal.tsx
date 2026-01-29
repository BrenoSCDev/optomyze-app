/**
 * OPTOMYZE ERP CONFIGURATION MODAL
 * 
 * Modal for configuring Optomyze ERP integration credentials.
 * Sends API key via PUT request to /api/integrations/optomyze-erp/configure
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import { Key, Loader2, Eye, EyeOff } from 'lucide-react';
import OptoIcon from '@/assets/opto-icon.png';

interface OptomyzeErpConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved?: () => void;
}

const OptomyzeErpConfigModal: React.FC<OptomyzeErpConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: t('integrations.error') || 'Error',
        description: t('integrations.api-key-required') || 'API Key is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      await api.put('/api/integrations/optomyze-erp/configure', {
        api_key: apiKey.trim()
      });

      toast({
        title: t('integrations.configuration-saved') || 'Configuration Saved',
        description: t('integrations.erp-configured-successfully') || 'Optomyze ERP has been configured successfully.',
      });

      setApiKey('');
      onOpenChange(false);
      onConfigurationSaved?.();
    } catch (error: any) {
      console.error('Error configuring Optomyze ERP:', error);
      toast({
        title: t('integrations.configuration-failed') || 'Configuration Failed',
        description: error.response?.data?.message || t('integrations.failed-to-save') || 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setApiKey('');
      setShowApiKey(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <img src={OptoIcon} alt="Optomyze" className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>{t('integrations.configure-erp') || 'Configure Optomyze ERP'}</DialogTitle>
              <DialogDescription>
                {t('integrations.erp-config-description') || 'Enter your Optomyze ERP API key to connect your account.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              {t('integrations.api-key') || 'API Key'}
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('integrations.enter-api-key') || 'Enter your API key'}
                className="pr-10"
                disabled={saving}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={saving}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('integrations.api-key-hint') || 'You can find your API key in your Optomyze ERP account settings.'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving') || 'Saving...'}
              </>
            ) : (
              t('common.save') || 'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OptomyzeErpConfigModal;
