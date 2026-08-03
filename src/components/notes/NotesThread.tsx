/**
 * NOTES THREAD
 *
 * Collaborative notes for any record — a lead, a deal, and whatever comes
 * next. Threads are one level deep: a note, and replies to it.
 *
 * Shared rather than duplicated per record type, so the lead and deal views
 * behave identically and a change lands in both. What a note is attached to
 * is the only thing the caller supplies.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Pencil, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import UserAvatar from '@/components/ui/user-avatar';
import ClickableUser from '@/components/users/ClickableUser';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { timeAgo } from '@/lib/utils';
import { NotableType, Observation, observationService } from '@/services/observationApi';

interface NotesThreadProps {
  type: NotableType;
  id: number;
  /**
   * Notes already loaded by the parent. When omitted the component fetches
   * its own — which is what the deal view does, since nothing else there
   * needs them.
   */
  notes?: Observation[];
  onChanged?: () => void;
}

/** Mention markup is `@[id]`; render it as the teammate's name. */
const renderBody = (note: string, names: Map<number, string>): React.ReactNode =>
  note.split(/(@\[\d+\])/g).map((part, i) => {
    const match = part.match(/^@\[(\d+)\]$/);
    if (!match) return <React.Fragment key={i}>{part}</React.Fragment>;

    const id = Number(match[1]);
    return (
      <span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
        @{names.get(id) ?? id}
      </span>
    );
  });

const NotesThread: React.FC<NotesThreadProps> = ({ type, id, notes: provided, onChanged }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [notes, setNotes] = useState<Observation[]>(provided ?? []);
  const [loading, setLoading] = useState(!provided);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await observationService.listFor(type, id));
    } catch {
      toast.error(t('observations.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [type, id, t]);

  useEffect(() => {
    if (provided) {
      setNotes(provided);
      setLoading(false);
      return;
    }
    load();
  }, [provided, load]);

  /** Names for mention rendering, gathered from whoever appears in the thread. */
  const names = useMemo(() => {
    const map = new Map<number, string>();
    const walk = (list: Observation[]) => list.forEach(n => {
      if (n.user) map.set(n.user.id, n.user.name);
      if (n.replies) walk(n.replies);
    });
    walk(notes);
    return map;
  }, [notes]);

  const refresh = async () => {
    await load();
    onChanged?.();
  };

  const post = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await observationService.createNote({ type, id }, draft.trim());
      setDraft('');
      await refresh();
    } catch {
      toast.error(t('observations.error-create'));
    } finally {
      setPosting(false);
    }
  };

  const postReply = async (parentId: number) => {
    if (!replyDraft.trim()) return;
    setBusyId(parentId);
    try {
      await observationService.createNote({ parentId }, replyDraft.trim());
      setReplyDraft('');
      setReplyTo(null);
      await refresh();
    } catch {
      toast.error(t('observations.error-create'));
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = async (noteId: number) => {
    if (!editDraft.trim()) return;
    setBusyId(noteId);
    try {
      await observationService.updateObservation(noteId, editDraft.trim());
      setEditing(null);
      await refresh();
    } catch {
      toast.error(t('observations.error-update'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (noteId: number, isThread: boolean) => {
    // Deleting a thread takes its replies with it — say so before it happens.
    if (!window.confirm(isThread ? t('observations.confirm-delete-thread') : t('observations.confirm-delete'))) {
      return;
    }
    setBusyId(noteId);
    try {
      await observationService.deleteObservation(noteId);
      await refresh();
    } catch {
      toast.error(t('observations.error-delete'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleCollapse = (noteId: number) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(noteId) ? next.delete(noteId) : next.add(noteId);
      return next;
    });

  /** One note — a thread root or a reply. */
  const NoteRow: React.FC<{ note: Observation; isReply?: boolean }> = ({ note, isReply = false }) => {
    const mine = note.user?.id === user?.id;
    const canDelete = mine || ['admin', 'manager'].includes(String(user?.role).toLowerCase());
    const isBusy = busyId === note.id;

    return (
      <div className="flex gap-2.5">
        <ClickableUser userId={note.user?.id} className="shrink-0">
          <UserAvatar name={note.user?.name ?? ""} profilePicPath={note.user?.profile_pic} className={isReply ? 'h-6 w-6' : 'h-8 w-8'} />
        </ClickableUser>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-foreground">{note.user?.name ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{timeAgo(note.created_at)}</span>
            {note.edited_at && (
              <span className="text-xs italic text-muted-foreground">{t('observations.edited')}</span>
            )}
          </div>

          {editing === note.id ? (
            <div className="mt-1.5 space-y-2">
              <Textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} rows={3} autoFocus />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(note.id)} disabled={isBusy}>
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('common.save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)} disabled={isBusy}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">
              {renderBody(note.note, names)}
            </p>
          )}

          {editing !== note.id && (
            <div className="mt-1 flex items-center gap-1">
              {!isReply && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setReplyTo(replyTo === note.id ? null : note.id); setReplyDraft(''); }}
                >
                  {t('observations.reply')}
                </Button>
              )}
              {mine && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setEditing(note.id); setEditDraft(note.note); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost" size="sm"
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => remove(note.id, !isReply && !!note.replies?.length)}
                  disabled={isBusy}
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Composer sits at the top: posting is the common action, and it keeps
          the newest thread adjacent to where it was written. */}
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={t('observations.placeholder')}
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={post} disabled={posting || !draft.trim()}>
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('observations.add')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t('observations.empty')}</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const replies = note.replies ?? [];
            const isCollapsed = collapsed.has(note.id);

            return (
              <div key={note.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <NoteRow note={note} />

                {replies.length > 0 && (
                  <div className="mt-2 pl-10">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(note.id)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {t('observations.replies-count').replace('{count}', String(replies.length))}
                    </button>

                    {!isCollapsed && (
                      // The rail is what makes a thread scannable at a glance.
                      <div className="mt-2 space-y-3 border-l border-border pl-3">
                        {replies.map(reply => <NoteRow key={reply.id} note={reply} isReply />)}
                      </div>
                    )}
                  </div>
                )}

                {replyTo === note.id && (
                  <div className="mt-2 space-y-2 pl-10">
                    <Textarea
                      value={replyDraft}
                      onChange={e => setReplyDraft(e.target.value)}
                      placeholder={t('observations.reply-placeholder')}
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => postReply(note.id)} disabled={busyId === note.id || !replyDraft.trim()}>
                        {busyId === note.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {t('observations.reply')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotesThread;
