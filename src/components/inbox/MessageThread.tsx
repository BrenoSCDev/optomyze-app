import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Hash, ChevronLeft, BellOff, Archive, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEcho } from '@/services/echo';
import {
  ChatConversation, ChatMessage, MessagesMeta,
  fetchMessages, sendTextMessage, sendFileMessage,
} from '@/services/inboxChatApi';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageThreadProps {
  conversation: ChatConversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
  onMessageSent?: (msg: ChatMessage) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDaySeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation, onBack, showBackButton = false, onMessageSent,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta] = useState<MessagesMeta | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // ─── Load messages for selected conversation ──────────────────────────
  useEffect(() => {
    if (!conversation) {
      setMessages([]);
      setMeta(null);
      messageIdsRef.current.clear();
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingMessages(true);
      setMessages([]);
      messageIdsRef.current.clear();
      try {
        // First fetch page=1 to get meta, then fetch last_page
        const firstFetch = await fetchMessages(conversation.id, 1);
        const lastPage = firstFetch.meta.last_page;
        if (cancelled) return;

        if (lastPage <= 1) {
          // Only one page
          const ids = new Set(firstFetch.data.map(m => m.id));
          messageIdsRef.current = ids;
          setMessages(firstFetch.data);
          setMeta(firstFetch.meta);
        } else {
          // Fetch the last page for most recent messages
          const lastFetch = await fetchMessages(conversation.id, lastPage);
          if (cancelled) return;
          const ids = new Set(lastFetch.data.map(m => m.id));
          messageIdsRef.current = ids;
          setMessages(lastFetch.data);
          setMeta(lastFetch.meta);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        toast({ title: 'Error', description: 'Failed to load messages.', variant: 'destructive' });
      } finally {
        if (!cancelled) setIsLoadingMessages(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [conversation?.id]);

  // Scroll to bottom on initial load or new messages
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLoadingMessages, messages.length]);

  // ─── WebSocket subscription ───────────────────────────────────────────
  useEffect(() => {
    if (!conversation) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `conversation.${conversation.id}`;
    const channel = echo.private(channelName);

    channel.listen('.message.sent', (payload: any) => {
      // payload may be the message directly or wrapped
      const msg: ChatMessage = payload?.id ? payload : payload?.message;
      if (!msg?.id) return;
      // Deduplicate by id
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);
      setMessages(prev => {
        // Double-check against current state to avoid duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      echo.leave(channelName);
    };
  }, [conversation?.id]);

  // ─── Load older messages on scroll to top ─────────────────────────────
  const handleScroll = useCallback(async () => {
    const el = scrollContainerRef.current;
    if (!el || !meta || !conversation) return;
    if (el.scrollTop > 50) return; // not at top
    if (isLoadingMore) return;

    // Pages are ASC, page 1 = oldest. We loaded last_page first.
    // To load older, we go current_page - 1
    const prevPage = meta.current_page - 1;
    if (prevPage < 1) return;

    setIsLoadingMore(true);
    const prevScrollHeight = el.scrollHeight;
    try {
      const res = await fetchMessages(conversation.id, prevPage);
      const newMsgs = res.data.filter(m => !messageIdsRef.current.has(m.id));
      newMsgs.forEach(m => messageIdsRef.current.add(m.id));
      setMessages(prev => [...newMsgs, ...prev]);
      setMeta(res.meta);
      // Preserve scroll position
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [meta, conversation?.id, isLoadingMore]);

  // ─── Send handlers ───────────────────────────────────────────────────
  const handleSend = useCallback(async (content: string) => {
    if (!conversation || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendTextMessage(conversation.id, content);
      messageIdsRef.current.add(msg.id);
      // Guard against WS event that may have arrived before POST resolved
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSent?.(msg);
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  }, [conversation?.id, isSending, onMessageSent, toast]);

  const handleSendFile = useCallback(async (file: File, type: 'image' | 'audio') => {
    if (!conversation) return;
    try {
      const msg = await sendFileMessage(conversation.id, type, file);
      messageIdsRef.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSent?.(msg);
    } catch (err) {
      console.error('Failed to send file:', err);
      toast({ title: 'Error', description: 'Failed to send file.', variant: 'destructive' });
    }
  }, [conversation?.id, onMessageSent, toast]);

  // ─── Render empty state ───────────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
          <Hash className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground/60 text-sm">Select a conversation</p>
          <p className="text-xs mt-1">Choose from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === 'group';
  const initials = getInitials(conversation.name);

  // Build rendered messages with day separators
  const rendered: Array<{ msg: ChatMessage; showSeparator: boolean; showSender: boolean }> = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const showSeparator = !prev ||
      new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
    const showSender = isGroup && (!prev || prev.sender.id !== msg.sender.id || showSeparator);
    rendered.push({ msg, showSeparator, showSender });
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm shrink-0">
        {showBackButton && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm
            ${isGroup ? 'bg-accent/20 border border-accent/30 text-accent' : 'bg-primary/20 border border-primary/30 text-primary'}`}>
            {isGroup ? <Hash className="w-4 h-4" /> : initials}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{conversation.name}</p>
          {isGroup ? (
            <p className="text-xs text-muted-foreground">{conversation.participants.length} members</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {conversation.participants.find(p => p.id !== currentUserId)?.role ?? ''}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
              <BellOff className="w-3.5 h-3.5" /> Mute
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
              <Archive className="w-3.5 h-3.5" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs text-destructive cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {rendered.map(({ msg, showSeparator, showSender }) => {
              const isOwn = msg.sender.id === currentUserId;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showSender={showSender}
                  showDaySeparator={showSeparator}
                />
              );
            })}
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No messages yet. Say hello!
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} onSendFile={handleSendFile} disabled={isSending} />
    </div>
  );
};

export default MessageThread;
