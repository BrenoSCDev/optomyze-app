/**
 * END CONVERSATION DIALOG
 *
 * Lets an agent close the chat's active ChatSession: pick a required closing
 * reason, optionally add internal notes, and confirm.
 */

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChatSession, ClosingReason } from '@/types/inbox';
import { fetchClosingReasons, closeChatSession, fetchClosingMessagePreview } from '@/services/chatSessionApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface EndConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: number;
  session: ChatSession;
  onClosed: (session: ChatSession) => void;
}

const EndConversationDialog: React.FC<EndConversationDialogProps> = ({
  open,
  onOpenChange,
  chatId,
  session,
  onClosed,
}) => {
  const { t } = useLanguage();
  const [reasons, setReasons] = useState<ClosingReason[]>([]);
  const [reasonId, setReasonId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [closingMessage, setClosingMessage] = useState('');
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReasonId('');
    setNotes('');
    setClosingMessage('');
    setLoadingReasons(true);
    fetchClosingReasons()
      .then(setReasons)
      .catch(() => {})
      .finally(() => setLoadingReasons(false));
  }, [open]);

  useEffect(() => {
    if (!reasonId) {
      setClosingMessage('');
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    fetchClosingMessagePreview(chatId, Number(reasonId))
      .then(preview => { if (!cancelled) setClosingMessage(preview ?? ''); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [chatId, reasonId]);

  const handleConfirm = async () => {
    if (!reasonId) return;
    setSubmitting(true);
    try {
      const updated = await closeChatSession(chatId, session.id, {
        closing_reason_id: Number(reasonId),
        notes: notes.trim() || undefined,
        closing_message: closingMessage.trim() || undefined,
      });
      onClosed(updated);
      onOpenChange(false);
      toast({ title: t('chat.inbox.conversation-ended') });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.response?.data?.message || '',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('chat.inbox.end-conversation')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('chat.inbox.closing-reason')} *</Label>
            <Select value={reasonId} onValueChange={setReasonId} disabled={loadingReasons}>
              <SelectTrigger>
                <SelectValue placeholder={t('chat.inbox.select-closing-reason')} />
              </SelectTrigger>
              <SelectContent>
                {reasons.map(reason => (
                  <SelectItem key={reason.id} value={String(reason.id)}>
                    {reason.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(loadingPreview || closingMessage) && (
            <div className="space-y-2">
              <Label>{t('chat.inbox.closing-message-to-send')}</Label>
              <Textarea
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
                disabled={loadingPreview}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t('chat.inbox.closing-message-hint')}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('chat.inbox.closing-notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('chat.inbox.closing-notes-placeholder')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!reasonId || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('chat.inbox.end-conversation-confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndConversationDialog;
