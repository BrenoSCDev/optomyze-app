import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, Users, Globe } from 'lucide-react';
import { IoFunnelOutline as FunnelIcon } from 'react-icons/io5';
import { funnelManagerQueueApi, FunnelManagerQueue, FunnelManagerQueuePayload, QueueUser } from '@/services/funnelManagerQueueApi';
import { userApi } from '@/services/userApi';
import { User } from '@/types/user';
import api from '@/services/api';
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

// Sortable user item
const SortableUserItem = ({ user, onRemove }: { user: { id: number; name: string; email: string }; onRemove: (id: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: user.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 group">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onRemove(user.id)}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
};

interface SimpleFunnel {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

const FunnelManagersQueueSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [queues, setQueues] = useState<FunnelManagerQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allFunnels, setAllFunnels] = useState<SimpleFunnel[]>([]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<FunnelManagerQueue | null>(null);
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formGlobal, setFormGlobal] = useState(false);
  const [formUsers, setFormUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [formFunnelIds, setFormFunnelIds] = useState<number[]>([]);
  const [formSaving, setFormSaving] = useState(false);

  // Delete state
  const [deleteQueue, setDeleteQueue] = useState<FunnelManagerQueue | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Whichever queue currently holds the global flag, so the form can warn that
  // switching it on takes it away from that one.
  const currentGlobalQueue = queues.find(q => q.is_global) ?? null;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [queuesData, usersData, funnelsRes] = await Promise.all([
        funnelManagerQueueApi.getQueues(),
        userApi.getUsers(),
        api.get('/api/funnels'),
      ]);
      setQueues(queuesData);
      setAllUsers(usersData);
      setAllFunnels(Array.isArray(funnelsRes.data) ? funnelsRes.data : funnelsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load queue data:', error);
      toast({ title: t('common.error'), description: t('queues.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setEditingQueue(null);
    setFormName('');
    setFormActive(true);
    setFormGlobal(false);
    setFormUsers([]);
    setFormFunnelIds([]);
    setUserSearch('');
    setFormOpen(true);
  };

  const openEditForm = (queue: FunnelManagerQueue) => {
    setEditingQueue(queue);
    setFormName(queue.name);
    setFormActive(queue.is_active);
    setFormGlobal(queue.is_global);
    setFormUsers(
      [...queue.users]
        .sort((a, b) => a.pivot.order - b.pivot.order)
        .map(u => ({ id: u.id, name: u.name, email: u.email }))
    );
    setFormFunnelIds(queue.funnels.map(f => f.id));
    setUserSearch('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      setFormSaving(true);
      const payload: FunnelManagerQueuePayload = {
        name: formName.trim(),
        is_active: formActive,
        is_global: formGlobal,
        users: formUsers.map((u, i) => ({ id: u.id, order: i })),
        funnel_ids: formFunnelIds,
      };
      if (editingQueue) {
        await funnelManagerQueueApi.updateQueue(editingQueue.id, payload);
      } else {
        await funnelManagerQueueApi.createQueue(payload);
      }
      toast({ title: t('common.success'), description: t('queues.save-success') });
      setFormOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to save queue:', error);
      toast({ title: t('common.error'), description: t('queues.save-error'), variant: 'destructive' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteQueue) return;
    try {
      setDeleting(true);
      await funnelManagerQueueApi.deleteQueue(deleteQueue.id);
      toast({ title: t('common.success'), description: t('queues.delete-success') });
      setDeleteQueue(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete queue:', error);
      toast({ title: t('common.error'), description: t('queues.delete-error'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormUsers(prev => {
        const oldIndex = prev.findIndex(u => u.id === active.id);
        const newIndex = prev.findIndex(u => u.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addUserToForm = (user: User) => {
    if (formUsers.some(u => u.id === user.id)) return;
    setFormUsers(prev => [...prev, { id: user.id, name: user.name, email: user.email }]);
    setUserSearch('');
  };

  const removeUserFromForm = (userId: number) => {
    setFormUsers(prev => prev.filter(u => u.id !== userId));
  };

  const toggleFunnel = (funnelId: number) => {
    setFormFunnelIds(prev =>
      prev.includes(funnelId) ? prev.filter(id => id !== funnelId) : [...prev, funnelId]
    );
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const availableUsersForSearch = allUsers.filter(
    u => !formUsers.some(fu => fu.id === u.id) && (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('queues.description')}</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          {t('queues.new-queue')}
        </Button>
      </div>

      {/* Queue List */}
      {queues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-background/50">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">{t('queues.empty')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('queues.empty-desc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queues.map(queue => (
            <Card key={queue.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground truncate">{queue.name}</h4>
                      <Badge variant={queue.is_active ? 'default' : 'secondary'} className="shrink-0">
                        {queue.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                      {/* The company's fallback. Worth calling out on the card:
                          it is the queue that catches everything the funnels do
                          not, so which one holds it matters at a glance. */}
                      {queue.is_global && (
                        <Badge variant="outline" className="shrink-0 gap-1 border-primary/40 text-primary">
                          <Globe className="h-3 w-3" />
                          {t('queues.global-badge')}
                        </Badge>
                      )}
                    </div>

                    {/* Users */}
                    {queue.users.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex -space-x-2">
                          {queue.users
                            .sort((a, b) => a.pivot.order - b.pivot.order)
                            .slice(0, 5)
                            .map(user => (
                              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          {queue.users.length > 5 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">+{queue.users.length - 5}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {queue.users.sort((a, b) => a.pivot.order - b.pivot.order).map(u => u.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Funnels */}
                    {queue.funnels.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <FunnelIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {queue.funnels.map(f => (
                          <Badge key={f.id} variant="outline" className="text-xs">
                            {f.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditForm(queue)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteQueue(queue)}>
                      <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editingQueue ? t('queues.edit-queue') : t('queues.new-queue')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Name */}
            <div className="grid gap-2">
              <Label>{t('common.name')}</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder={t('queues.name-placeholder')} />
            </div>

            {/* Active */}
            <div className="flex items-center justify-between">
              <Label>{t('common.active')}</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            {/* Global fallback */}
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('queues.global-label')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('queues.global-desc')}
                </p>
                {/* Only one queue can hold it, so say what turning it on costs
                    rather than letting the other queue silently lose the flag. */}
                {formGlobal && currentGlobalQueue && currentGlobalQueue.id !== editingQueue?.id && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {t('queues.global-replaces').replace('{name}', currentGlobalQueue.name)}
                  </p>
                )}
              </div>
              <Switch checked={formGlobal} onCheckedChange={setFormGlobal} />
            </div>

            {/* Users (ordered) */}
            <div className="grid gap-2">
              <Label>{t('queues.users-ordered')}</Label>

              {/* Add user search */}
              <div className="relative">
                <Input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder={t('queues.search-users')}
                />
                {userSearch && availableUsersForSearch.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto scrollbar-dark rounded-md border bg-popover shadow-md">
                    {availableUsersForSearch.slice(0, 8).map(user => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                        onClick={() => addUserToForm(user)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-muted-foreground ml-2">{user.email}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sortable user list */}
              {formUsers.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formUsers.map(u => u.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                      {formUsers.map((user, i) => (
                        <div key={user.id} className="relative">
                          <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">{i + 1}</span>
                          <SortableUserItem user={user} onRemove={removeUserFromForm} />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center border rounded-lg">{t('queues.no-users')}</p>
              )}
            </div>

            {/* Funnels */}
            <div className="grid gap-2">
              <Label>{t('queues.funnels')}</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-dark border rounded-lg p-2">
                {allFunnels.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('queues.no-funnels')}</p>
                ) : (
                  allFunnels.filter(f => f.type === 'contact').map(funnel => {
                    const isSelected = formFunnelIds.includes(funnel.id);
                    // Check if this funnel is assigned to another queue
                    const assignedQueue = queues.find(q =>
                      q.id !== editingQueue?.id && q.funnels.some(f => f.id === funnel.id)
                    );
                    return (
                      <button
                        key={funnel.id}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent border border-transparent'
                        }`}
                        onClick={() => toggleFunnel(funnel.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-primary border-primary' : 'border-input'
                          }`}>
                            {isSelected && <span className="text-primary-foreground text-[10px]">✓</span>}
                          </div>
                          <span>{funnel.name}</span>
                          <Badge variant="outline" className="text-[10px] py-0">{funnel.type}</Badge>
                        </div>
                        {assignedQueue && (
                          <span className="text-[10px] text-muted-foreground">
                            {t('queues.assigned-to')} {assignedQueue.name}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t('queues.funnel-reassign-hint')}</p>
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
      <AlertDialog open={!!deleteQueue} onOpenChange={open => !open && setDeleteQueue(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('queues.delete-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('queues.delete-desc')} <strong>{deleteQueue?.name}</strong>
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

export default FunnelManagersQueueSection;
