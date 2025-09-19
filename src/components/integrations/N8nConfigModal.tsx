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
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';
import { Loader2, Key, Webhook, Globe } from 'lucide-react';
import { SiN8N } from "react-icons/si";

interface N8nConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const N8nConfigModal: React.FC<N8nConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const [formData, setFormData] = useState({
    api_key: '',
    webhook_url: '',
    base_url: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.api_key.trim() || !formData.webhook_url.trim() || !formData.base_url.trim()) {
      toast({
        title: t('common.error'),
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.webhook_url);
      new URL(formData.base_url);
    } catch {
      toast({
        title: t('common.error'),
        description: "Please enter valid URLs for webhook and base URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await api.put('/api/integrations/n8n-integrations/configure', {
        webhook_url: formData.webhook_url,
        api_key: formData.api_key,
        base_url: formData.base_url,
      });

      toast({
        title: t('integrations.configuration-successful'),
        description: "n8n integration has been configured successfully!",
      });

      onConfigurationSaved();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        api_key: '',
        webhook_url: '',
        base_url: '',
      });

    } catch (error) {
      console.error('Error configuring n8n integration:', error);
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
      api_key: '',
      webhook_url: '',
      base_url: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <SiN8N className="w-8 h-8 text-primary" />
            </div>
            {t('integrations.n8n.configure-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.n8n.configure-description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* API Key Field */}
            <div className="space-y-2">
              <Label htmlFor="api_key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('integrations.n8n.api-key')}
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder={t('integrations.n8n.api-key-placeholder')}
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your n8n API key for authentication
              </p>
            </div>

            {/* Base URL Field */}
            <div className="space-y-2">
              <Label htmlFor="base_url" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Base URL
              </Label>
              <Input
                id="base_url"
                type="url"
                placeholder="https://your-n8n-instance.com"
                value={formData.base_url}
                onChange={(e) => handleInputChange('base_url', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The base URL of your n8n instance
              </p>
            </div>

            {/* Webhook URL Field */}
            <div className="space-y-2">
              <Label htmlFor="webhook_url" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                {t('integrations.n8n.webhook-url')}
              </Label>
              <Input
                id="webhook_url"
                type="url"
                placeholder={t('integrations.n8n.webhook-url-placeholder')}
                value={formData.webhook_url}
                onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The webhook endpoint where n8n will send data
              </p>
            </div>
          </div>

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
              {loading ? t('integrations.n8n.saving-configuration') : t('integrations.n8n.save-configuration')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default N8nConfigModal;