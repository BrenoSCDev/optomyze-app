/**
 * FUNNEL SELECTION MODAL - Associate WhatsApp instance with CRM funnel
 * 
 * Modal for selecting a funnel to automatically create leads from WhatsApp messages.
 */

import React, { useState } from 'react';
import { Info, GitBranch } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
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

interface Funnel {
  id: number;
  name: string;
}

interface WhatsAppInstance {
  instance_name: string;
  id: number;
  created_at: string;
  status?: string;
}

interface FunnelSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppInstance | null;
  funnels: Funnel[];
}

const FunnelSelectionModal: React.FC<FunnelSelectionModalProps> = ({
  open,
  onOpenChange,
  instance,
  funnels,
}) => {
  const { t } = useLanguage();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [showValidation, setShowValidation] = useState(false);

  const handleClose = () => {
    setSelectedFunnelId('');
    setShowValidation(false);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (!selectedFunnelId) {
      setShowValidation(true);
      return;
    }
    
    // UI-ready only - no API call yet
    // In the future, this will send the association to the backend
    console.log('Funnel association:', {
      instanceId: instance?.id,
      funnelId: selectedFunnelId,
    });
    
    handleClose();
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
          <div className="space-y-2">
            <Label htmlFor="funnel-select">{t('integrations.panel.funnel.select-label')}</Label>
            <Select value={selectedFunnelId} onValueChange={handleFunnelChange}>
              <SelectTrigger 
                id="funnel-select" 
                className={`w-full bg-background ${showValidation && !selectedFunnelId ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder={t('integrations.panel.funnel.select-placeholder')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
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
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedFunnelId}
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FunnelSelectionModal;
