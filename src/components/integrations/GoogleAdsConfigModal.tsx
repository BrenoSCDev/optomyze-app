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
import { Loader2, Key, Hash, User, Webhook } from 'lucide-react';
import { SiGoogleads } from 'react-icons/si';

interface GoogleAdsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const GoogleAdsConfigModal: React.FC<GoogleAdsConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    manager_id: '',
    developer_token: '',
    webhook_url: '',
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
    
    if (!formData.customer_id.trim() || !formData.manager_id.trim() || 
        !formData.developer_token.trim() || !formData.webhook_url.trim()) {
      toast({
        title: t('common.error'),
        description: t('integrations.google-ads.fill-required-fields'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await api.put('/api/integrations/google-ads/configure', {
        customer_id: formData.customer_id,
        manager_id: formData.manager_id,
        developer_token: formData.developer_token,
        webhook_url: formData.webhook_url,
      });

      toast({
        title: t('integrations.configuration-successful'),
        description: t('integrations.google-ads.configuration-success-description'),
      });

      onConfigurationSaved();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        customer_id: '',
        manager_id: '',
        developer_token: '',
        webhook_url: '',
      });

    } catch (error) {
      console.error('Error configuring Google Ads integration:', error);
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
      customer_id: '',
      manager_id: '',
      developer_token: '',
      webhook_url: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <SiGoogleads className="w-8 h-8 text-primary" />
            </div>
            {t('integrations.google-ads.configure-title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.google-ads.configure-description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Customer ID Field */}
            <div className="space-y-2">
              <Label htmlFor="customer_id" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                {t('integrations.google-ads.customer-id')}
              </Label>
              <Input
                id="customer_id"
                type="text"
                placeholder={t('integrations.google-ads.customer-id-placeholder')}
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.google-ads.customer-id-description')}
              </p>
            </div>

            {/* Manager ID Field */}
            <div className="space-y-2">
              <Label htmlFor="manager_id" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('integrations.google-ads.manager-id')}
              </Label>
              <Input
                id="manager_id"
                type="text"
                placeholder={t('integrations.google-ads.manager-id-placeholder')}
                value={formData.manager_id}
                onChange={(e) => handleInputChange('manager_id', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.google-ads.manager-id-description')}
              </p>
            </div>

            {/* Developer Token Field */}
            <div className="space-y-2">
              <Label htmlFor="developer_token" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('integrations.google-ads.developer-token')}
              </Label>
              <Input
                id="developer_token"
                type="password"
                placeholder={t('integrations.google-ads.developer-token-placeholder')}
                value={formData.developer_token}
                onChange={(e) => handleInputChange('developer_token', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.google-ads.developer-token-description')}
              </p>
            </div>

            {/* Webhook URL Field */}
            <div className="space-y-2">
              <Label htmlFor="webhook_url" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                {t('integrations.google-ads.webhook-url')}
              </Label>
              <Input
                id="webhook_url"
                type="url"
                placeholder={t('integrations.google-ads.webhook-url-placeholder')}
                value={formData.webhook_url}
                onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('integrations.google-ads.webhook-url-description')}
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
              {loading ? t('integrations.google-ads.saving-configuration') : t('integrations.google-ads.save-configuration')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleAdsConfigModal;