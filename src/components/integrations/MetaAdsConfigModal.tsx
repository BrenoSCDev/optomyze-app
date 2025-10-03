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
import { Loader2, Key, Hash } from 'lucide-react';
import { FaMeta } from "react-icons/fa6";

interface MetaAdsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigurationSaved: () => void;
}

const MetaAdsConfigModal: React.FC<MetaAdsConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigurationSaved,
}) => {
  const [formData, setFormData] = useState({
    account_id: '',
    access_token: '',
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
    
    if (!formData.account_id.trim() || !formData.access_token.trim()) {
      toast({
        title: t('common.error'),
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await api.put('/api/integrations/meta-ads/configure', {
        account_id: formData.account_id,
        access_token: formData.access_token,
      });

      toast({
        title: t('integrations.configuration-successful'),
        description: "Meta Ads integration has been configured successfully!",
      });

      onConfigurationSaved();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        account_id: '',
        access_token: '',
      });

    } catch (error) {
      console.error('Error configuring Meta Ads integration:', error);
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
      account_id: '',
      access_token: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FaMeta className="w-8 h-8 text-primary" />
            </div>
            Configure Meta Ads Integration
          </DialogTitle>
          <DialogDescription>
            Enter your Meta Ads account credentials to connect your advertising account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Account ID Field */}
            <div className="space-y-2">
              <Label htmlFor="account_id" className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Account ID
              </Label>
              <Input
                id="account_id"
                type="text"
                placeholder="act_1234567890"
                value={formData.account_id}
                onChange={(e) => handleInputChange('account_id', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your Meta Ads account ID (e.g., act_1234567890)
              </p>
            </div>

            {/* Access Token Field */}
            <div className="space-y-2">
              <Label htmlFor="access_token" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Access Token
              </Label>
              <Input
                id="access_token"
                type="password"
                placeholder="Enter your Meta access token"
                value={formData.access_token}
                onChange={(e) => handleInputChange('access_token', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your Meta Ads API access token for authentication
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
              {loading ? 'Saving Configuration...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MetaAdsConfigModal;
