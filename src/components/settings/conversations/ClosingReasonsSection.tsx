import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, ListChecks } from 'lucide-react';
import {
  fetchClosingReasons,
  createClosingReason,
  updateClosingReason,
  deleteClosingReason,
  reorderClosingReasons,
} from '@/services/chatSessionApi';
import { ClosingReason, ClosingReasonOutcome } from '@/types/inbox';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const OUTCOME_BADGE: Record<ClosingReasonOutcome, string> = {
  won: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
  lost: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const SortableReasonRow = ({
  reason,
  onEdit,
  onDelete,
}: {
  reason: ClosingReason;
  onEdit: (r: ClosingReason) => void;
  onDelete: (r: ClosingReason) => void;
}) => {
  const { t } = useLanguage();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: reason.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{reason.name}</span>
          {reason.outcome && (
            <Badge variant="outline" className={`text-[10px] capitalize ${OUTCOME_BADGE[reason.outcome]}`}>
              {t(`settings.conversations.closing-reasons.outcome.${reason.outcome}`)}
            </Badge>
          )}
          {!reason.is_active && (
            <Badge variant="secondary" className="text-[10px]">{t('common.inactive')}</Badge>
          )}
        </div>
        {reason.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{reason.description}</p>
        )}
        {reason.closing_messages && reason.closing_messages.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {reason.closing_messages.map(m => (
              <Badge key={m.id} variant="outline" className="text-[10px] px-1.5 py-0">{m.name}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(reason)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(reason)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const ClosingReasonsSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [reasons, setReasons] = useState<ClosingReason[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClosingReason | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOutcome, setFormOutcome] = useState<ClosingReasonOutcome>('neutral');
  const [formSaving, setFormSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ClosingReason | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadReasons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClosingReasons(true);
      setReasons(data);
    } catch (error) {
      console.error('Failed to load closing reasons:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-reasons.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadReasons();
  }, [loadReasons]);

  const openCreateForm = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setFormActive(true);
    setFormOutcome('neutral');
    setFormOpen(true);
  };

  const openEditForm = (reason: ClosingReason) => {
    setEditing(reason);
    setFormName(reason.name);
    setFormDescription(reason.description ?? '');
    setFormActive(reason.is_active ?? true);
    setFormOutcome(reason.outcome ?? 'neutral');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      setFormSaving(true);
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        is_active: formActive,
        outcome: formOutcome,
      };
      if (editing) {
        await updateClosingReason(editing.id, payload);
      } else {
        await createClosingReason(payload);
      }
      toast({ title: t('common.success'), description: t('settings.conversations.closing-reasons.save-success') });
      setFormOpen(false);
      loadReasons();
    } catch (error) {
      console.error('Failed to save closing reason:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-reasons.save-error'), variant: 'destructive' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteClosingReason(deleteTarget.id);
      toast({ title: t('common.success'), description: t('settings.conversations.closing-reasons.delete-success') });
      setDeleteTarget(null);
      loadReasons();
    } catch (error) {
      console.error('Failed to delete closing reason:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.closing-reasons.delete-error'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = reasons.findIndex(r => r.id === active.id);
    const newIndex = reasons.findIndex(r => r.id === over.id);
    const reordered = arrayMove(reasons, oldIndex, newIndex);
    setReasons(reordered);

    try {
      await reorderClosingReasons(reordered.map(r => r.id));
    } catch (error) {
      console.error('Failed to reorder closing reasons:', error);
      loadReasons();
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.conversations.closing-reasons.description')}</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          {t('settings.conversations.closing-reasons.new')}
        </Button>
      </div>

      {reasons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg bg-background/50">
          <ListChecks className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t('settings.conversations.closing-reasons.empty')}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={reasons.map(r => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {reasons.map(reason => (
                <SortableReasonRow key={reason.id} reason={reason} onEdit={openEditForm} onDelete={setDeleteTarget} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scrollbar-dark">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('settings.conversations.closing-reasons.edit') : t('settings.conversations.closing-reasons.new')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>{t('common.name')} *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>{t('common.description')}</Label>
              <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>{t('settings.conversations.closing-reasons.outcome-label')}</Label>
              <Select value={formOutcome} onValueChange={v => setFormOutcome(v as ClosingReasonOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="won">{t('settings.conversations.closing-reasons.outcome.won')}</SelectItem>
                  <SelectItem value="lost">{t('settings.conversations.closing-reasons.outcome.lost')}</SelectItem>
                  <SelectItem value="neutral">{t('settings.conversations.closing-reasons.outcome.neutral')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t('common.active')}</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={formSaving || !formName.trim()}>
              {formSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.conversations.closing-reasons.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.conversations.closing-reasons.delete-desc')} <strong>{deleteTarget?.name}</strong>
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

export default ClosingReasonsSection;
