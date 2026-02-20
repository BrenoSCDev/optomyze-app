import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Hash, ChevronLeft, BellOff, Archive, Trash2, Loader2, CheckSquare, X, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getEcho } from '@/services/echo';
import {
  ChatConversation, ChatContact, ChatMessage, MessagesMeta,
  fetchMessages, sendTextMessage, sendFileMessage, deleteMessages, deleteGroup,
} from '@/services/inboxChatApi';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GroupManagementPanel from './GroupManagementPanel';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MessageThreadProps {
  conversation: ChatConversation | null;
  contacts?: ChatContact[];
  onBack?: () => void;
  showBackButton?: boolean;
  onMessageSent?: (msg: ChatMessage) => void;
  onConversationUpdated?: (conv: ChatConversation) => void;
  onConversationDeleted?: (convId: number) => void;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}/${url.replace(/^\//, '')}`;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation, contacts = [], onBack, showBackButton = false, onMessageSent,
  onConversationUpdated, onConversationDeleted,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentUserId = user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meta, setMeta] = useState<MessagesMeta | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Select mode state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Group management state
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // Reset state when conversation changes
  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowGroupPanel(false);
  }, [conversation?.id]);

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
        const firstFetch = await fetchMessages(conversation.id, 1);
        const lastPage = firstFetch.meta.last_page;
        if (cancelled) return;

        if (lastPage <= 1) {
          const ids = new Set(firstFetch.data.map(m => m.id));
          messageIdsRef.current = ids;
          setMessages(firstFetch.data);
          setMeta(firstFetch.meta);
        } else {
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
      const msg: ChatMessage = payload?.id ? payload : payload?.message;
      if (!msg?.id) return;
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Listen for deleted messages
    channel.listen('.messages.deleted', (payload: any) => {
      const deletedIds: number[] = payload?.deleted_message_ids ?? [];
      if (deletedIds.length === 0) return;
      const deletedSet = new Set(deletedIds);
      deletedIds.forEach(id => messageIdsRef.current.delete(id));
      setMessages(prev => prev.filter(m => !deletedSet.has(m.id)));
      setSelectedIds(prev => {
        const next = new Set(prev);
        deletedIds.forEach(id => next.delete(id));
        return next;
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
    if (el.scrollTop > 50) return;
    if (isLoadingMore) return;

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
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevScrollHeight;
      });
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [meta, conversation?.id, isLoadingMore]);

  // ─── Select mode handlers ────────────────────────────────────────────
  const toggleSelectMessage = useCallback((id: number) => {
    // Only allow selecting own messages
    const msg = messages.find(m => m.id === id);
    if (!msg || msg.sender.id !== currentUserId) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [messages, currentUserId]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteMessages(Array.from(selectedIds));
      const deletedSet = new Set(result.deleted_ids);
      // Remove deleted messages from state
      result.deleted_ids.forEach(id => messageIdsRef.current.delete(id));
      setMessages(prev => prev.filter(m => !deletedSet.has(m.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      if (result.deleted_ids.length > 0) {
        toast({ title: 'Messages deleted', description: `${result.deleted_ids.length} message(s) deleted.` });
      }
    } catch (err) {
      console.error('Failed to delete messages:', err);
      toast({ title: 'Error', description: 'Failed to delete messages.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, isDeleting, toast]);

  // ─── Send handlers ───────────────────────────────────────────────────
  const handleSend = useCallback(async (content: string) => {
    if (!conversation || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendTextMessage(conversation.id, content);
      messageIdsRef.current.add(msg.id);
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

  // ─── Delete group handler ─────────────────────────────────────────────
  const handleDeleteGroup = useCallback(async () => {
    if (!conversation || isDeletingGroup) return;
    setIsDeletingGroup(true);
    try {
      await deleteGroup(conversation.id);
      setShowDeleteConfirm(false);
      onConversationDeleted?.(conversation.id);
      toast({ title: 'Group deleted', description: `"${conversation.name}" has been deleted.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete group.', variant: 'destructive' });
    } finally {
      setIsDeletingGroup(false);
    }
  }, [conversation?.id, conversation?.name, isDeletingGroup, onConversationDeleted, toast]);

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
  const coverUrl = getAvatarUrl(conversation.cover_image_url);
  const meParticipant = conversation.participants.find(p => p.id === currentUserId);
  const isGroupAdmin = isGroup && meParticipant?.conversation_role === 'admin';

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
          {isGroup && coverUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border border-accent/30">
              <img src={coverUrl} alt={conversation.name} className="w-full h-full object-cover" />
            </div>
          ) : (() => {
            const otherPic = !isGroup
              ? getAvatarUrl(conversation.participants.find(p => p.id !== currentUserId)?.profile_pic_url)
              : null;
            if (otherPic) {
              return (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/30">
                  <img src={otherPic} alt={conversation.name} className="w-full h-full object-cover" />
                </div>
              );
            }
            return (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm
                ${isGroup ? 'bg-accent/20 border border-accent/30 text-accent' : 'bg-primary/20 border border-primary/30 text-primary'}`}>
                {isGroup ? <Hash className="w-4 h-4" /> : initials}
              </div>
            );
          })()}
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

        {/* Group members button */}
        {isGroup && (
          <button
            onClick={() => setShowGroupPanel(prev => !prev)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
              ${showGroupPanel ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            title="Group members"
          >
            <Users className="w-4 h-4" />
          </button>
        )}

        {/* Select mode toggle */}
        <button
          onClick={() => {
            setSelectMode(prev => !prev);
            setSelectedIds(new Set());
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
            ${selectMode ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          title={selectMode ? 'Exit select mode' : 'Select messages'}
        >
          <CheckSquare className="w-4 h-4" />
        </button>

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
            {isGroupAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-xs text-destructive cursor-pointer"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Group
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Select mode action bar */}
      {selectMode && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/40 bg-primary/5 shrink-0">
          <span className="text-xs text-muted-foreground flex-1">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Tap messages to select'}
          </span>
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-40 transition-colors"
            >
              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete
            </button>
          )}
          <button
            onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content area with optional group panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Messages area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showGroupPanel && isGroup ? 'border-r border-border/40' : ''}`}>
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
                      selectMode={selectMode}
                      isSelected={selectedIds.has(msg.id)}
                      onToggleSelect={toggleSelectMessage}
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

        {/* Group management panel */}
        {showGroupPanel && isGroup && (
          <div className="w-64 lg:w-72 shrink-0 overflow-hidden">
            <GroupManagementPanel
              conversation={conversation}
              contacts={contacts}
              onClose={() => setShowGroupPanel(false)}
              onConversationUpdated={(conv) => onConversationUpdated?.(conv)}
            />
          </div>
        )}
      </div>

      {/* Delete group confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{conversation.name}"? This action cannot be undone and all messages will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGroup}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingGroup ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessageThread;
