import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { Loader2, Key, Globe, Info } from 'lucide-react';
import { SiWhatsapp } from "react-icons/si";

interface WhatsAppConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const [formData, setFormData] = useState({
    base_url: '',
    api_key: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateUrl = (url: string, fieldName: string): boolean => {
    if (!url) return true;

    try {
      new URL(url);
      return true;
    } catch {
      toast({
        title: t('common.error'),
        description: `${t('integrations.whatsapp-evo.invalid-url')} ${fieldName}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.base_url.trim() || !formData.api_key.trim()) {
      toast({
        title: t('common.error'),
        description: t('integrations.whatsapp-evo.fill-required-fields'),
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(formData.base_url, "Base URL")) {
      return;
    }

    setLoading(true);
    
    try {
      await api.put('/api/integrations/whatsapp-evo-integrations/configure', {
        base_url: formData.base_url,
        api_key: formData.api_key,
      });

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.whatsapp-evo.configuration-success-description'),
      });

      onConfigurationSaved();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        base_url: '',
        api_key: '',
      });

    } catch (error) {
      console.error('Error configuring WhatsApp Evolution API integration:', error);
      toast({
        title: t('integrations.configuration-failed'),
        description: t('integrations.configuration-failed-description'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFormData({
      base_url: '',
      api_key: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <SiWhatsapp className="w-8 h-8 text-green-500" />
            </div>
            {t('integrations.whatsapp-evo.configure-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.whatsapp-evo.configure-description')}
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert - Evolution API Notice */}
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-500">{t('integrations.whatsapp-evo.warning-title')}</AlertTitle>
          <AlertDescription className="text-blue-400/80">
            {t('integrations.whatsapp-evo.warning-description')}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Base URL Field */}
            <div className="space-y-2">
              <Label htmlFor="base_url" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('integrations.whatsapp-evo.base-url')}
              </Label>
              <Input
                id="base_url"
                type="url"
                placeholder={t('integrations.whatsapp-evo.base-url-placeholder')}
                value={formData.base_url}
                onChange={(e) => handleInputChange('base_url', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.whatsapp-evo.base-url-description')}
              </p>
            </div>

            {/* API Key Field */}
            <div className="space-y-2">
              <Label htmlFor="api_key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('integrations.whatsapp-evo.api-key')}
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder={t('integrations.whatsapp-evo.api-key-placeholder')}
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.whatsapp-evo.api-key-description')}
              </p>
            </div>
          </div>

          {/* Info Alert - Next Steps */}
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">{t('integrations.whatsapp-evo.next-steps-title')}</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              {t('integrations.whatsapp-evo.next-steps-description')}
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? t('integrations.whatsapp-evo.saving-configuration') : t('integrations.whatsapp-evo.save-configuration')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppConfigModal;
