import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { lostReasonApi, LostReason } from '@/services/lostReasonApi';
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

interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

const LostReasonModal = ({ isOpen, onClose, leadId }: LostReasonModalProps) => {
  const { t } = useLanguage();
  const [reasons, setReasons] = useState<LostReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedReasonId('');
      setLoading(true);
      lostReasonApi.list()
        .then(data => setReasons(data))
        .catch(() => setReasons([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedReasonId) return;
    try {
      setSubmitting(true);
      await leadService.submitLostReason(leadId, Number(selectedReasonId));
      toast.success(t('leads.lost-reason.recorded'));
      onClose();
    } catch {
      toast.error(t('leads.lost-reason.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // If no reasons configured, don't show modal
  if (!loading && reasons.length === 0) {
    if (isOpen) onClose();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('leads.lost-reason.title')}</DialogTitle>
          <DialogDescription>{t('leads.lost-reason.description')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
            <SelectTrigger>
              <SelectValue placeholder={t('leads.lost-reason.select-placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {reasons.map(reason => (
                <SelectItem key={reason.id} value={reason.id.toString()}>
                  {reason.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('leads.lost-reason.skip')}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedReasonId || submitting || loading}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LostReasonModal;
