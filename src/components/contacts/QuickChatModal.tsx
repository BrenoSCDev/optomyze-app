/**
 * QUICK CHAT
 *
 * Chat with one contact without leaving the Contacts list. Deliberately just
 * the conversation — no lead details, tabs or side panels.
 *
 * Live updates come from InboxContext, which is the app's websocket
 * subscriber; the modal reads the same chat object the Global Inbox does, so
 * incoming messages land here without a second socket consumer.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquareOff } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useInbox } from '@/contexts/InboxContext';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import { InboxChat, InboxMessage } from '@/types/inbox';
import ChatConversation from '@/components/inbox/global/ChatConversation';

interface Props {
  open: boolean;
  onClose: () => void;
  leadId: number | null;
  /** Shown in the title so the user knows who they're talking to. */
  leadName: string;
}

const QuickChatModal: React.FC<Props> = ({ open, onClose, leadId, leadName }) => {
  const { t } = useLanguage();
  const { chats, setChats } = useInbox();

  const [fetched, setFetched] = useState<InboxChat | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Prefer the context copy: it's the one the websocket mutates, so the feed
   * stays live. Fall back to the fetched chat, which covers the common case
   * where the inbox list hasn't been loaded (or this chat is on a later page).
   */
  const chat = useMemo<InboxChat | null>(() => {
    if (!leadId) return null;
    return chats.find(c => c.lead_id === leadId) ?? fetched;
  }, [chats, fetched, leadId]);

  const load = useCallback(async () => {
    if (!leadId) return;
    // Already live in context — nothing to fetch.
    if (chats.some(c => c.lead_id === leadId)) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await api.get(`/api/inbox/leads/${leadId}/chat`);
      const found: InboxChat | null = res.data?.data ?? null;
      setFetched(found);
      // Seed it into the inbox context so websocket updates have something to
      // patch, and so re-opening the modal is instant.
      if (found) {
        setChats(prev => (prev.some(c => c.id === found.id) ? prev : [...prev, found]));
      }
    } catch {
      setFetched(null);
    } finally {
      setLoading(false);
    }
  }, [leadId, chats, setChats]);

  useEffect(() => {
    if (!open) { setFetched(null); return; }
    load();
    // `load` depends on `chats`, which changes on every websocket message —
    // re-running then would refetch constantly, so this intentionally keys
    // only on the modal opening for a given lead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  const handleMessageSent = (message: InboxMessage) => {
    setChats(prev => prev.map(c =>
      c.id === chat?.id
        ? { ...c, last_message_at: message.sent_at, messages: [message] }
        : c
    ));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[min(80vh,40rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="truncate text-base">{leadName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : chat ? (
          <div className="min-h-0 flex-1">
            <ChatConversation chat={chat} onMessageSent={handleMessageSent} hideLeadPreview />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <MessageSquareOff className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">{t('contacts.chat-none-title')}</p>
            <p className="max-w-xs text-xs text-muted-foreground">{t('contacts.chat-none-desc')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickChatModal;
