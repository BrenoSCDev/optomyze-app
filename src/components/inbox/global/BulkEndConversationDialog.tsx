/**
 * BULK END CONVERSATION DIALOG
 *
 * Closes the open session on every selected conversation under one closing
 * reason.
 *
 * Differs from the single-chat dialog in one way that matters: there is no
 * editable closing message. That dialog previews the exact text because it is
 * going to one known contact; here the same template would be rendered per
 * contact, so what the sender would be editing is a template rather than a
 * message. Sending is therefore a deliberate opt-in that states how many
 * people would receive one, and is off until asked for.
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClosingReason } from '@/types/inbox';
import { fetchClosingReasons } from '@/services/chatSessionApi';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many conversations the action covers, for the copy. */
  count: number;
  submitting: boolean;
  onConfirm: (input: { closingReasonId: number; notes?: string; sendClosingMessage: boolean }) => void;
}

const BulkEndConversationDialog: React.FC<Props> = ({
  open, onOpenChange, count, submitting, onConfirm,
}) => {
  const { t } = useLanguage();
  const [reasons, setReasons] = useState<ClosingReason[]>([]);
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [sendClosingMessage, setSendClosingMessage] = useState(false);
  const [loadingReasons, setLoadingReasons] = useState(false);

  useEffect(() => {
    if (!open) return;

    setReasonId('');
    setNotes('');
    // Re-armed every time the dialog opens: consent to message a batch of
    // customers should not carry over from the last batch.
    setSendClosingMessage(false);

    setLoadingReasons(true);
    fetchClosingReasons()
      .then(setReasons)
      .catch(() => {})
      .finally(() => setLoadingReasons(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('chat.inbox.bulk.end-title')}</DialogTitle>
          <DialogDescription>
            {t('chat.inbox.bulk.end-description').replace('{count}', String(count))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t('chat.inbox.closing-reason')} *</Label>
            <Select value={reasonId} onValueChange={setReasonId} disabled={loadingReasons || submitting}>
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

          <div className="space-y-2">
            <Label>{t('chat.inbox.closing-notes')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('chat.inbox.closing-notes-placeholder')}
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Outward-facing and irreversible, so it reads as a warning rather
              than another checkbox, and says how many people it reaches. */}
          <label className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <Checkbox
              checked={sendClosingMessage}
              onCheckedChange={(v) => setSendClosingMessage(v === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <span className="space-y-1">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                {t('chat.inbox.bulk.send-closing-message')}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t('chat.inbox.bulk.send-closing-message-hint').replace('{count}', String(count))}
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => onConfirm({
              closingReasonId: Number(reasonId),
              notes: notes.trim() || undefined,
              sendClosingMessage,
            })}
            disabled={!reasonId || submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('chat.inbox.end-conversation-confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEndConversationDialog;
