/**
 * CHAT CONVERSATION COMPONENT
 *
 * Center panel displaying the message thread for the Global Inbox.
 *
 * NOTE: bubble colors / mode toggle currently use WhatsApp-green styling as
 * the default look for the only implemented channel. Per-channel theming is
 * future work once Instagram/Messenger/SMS sending is implemented.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, ArrowLeft, Send, Loader2, X, MapPin, ExternalLink, StickyNote, MoreVertical, Trash2, Inbox, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InboxChat, InboxMessage } from '@/types/inbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, extractTime } from '@/lib/utils';
import { sendInboxMessage, sendInboxMedia, sendInstagramMessage, sendInstagramMedia, clearInboxChatMessages, fetchInboxChatMessages } from '@/services/globalInboxApi';
import { toast } from '@/hooks/use-toast';
import AudioPlayer from './AudioPlayer';
import DocumentMessage from './DocumentMessage';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import ContactMessage from './ContactMessage';
import InboxAvatar from './InboxAvatar';
import MessageComposer from './MessageComposer';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useInbox } from '@/contexts/InboxContext';

/** Renders an image message fetched through the authenticated backend. */
const InboxPrivateImage: React.FC<{
  path: string;
  onOpenLightbox: (url: string) => void;
  isInternalNote: boolean;
  direction: string;
  status?: string;
  sentAt: string;
}> = ({ path, onOpenLightbox, isInternalNote, direction, status, sentAt }) => {
  const url = usePrivateFile(path);

  return (
    <div className="space-y-1">
      {url ? (
        <button onClick={() => onOpenLightbox(url)} className="block">
          <img
            src={url}
            alt="Shared image"
            className="rounded-md max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </button>
      ) : (
        <div className="w-48 h-32 rounded-md bg-muted/40 animate-pulse" />
      )}
      <div className={cn('flex items-center gap-1 px-2 pb-1', direction === 'outgoing' ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : direction === 'outgoing' ? 'text-green-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {direction === 'outgoing' && status && !isInternalNote && (
          <span className="text-xs text-green-100">• {status}</span>
        )}
      </div>
    </div>
  );
};

/** Renders an audio message fetched through the authenticated backend. */
const InboxPrivateAudio: React.FC<{
  path: string;
  isOutgoing: boolean;
  isInternalNote: boolean;
  status?: string;
  sentAt: string;
}> = ({ path, isOutgoing, isInternalNote, status, sentAt }) => {
  const url = usePrivateFile(path);

  return (
    <div className="space-y-2">
      {url ? (
        <AudioPlayer src={url} isOutgoing={isOutgoing} />
      ) : (
        <div className="w-48 h-10 rounded-md bg-muted/40 animate-pulse" />
      )}
      <div className={cn('flex items-center gap-1', isOutgoing ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : isOutgoing ? 'text-green-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOutgoing && status && !isInternalNote && (
          <span className="text-xs text-green-100">• {status}</span>
        )}
      </div>
    </div>
  );
};

/** Renders a document message fetched through the authenticated backend. */
const InboxPrivateDocument: React.FC<{
  path: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  isOutgoing: boolean;
  isInternalNote: boolean;
  status?: string;
  sentAt: string;
}> = ({ path, fileName, mimeType, fileSize, isOutgoing, isInternalNote, status, sentAt }) => {
  const url = usePrivateFile(path);

  return (
    <div className="space-y-1">
      {url ? (
        <DocumentMessage
          fileName={fileName}
          fileUrl={url}
          mimeType={mimeType}
          fileSize={fileSize}
          isOutgoing={isOutgoing && !isInternalNote}
        />
      ) : (
        <div className="w-48 h-12 rounded-md bg-muted/40 animate-pulse" />
      )}
      <div className={cn('flex items-center gap-1 px-1', isOutgoing ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : isOutgoing ? 'text-green-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOutgoing && status && !isInternalNote && (
          <span className="text-xs text-green-100">• {status}</span>
        )}
      </div>
    </div>
  );
};

interface ChatConversationProps {
  chat: InboxChat | null;
  onBack?: () => void;
  showBackButton?: boolean;
  onMessageSent?: (message: InboxMessage) => void;
}

interface PendingMessage {
  id: string;
  text: string;
  status: 'sending' | 'error';
  messageMode: 'external' | 'internal';
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  onBack,
  showBackButton = false,
  onMessageSent
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { handleChatCleared, chats: contextChats } = useInbox();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [leadPreviewOpen, setLeadPreviewOpen] = useState(false);
  const [messageMode, setMessageMode] = useState<'external' | 'internal'>('external');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Message pagination state
  const [localMessages, setLocalMessages] = useState<InboxMessage[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);

  // Track local message IDs to avoid duplicates
  const localMessageIdsRef = useRef<Set<number>>(new Set());
  // Saved scroll height for position restoration after prepend
  const savedScrollHeightRef = useRef<number | null>(null);

  const getViewport = useCallback(() =>
    scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null,
  []);

  const scrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [getViewport]);

  // Load messages when chat changes
  useEffect(() => {
    if (!chat) {
      setLocalMessages([]);
      localMessageIdsRef.current = new Set();
      setMessagePage(1);
      setHasMoreMessages(false);
      return;
    }
    setIsLoadingMessages(true);
    setLocalMessages([]);
    localMessageIdsRef.current = new Set();
    setMessagePage(1);

    fetchInboxChatMessages(chat.id, 1)
      .then(res => {
        const msgs = [...res.data].reverse(); // API returns newest first; reverse for display
        msgs.forEach(m => localMessageIdsRef.current.add(m.id));
        setLocalMessages(msgs);
        setHasMoreMessages(res.meta.current_page < res.meta.last_page);
        setTimeout(scrollToBottom, 50);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false));
  }, [chat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync new messages from WebSocket (context updates selectedChat.messages)
  useEffect(() => {
    if (!chat) return;
    const contextChat = contextChats.find(c => c.id === chat.id);
    if (!contextChat?.messages?.length) return;

    const newMsgs = contextChat.messages.filter(m => !localMessageIdsRef.current.has(m.id));
    if (newMsgs.length > 0) {
      newMsgs.forEach(m => localMessageIdsRef.current.add(m.id));
      setLocalMessages(prev => [...prev, ...newMsgs]);
      setTimeout(scrollToBottom, 50);
    }
  }, [contextChats, chat?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also sync from the chat prop (sent message updates from GlobalInbox)
  useEffect(() => {
    if (!chat?.messages?.length) return;
    const newMsgs = chat.messages.filter(m => !localMessageIdsRef.current.has(m.id));
    if (newMsgs.length > 0) {
      newMsgs.forEach(m => localMessageIdsRef.current.add(m.id));
      setLocalMessages(prev => [...prev, ...newMsgs]);
      setTimeout(scrollToBottom, 50);
    }
  }, [chat?.messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position after prepending older messages
  useEffect(() => {
    if (savedScrollHeightRef.current !== null) {
      const viewport = getViewport();
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight - savedScrollHeightRef.current;
      }
      savedScrollHeightRef.current = null;
    }
  }, [localMessages, getViewport]);

  // Load older messages when user scrolls to top
  const loadMoreMessages = useCallback(async () => {
    if (!chat || isLoadingMoreMessages || !hasMoreMessages) return;
    const viewport = getViewport();
    if (viewport) savedScrollHeightRef.current = viewport.scrollHeight;
    setIsLoadingMoreMessages(true);
    const nextPage = messagePage + 1;
    try {
      const res = await fetchInboxChatMessages(chat.id, nextPage);
      const olderMsgs = [...res.data].reverse().filter(m => !localMessageIdsRef.current.has(m.id));
      olderMsgs.forEach(m => localMessageIdsRef.current.add(m.id));
      setLocalMessages(prev => [...olderMsgs, ...prev]);
      setHasMoreMessages(res.meta.current_page < res.meta.last_page);
      setMessagePage(nextPage);
    } catch {
      savedScrollHeightRef.current = null;
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [chat, isLoadingMoreMessages, hasMoreMessages, messagePage, getViewport]);

  // Scroll-to-top detection for loading older messages
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;
    const handleScroll = () => {
      if (viewport.scrollTop <= 80 && hasMoreMessages && !isLoadingMoreMessages) {
        loadMoreMessages();
      }
    };
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [getViewport, hasMoreMessages, isLoadingMoreMessages, loadMoreMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [pendingMessages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chat?.channelable_id) {
      return;
    }
    if (chat.channel !== 'instagram' && !chat?.lead?.id) {
      return;
    }

    const text = messageText.trim();
    const tempId = `pending-${Date.now()}`;
    const currentMode = messageMode;

    setMessageText('');
    setIsSending(true);
    setPendingMessages(prev => [...prev, { id: tempId, text, status: 'sending', messageMode: currentMode }]);

    try {
      const response = chat.channel === 'instagram'
        ? await sendInstagramMessage(chat.channelable_id, chat.id, text, currentMode)
        : await sendInboxMessage(chat.channelable_id, {
            lead_id: chat.lead!.id,
            text,
            message_mode: currentMode
          });

      setPendingMessages(prev => prev.filter(m => m.id !== tempId));

      const sentMessage: InboxMessage = {
        id: response.message.id,
        inbox_chat_id: response.message.inbox_chat_id,
        direction: response.message.direction || 'outgoing',
        type: 'text',
        text: response.message.text,
        status: response.message.status,
        sent_at: response.message.sent_at,
        user_id: response.message.user_id,
        message_mode: response.message.message_mode || currentMode,
        user: response.message.user,
      };

      // Add to local messages (avoids duplicate from context sync)
      if (!localMessageIdsRef.current.has(sentMessage.id)) {
        localMessageIdsRef.current.add(sentMessage.id);
        setLocalMessages(prev => [...prev, sentMessage]);
      }

      onMessageSent?.(sentMessage);
    } catch (error: any) {
      setPendingMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m)
      );

      const isWindowExpired = error?.response?.data?.message === 'instagram_window_expired';

      toast({
        title: t('chat.inbox.message-error'),
        description: isWindowExpired
          ? t('chat.inbox.instagram-window-expired')
          : error?.response?.data?.message || t('chat.inbox.message-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = (pendingMessage: PendingMessage) => {
    setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
    setMessageText(pendingMessage.text);
    setMessageMode(pendingMessage.messageMode);
  };

  const handleSendMedia = useCallback(async (file: File, type: 'image' | 'audio', mode: 'external' | 'internal' = 'external') => {
    if (!chat?.channelable_id) return;
    if (chat.channel !== 'instagram' && !chat?.lead?.id) return;

    const tempId = `pending-media-${Date.now()}`;
    setIsSendingMedia(true);
    setPendingMessages(prev => [...prev, { id: tempId, text: type === 'image' ? '📷 Image' : '🎤 Audio', status: 'sending', messageMode: mode }]);

    try {
      const response = chat.channel === 'instagram'
        ? await sendInstagramMedia(chat.channelable_id, chat.id, type, file, mode)
        : await sendInboxMedia(chat.channelable_id, chat.lead!.id, type, file, mode);

      setPendingMessages(prev => prev.filter(m => m.id !== tempId));

      const sentMessage: InboxMessage = {
        id: response.message.id,
        inbox_chat_id: response.message.inbox_chat_id,
        direction: 'outgoing',
        type: type,
        text: null,
        media_url: response.message.media_url,
        media_mime: response.message.media_mime,
        media_size: response.message.media_size,
        status: response.message.status,
        sent_at: response.message.sent_at,
        user_id: response.message.user_id,
        message_mode: response.message.message_mode || mode,
        user: response.message.user,
      };

      if (!localMessageIdsRef.current.has(sentMessage.id)) {
        localMessageIdsRef.current.add(sentMessage.id);
        setLocalMessages(prev => [...prev, sentMessage]);
      }

      onMessageSent?.(sentMessage);
    } catch (error: any) {
      setPendingMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));

      const isWindowExpired = error?.response?.data?.message === 'instagram_window_expired';

      toast({
        title: t('chat.inbox.message-error'),
        description: isWindowExpired
          ? t('chat.inbox.instagram-window-expired')
          : error?.response?.data?.message || t('chat.inbox.message-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsSendingMedia(false);
    }
  }, [chat?.lead, chat?.channelable_id, chat?.channel, chat?.id, onMessageSent, t]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSendMedia(file, 'image', messageMode);
    e.target.value = '';
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
            handleSendMedia(file, 'audio', messageMode);
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      } catch {
        toast({ title: 'Microphone access denied', variant: 'destructive' });
      }
    }
  };

  const handleClearMessages = async () => {
    if (!chat) return;
    setIsClearing(true);
    try {
      await clearInboxChatMessages(chat.id);
      handleChatCleared(chat.id);
      setLocalMessages([]);
      localMessageIdsRef.current = new Set();
      toast({ title: t('chat.inbox.clear-success') });
    } catch (error: any) {
      toast({
        title: t('chat.inbox.clear-error'),
        description: error?.response?.data?.message || '',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  const getLeadName = (): string => {
    if (chat?.lead?.first_name || chat?.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    return chat?.contact_name || chat?.external_contact_id || '';
  };

  const formatMessageTime = (dateString: string): string => {
    return extractTime(dateString);
  };

  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.inbox.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.inbox.yesterday');
    }
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupMessagesByDate = (messages: InboxMessage[]) => {
    const groups: { date: string; messages: InboxMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.sent_at).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.sent_at, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const isInternalNote = (message: InboxMessage) => message.message_mode === 'internal';

  if (!chat) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/20">
        <div className="text-center space-y-3 p-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">{t('chat.inbox.select-chat')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t('chat.inbox.select-chat-description')}
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(localMessages);
  const canSend = !!chat.channelable_id;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border/50 bg-card shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <InboxAvatar profilePicPath={chat.profile_pic_url} name={getLeadName()} channel={chat.channel} />
          <div className="flex-1 min-w-0">
            {chat.lead?.id ? (
              <button onClick={() => setLeadPreviewOpen(true)} className="font-semibold truncate hover:underline hover:text-primary transition-colors block text-left max-w-full">
                {getLeadName()}
              </button>
            ) : (
              <h3 className="font-semibold truncate">{getLeadName()}</h3>
            )}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{chat.external_contact_id}</span>
              {/* Badges inline on mobile to save vertical space */}
              {chat.lead?.funnel && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                  {chat.lead.funnel.name}
                </Badge>
              )}
              {chat.lead?.stage && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                  {chat.lead.stage.name}
                </Badge>
              )}
            </div>
          </div>
          {/* Chat actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowClearConfirm(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('chat.inbox.clear-messages')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4 w-full overflow-x-hidden" ref={scrollAreaRef} scrollbarVariant="dark">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : localMessages.length > 0 ? (
          <div className="space-y-4 w-full min-w-0">
            {/* Load more indicator at top */}
            {isLoadingMoreMessages && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasMoreMessages && localMessages.length >= 50 && (
              <p className="text-xs text-muted-foreground text-center py-1">
                {t('chat.inbox.all-messages-loaded')}
              </p>
            )}

            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center justify-center">
                  <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {formatMessageDate(group.date)}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((message, messageIndex) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: messageIndex * 0.03 }}
                    className={cn(
                      "flex items-end gap-2",
                      message.direction === 'outgoing' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.direction === 'incoming' && (
                      <InboxAvatar
                        profilePicPath={chat.profile_pic_url}
                        name={getLeadName()}
                        size="sm"
                      />
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg shadow-sm overflow-hidden",
                        message.type === 'image' ? "p-1" :
                        message.type === 'audio' ? "px-2 py-1.5" :
                        message.type === 'location' ? "p-2" :
                        message.type === 'document' ? "p-2" :
                        message.type === 'contact' ? "p-3" : "p-3",
                        isInternalNote(message)
                          ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-br-none"
                          : message.direction === 'outgoing'
                            ? "bg-green-500 text-white rounded-br-none"
                            : "bg-card border border-border/50 rounded-bl-none"
                      )}
                    >
                      {/* Internal note label */}
                      {isInternalNote(message) && (
                        <div className="flex items-center gap-1 mb-1">
                          <StickyNote className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {t('chat.inbox.internal-note')}
                          </span>
                        </div>
                      )}

                      {message.type === 'image' && message.media_url ? (
                        <div className="space-y-1">
                          <InboxPrivateImage
                            path={message.media_url}
                            onOpenLightbox={setLightboxImage}
                            isInternalNote={isInternalNote(message)}
                            direction={message.direction}
                            status={message.status}
                            sentAt={message.sent_at}
                          />
                          {message.text && (
                            <p className={cn("text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] px-2 pt-1", isInternalNote(message) && "text-amber-900 dark:text-amber-100")}>
                              {message.text}
                            </p>
                          )}
                        </div>
                      ) : message.type === 'audio' && message.media_url ? (
                        <div className="space-y-2">
                          <InboxPrivateAudio
                            path={message.media_url}
                            isOutgoing={message.direction === 'outgoing'}
                            isInternalNote={isInternalNote(message)}
                            status={message.status}
                            sentAt={message.sent_at}
                          />
                          {message.text && (
                            <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                              {message.text}
                            </p>
                          )}
                        </div>
                      ) : message.type === 'location' && message.latitude != null && message.longitude != null ? (
                        <div className="space-y-1.5">
                          <div className="rounded-md overflow-hidden">
                            <iframe
                              src={`https://maps.google.com/maps?q=${message.latitude},${message.longitude}&z=15&output=embed`}
                              width="240"
                              height="160"
                              className="border-0 w-full"
                              loading="lazy"
                              allowFullScreen={false}
                            />
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-medium hover:underline",
                              message.direction === 'outgoing' ? "text-green-100" : "text-primary"
                            )}
                          >
                            <MapPin className="h-3 w-3" />
                            Open in Maps
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <div className={cn(
                            "flex items-center gap-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isInternalNote(message) ? "text-amber-600 dark:text-amber-400" :
                              message.direction === 'outgoing'
                                ? "text-green-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <span className="text-xs text-green-100">
                                • {message.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : message.type === 'document' && message.media_url ? (
                        <div className="space-y-1">
                          <InboxPrivateDocument
                            path={message.media_url}
                            fileName={message.text || 'Document'}
                            mimeType={message.media_mime}
                            fileSize={message.media_size}
                            isOutgoing={message.direction === 'outgoing'}
                            isInternalNote={isInternalNote(message)}
                            status={message.status}
                            sentAt={message.sent_at}
                          />
                        </div>
                      ) : message.type === 'contact' && message.metadata ? (
                        <div className="space-y-1">
                          <ContactMessage
                            contacts={
                              message.metadata.contacts
                                ? message.metadata.contacts.map((c) => ({
                                    contactName: c.contact_name || '',
                                    contactPhone: c.contact_phone || '',
                                  }))
                                : [{
                                    contactName: message.metadata.contact_name || message.text || '',
                                    contactPhone: message.metadata.contact_phone || '',
                                  }]
                            }
                            isOutgoing={message.direction === 'outgoing' && !isInternalNote(message)}
                            instanceId={chat.channelable_id ?? undefined}
                            channel={chat.channel}
                          />
                          <div className={cn(
                            "flex items-center gap-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isInternalNote(message) ? "text-amber-600 dark:text-amber-400" :
                              message.direction === 'outgoing'
                                ? "text-green-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <span className="text-xs text-green-100">
                                • {message.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={cn(
                            "text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
                            isInternalNote(message) && "text-amber-900 dark:text-amber-100"
                          )}>
                            {message.text}
                          </p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isInternalNote(message) ? "text-amber-600 dark:text-amber-400" :
                              message.direction === 'outgoing'
                                ? "text-green-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <span className="text-xs text-green-100">
                                • {message.status}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {message.direction === 'outgoing' && (
                      <InboxAvatar
                        profilePicPath={message.user?.profile_pic}
                        name={message.user?.name || 'Optomyze'}
                        size="sm"
                        icon={!message.user ? <Bot className="h-4 w-4" /> : undefined}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            ))}

            {/* Pending Messages */}
            {pendingMessages.map((pending) => (
              <motion.div
                key={pending.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2 justify-end"
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 shadow-sm rounded-br-none",
                    pending.status === 'error'
                      ? "bg-destructive/80 text-destructive-foreground"
                      : pending.messageMode === 'internal'
                        ? "bg-amber-100/70 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
                        : "bg-green-500/70 text-white"
                  )}
                >
                  {pending.messageMode === 'internal' && (
                    <div className="flex items-center gap-1 mb-1">
                      <StickyNote className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {t('chat.inbox.internal-note')}
                      </span>
                    </div>
                  )}
                  <p className={cn(
                    "text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
                    pending.messageMode === 'internal' && "text-amber-900 dark:text-amber-100"
                  )}>
                    {pending.text}
                  </p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    {pending.status === 'sending' ? (
                      <span className={cn(
                        "text-xs flex items-center gap-1",
                        pending.messageMode === 'internal' ? "text-amber-600 dark:text-amber-400" : "text-green-100"
                      )}>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('chat.inbox.sending')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRetry(pending)}
                        className="text-xs underline hover:no-underline"
                      >
                        {t('chat.inbox.retry')}
                      </button>
                    )}
                  </div>
                </div>
                <InboxAvatar
                  profilePicPath={currentUser?.profile_pic}
                  name={currentUser?.name || 'Optomyze'}
                  size="sm"
                  icon={!currentUser ? <Bot className="h-4 w-4" /> : undefined}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground mt-2">
              {t('chat.inbox.no-messages-in-chat')}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      {canSend ? (
        <div className="p-3 border-t border-border/50 bg-card">
          {/* Hidden image file input */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <MessageComposer
            value={messageText}
            onChange={setMessageText}
            onSend={handleSendMessage}
            placeholder={messageMode === 'internal' ? t('chat.inbox.type-internal-note') : t('chat.inbox.type-message')}
            disabled={!chat.lead?.id}
            isSending={isSending}
            mode={messageMode}
            onModeChange={setMessageMode}
            onAttach={() => imageInputRef.current?.click()}
            isAttaching={isSendingMedia}
            isRecording={isRecording}
            onToggleRecording={toggleRecording}
          />
        </div>
      ) : (
        <div className="p-4 border-t border-border/50 bg-card text-center text-sm text-muted-foreground">
          {t('chat.inbox.sending-not-available')}
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={lightboxImage}
              alt="Full size image"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Preview Modal */}
      <LeadPreviewModal
        isOpen={leadPreviewOpen}
        onClose={() => setLeadPreviewOpen(false)}
        leadId={chat?.lead?.id ? String(chat.lead.id) : null}
      />

      {/* Clear Messages Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chat.inbox.clear-messages')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chat.inbox.clear-messages-confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearMessages}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isClearing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('chat.inbox.clear-messages')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatConversation;
