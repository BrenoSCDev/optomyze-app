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
import api from '../../services/api';
import { Loader2, Key, Webhook } from 'lucide-react';
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
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.api_key.trim() || !formData.webhook_url.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.webhook_url);
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid webhook URL.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await api.put('/api/integrations/n8n-integrations/configure', {
        webhook_url: formData.webhook_url,
        api_key: formData.api_key,
      });

      toast({
        title: "Configuration Saved",
        description: "n8n integration has been configured successfully!",
      });

      onConfigurationSaved();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        api_key: '',
        webhook_url: '',
      });

    } catch (error) {
      console.error('Error configuring n8n integration:', error);
      toast({
        title: "Configuration Failed",
        description: "Failed to configure n8n integration. Please try again.",
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
            Configure n8n Integration
          </DialogTitle>
          <DialogDescription>
            Enter your n8n API credentials to connect your workflow automation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* API Key Field */}
            <div className="space-y-2">
              <Label htmlFor="api_key" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </Label>
              <Input
                id="api_key"
                type="password"
                placeholder="sk_test_1234567890abcdef"
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Your n8n API key for authentication
              </p>
            </div>

            {/* Webhook URL Field */}
            <div className="space-y-2">
              <Label htmlFor="webhook_url" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                Webhook URL
              </Label>
              <Input
                id="webhook_url"
                type="url"
                placeholder="https://mycrm.com/hooks/n8n-12345"
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default N8nConfigModal;