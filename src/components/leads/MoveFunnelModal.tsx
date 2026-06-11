/**
 * MOVE FUNNEL MODAL
 *
 * Modal for moving a lead to a different funnel. The lead is placed
 * in the target funnel's entry stage.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FunnelOption {
  id: number;
  name: string;
}

interface MoveFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  funnels: FunnelOption[];
  onMoved: (leadId: string, funnelId: number) => void;
}

const MoveFunnelModal = ({ isOpen, onClose, leadId, funnels, onMoved }: MoveFunnelModalProps) => {
  const { t } = useLanguage();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFunnelId('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedFunnelId) return;
    try {
      setSubmitting(true);
      await leadService.moveLeadToFunnel(leadId, Number(selectedFunnelId));
      toast.success(t('lead-card.move-funnel-success'));
      onMoved(leadId, Number(selectedFunnelId));
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('lead-card.move-funnel-error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('lead-card.move-funnel-title')}</DialogTitle>
          <DialogDescription>{t('lead-card.move-funnel-description')}</DialogDescription>
        </DialogHeader>

        {funnels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('lead-card.no-other-funnels')}</p>
        ) : (
          <Select value={selectedFunnelId} onValueChange={setSelectedFunnelId}>
            <SelectTrigger>
              <SelectValue placeholder={t('lead-card.select-funnel')} />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              {funnels.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id.toString()}>
                  {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedFunnelId || submitting || funnels.length === 0}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveFunnelModal;
