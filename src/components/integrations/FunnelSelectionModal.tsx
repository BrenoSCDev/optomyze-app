/**
 * FUNNEL SELECTION MODAL - Associate WhatsApp instance with CRM funnel
 * 
 * Modal for selecting a funnel to automatically create leads from WhatsApp messages.
 */

import React, { useState } from 'react';
import { Info, GitBranch, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Label } from '../ui/label';
import api from '../../services/api';

interface Funnel {
  id: number;
  name: string;
}

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

interface FunnelSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  funnels: Funnel[];
  onFunnelUpdated?: (instanceId: number, funnelId: number) => void;
}

const FunnelSelectionModal: React.FC<FunnelSelectionModalProps> = ({
  open,
  onOpenChange,
  instance,
  funnels,
  onFunnelUpdated,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-select the current funnel when modal opens
  React.useEffect(() => {
    if (open && instance?.funnel_id) {
      setSelectedFunnelId(String(instance.funnel_id));
    } else if (!open) {
      setSelectedFunnelId('');
      setShowValidation(false);
    }
  }, [open, instance?.funnel_id]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!selectedFunnelId) {
      setShowValidation(true);
      return;
    }

    if (!instance) return;

    setIsSaving(true);
    try {
      await api.put(`/api/integrations/whatsapp-evo-integrations/${instance.id}/funnel`, {
        funnel_id: parseInt(selectedFunnelId, 10),
      });

      toast({
        title: t('integrations.panel.funnel.success-title'),
        description: t('integrations.panel.funnel.success-description'),
      });

      onFunnelUpdated?.(instance.id, parseInt(selectedFunnelId, 10));
      handleClose();
    } catch (error) {
      console.error('Error associating funnel:', error);
      toast({
        title: t('integrations.panel.funnel.error-title'),
        description: t('integrations.panel.funnel.error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFunnelChange = (value: string) => {
    setSelectedFunnelId(value);
    setShowValidation(false);
  };

  if (!instance) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-thin bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            {t('integrations.panel.funnel.title')}
          </DialogTitle>
          <DialogDescription>
            {t('integrations.panel.funnel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Instance Info */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              {t('integrations.panel.test.instance-name')}
            </p>
            <p className="font-medium text-foreground">{instance.instance_name}</p>
          </div>

          {/* Funnel Selector */}
          <div className="space-y-2 z-100">
            <Label htmlFor="funnel-select">{t('integrations.panel.funnel.select-label')}</Label>
            <Select value={selectedFunnelId} onValueChange={handleFunnelChange}>
              <SelectTrigger 
                id="funnel-select" 
                className={`w-full bg-background ${showValidation && !selectedFunnelId ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder={t('integrations.panel.funnel.select-placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={String(funnel.id)}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showValidation && !selectedFunnelId && (
              <p className="text-sm text-destructive">
                {t('integrations.panel.funnel.validation-error')}
              </p>
            )}
          </div>

          {/* Info Message */}
          <Alert className="border-blue-500/30 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-foreground">
              {t('integrations.panel.funnel.info-message')}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedFunnelId || isSaving}
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FunnelSelectionModal;
