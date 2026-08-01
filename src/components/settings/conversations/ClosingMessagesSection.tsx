import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MultiSelect from '@/components/ui/multi-select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, MessageSquareText } from 'lucide-react';
import {
  fetchClosingMessages,
  createClosingMessage,
  updateClosingMessage,
  deleteClosingMessage,
} from '@/services/closingMessageApi';
import { fetchClosingReasons } from '@/services/chatSessionApi';
import { ClosingMessage, ClosingReason } from '@/types/inbox';

const PLACEHOLDERS = ['{lead_name}', '{company_name}', '{agent_name}'];

const ClosingMessagesSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ClosingMessage[]>([]);
  const [reasons, setReasons] = useState<ClosingReason[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClosingMessage | null>(null);
  const [formName, setFormName] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formReasons, setFormReasons] = useState<{ id: number; name: string }[]>([]);
  const [formSaving, setFormSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClosingMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [messagesData, reasonsData] = await Promise.all([
        fetchClosingMessages(),
        fetchClosingReasons(true),
      ]);
      setMessages(messagesData);
      setReasons(reasonsData);
    } catch (error) {
      console.error('Failed to load closing messages:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-messages.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setEditing(null);
    setFormName('');
    setFormMessage('');
    setFormReasons([]);
    setFormOpen(true);
  };

  const openEditForm = (message: ClosingMessage) => {
    setEditing(message);
    setFormName(message.name);
    setFormMessage(message.message);
    setFormReasons(message.closing_reasons.map(r => ({ id: r.id, name: r.name })));
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formMessage.trim()) return;
    try {
      setFormSaving(true);
      const payload = {
        name: formName.trim(),
        message: formMessage.trim(),
        closing_reason_ids: formReasons.map(r => r.id),
      };
      if (editing) {
        await updateClosingMessage(editing.id, payload);
      } else {
        await createClosingMessage(payload);
      }
      toast({ title: t('common.success'), description: t('settings.conversations.closing-messages.save-success') });
      setFormOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save closing message:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-messages.save-error'), variant: 'destructive' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteClosingMessage(deleteTarget.id);
      toast({ title: t('common.success'), description: t('settings.conversations.closing-messages.delete-success') });
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete closing message:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-messages.delete-error'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.conversations.closing-messages.description')}</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          {t('settings.conversations.closing-messages.new')}
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg bg-background/50">
          <MessageSquareText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('settings.conversations.closing-messages.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(message => (
            <Card key={message.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{message.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message.message}</p>
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      {message.closing_reasons.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">{t('settings.conversations.closing-messages.no-reasons')}</span>
                      ) : (
                        message.closing_reasons.map(r => (
                          <Badge key={r.id} variant="outline" className="text-[10px] px-1.5 py-0">{r.name}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(message)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(message)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-dark">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('settings.conversations.closing-messages.edit') : t('settings.conversations.closing-messages.new')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t('common.name')} *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.conversations.closing-messages.message-label')} *</Label>
              <Textarea
                value={formMessage}
                onChange={e => setFormMessage(e.target.value)}
                rows={3}
                placeholder={t('settings.conversations.welcome.message-placeholder')}
              />
              <div className="flex gap-1.5 flex-wrap">
                {PLACEHOLDERS.map(p => (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px] font-mono"
                    onClick={() => setFormMessage(prev => `${prev}${p}`)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.conversations.closing-messages.reasons-label')}</Label>
              <MultiSelect
                options={reasons.map(r => ({ id: r.id, name: r.name }))}
                selected={formReasons}
                onChange={setFormReasons}
                placeholder={t('settings.conversations.closing-messages.reasons-placeholder')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={formSaving || !formName.trim() || !formMessage.trim()}>
              {formSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.conversations.closing-messages.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.conversations.closing-messages.delete-desc')} <strong>{deleteTarget?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClosingMessagesSection;
