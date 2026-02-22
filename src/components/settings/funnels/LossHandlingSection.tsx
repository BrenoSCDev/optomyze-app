import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Check, X, Pencil, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { lostReasonApi, LostReason } from '@/services/lostReasonApi';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const LossHandlingSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reasons, setReasons] = useState<LostReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReason, setNewReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingReason, setDeletingReason] = useState<LostReason | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadReasons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await lostReasonApi.list();
      setReasons(data);
    } catch {
      toast({ title: t('common.error'), description: t('settings.funnels.lost-reasons.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const handleAdd = async () => {
    if (!newReason.trim()) return;
    try {
      setAdding(true);
      const created = await lostReasonApi.create({ description: newReason.trim() });
      setReasons(prev => [...prev, created]);
      setNewReason('');
      toast({ title: t('common.success'), description: t('settings.funnels.lost-reasons.added') });
    } catch {
      toast({ title: t('common.error'), description: t('settings.funnels.lost-reasons.add-error'), variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (reason: LostReason) => {
    setEditingId(reason.id);
    setEditingValue(reason.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingValue.trim()) return;
    try {
      setSavingId(editingId);
      const updated = await lostReasonApi.update(editingId, { description: editingValue.trim() });
      setReasons(prev => prev.map(r => r.id === editingId ? updated : r));
      setEditingId(null);
      setEditingValue('');
      toast({ title: t('common.success'), description: t('settings.funnels.lost-reasons.updated') });
    } catch {
      toast({ title: t('common.error'), description: t('settings.funnels.lost-reasons.update-error'), variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingReason) return;
    try {
      setDeleting(true);
      await lostReasonApi.delete(deletingReason.id);
      setReasons(prev => prev.filter(r => r.id !== deletingReason.id));
      toast({ title: t('common.success'), description: t('settings.funnels.lost-reasons.deleted') });
    } catch {
      toast({ title: t('common.error'), description: t('settings.funnels.lost-reasons.delete-error'), variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeletingReason(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm text-muted-foreground">
        {t('settings.funnels.lost-reasons.description')}
      </Label>

      {/* Reasons list */}
      <div className="space-y-2">
        {reasons.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {t('settings.funnels.lost-reasons.empty')}
          </p>
        )}
        {reasons.map((reason) => (
          <div key={reason.id} className="flex items-center gap-2 group">
            {editingId === reason.id ? (
              <>
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1"
                  autoFocus
                  disabled={savingId === reason.id}
                />
                <Button variant="ghost" size="icon" onClick={handleSaveEdit} disabled={savingId === reason.id || !editingValue.trim()}>
                  {savingId === reason.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-primary" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={cancelEdit} disabled={savingId === reason.id}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </>
            ) : (
              <>
                <span
                  className="flex-1 text-sm py-2 px-3 rounded-md border border-transparent hover:border-input cursor-pointer transition-colors"
                  onClick={() => startEdit(reason)}
                  title={t('settings.funnels.lost-reasons.click-to-edit')}
                >
                  {reason.description}
                </span>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => startEdit(reason)}>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeletingReason(reason)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new reason */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder={t('settings.funnels.lost-reasons.add-placeholder')}
          className="flex-1"
          disabled={adding}
        />
        <Button variant="outline" size="icon" onClick={handleAdd} disabled={adding || !newReason.trim()}>
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingReason} onOpenChange={(open) => !open && setDeletingReason(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.funnels.lost-reasons.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {`${t('settings.funnels.lost-reasons.delete-confirm')} "${deletingReason?.description || ''}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LossHandlingSection;
