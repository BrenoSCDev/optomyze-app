/**
 * CHAT CONVERSATION COMPONENT
 *
 * Center panel displaying the message thread for the Global Inbox.
 *
 * NOTE: outgoing bubble colors use a blue accent as the default look for the
 * only implemented channel. Per-channel theming is future work once
 * Instagram/Messenger/SMS sending is implemented.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, ArrowLeft, Send, Loader2, X, MapPin, ExternalLink, StickyNote, Trash2, Inbox, Bot, Check, CheckCheck, Clock, AlertCircle, Smile, Captions, AtSign, CircleSlash, Settings, Star, Archive, ArchiveRestore, EyeOff } from 'lucide-react';
import { HiOutlineDevicePhoneMobile } from 'react-icons/hi2';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InboxChat, InboxMessage } from '@/types/inbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, extractTime } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phone';
import { sendInboxMessage, sendInboxMedia, sendInstagramMessage,
  sendWebsiteChatMessage, sendInstagramMedia, clearInboxChatMessages, fetchInboxChatMessages, sendInboxReaction, transcribeInboxMessage, updateChatAiAgentService } from '@/services/globalInboxApi';
import { toast } from '@/hooks/use-toast';
import AudioPlayer from './AudioPlayer';
import DocumentMessage from './DocumentMessage';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import ContactMessage from './ContactMessage';
import InboxAvatar from './InboxAvatar';
import MessageComposer from './MessageComposer';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import EndConversationDialog from './EndConversationDialog';
import ProductMessage, { ProductDetails } from './ProductMessage';
import { ChatSession } from '@/types/inbox';
import { fetchActiveSession } from '@/services/chatSessionApi';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfileModal } from '@/contexts/UserProfileModalContext';
import { useOnlinePresence } from '@/contexts/PresenceContext';
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
import { onLeadTransaction } from '@/contexts/NotificationContext';
import { recordsApi } from '@/services/recordsApi';
import { adaptRecord, adaptLeadTransactionPayload, AUTOMATION_ACTOR, type ActivityEvent } from '@/components/activity/types';
import { resolveActivityRegistryEntry } from '@/components/activity/registry';

/** Renders WhatsApp-style delivery ticks for an outgoing message's status. */
const MessageStatusTicks: React.FC<{ status?: string; variant?: 'onBlue' | 'subtle' }> = ({ status, variant = 'onBlue' }) => {
  const baseColor = variant === 'onBlue' ? 'text-blue-100' : 'text-muted-foreground';
  const readColor = variant === 'onBlue' ? 'text-sky-300' : 'text-blue-500';
  const failedColor = variant === 'onBlue' ? 'text-red-200' : 'text-red-500';

  switch (status) {
    case 'pending':
      return <Clock className={cn('h-3 w-3', baseColor)} />;
    case 'sent':
      return <Check className={cn('h-3 w-3', baseColor)} />;
    case 'delivered':
      return <CheckCheck className={cn('h-3 w-3', baseColor)} />;
    case 'read':
      return <CheckCheck className={cn('h-3 w-3', readColor)} />;
    case 'failed':
      return <AlertCircle className={cn('h-3 w-3', failedColor)} />;
    default:
      return null;
  }
};

/** Renders a lead `Record` (stage change, assignment, note, etc.) inline in the conversation timeline. */
const LeadRecordLogEntry: React.FC<{ event: ActivityEvent }> = ({ event }) => {
  const { t } = useLanguage();
  const entry = resolveActivityRegistryEntry(event);
  const Icon = entry.icon;
  const actorName = event.actor.isSystem
    ? t(event.actor.name === AUTOMATION_ACTOR ? 'activity.actor.automation' : 'activity.actor.system')
    : event.actor.name;

  return (
    <div className="flex justify-center py-1">
      <div className="flex items-start gap-1.5 max-w-[85%] px-2">
        <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', entry.iconColor)} />
        <p className="text-xs text-muted-foreground leading-snug">
          <span className="font-medium text-foreground">{t(entry.titleKey)}</span>
          {event.description && <>: {event.description}</>}
          <span className="text-muted-foreground/70"> · {extractTime(event.createdAt)} · {actorName}</span>
        </p>
      </div>
    </div>
  );
};

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
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : direction === 'outgoing' ? 'text-blue-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {direction === 'outgoing' && status && !isInternalNote && (
          <MessageStatusTicks status={status} variant="onBlue" />
        )}
      </div>
    </div>
  );
};

/** Renders an audio message fetched through the authenticated backend. */
const InboxPrivateAudio: React.FC<{
  path: string;
  messageId: number;
  transcription?: string | null;
  isOutgoing: boolean;
  isInternalNote: boolean;
  status?: string;
  sentAt: string;
}> = ({ path, messageId, transcription, isOutgoing, isInternalNote, status, sentAt }) => {
  const url = usePrivateFile(path);
  const { t } = useLanguage();
  const [localTranscription, setLocalTranscription] = useState(transcription ?? null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    setLocalTranscription(transcription ?? null);
  }, [transcription]);

  const handleTranscribe = async () => {
    setIsTranscribing(true);
    try {
      const result = await transcribeInboxMessage(messageId);
      setLocalTranscription(result.transcription);
    } catch {
      toast({ title: t('chat.inbox.transcription-error'), variant: 'destructive' });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="space-y-2">
      {url ? (
        <AudioPlayer src={url} isOutgoing={isOutgoing} />
      ) : (
        <div className="w-48 h-10 rounded-md bg-muted/40 animate-pulse" />
      )}
      {/* Transcribe option hidden until OpenAI is configured - logic kept for later */}
      <div className={cn('flex items-center gap-1', isOutgoing ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : isOutgoing ? 'text-blue-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOutgoing && status && !isInternalNote && (
          <MessageStatusTicks status={status} variant="onBlue" />
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
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : isOutgoing ? 'text-blue-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOutgoing && status && !isInternalNote && (
          <MessageStatusTicks status={status} variant="onBlue" />
        )}
      </div>
    </div>
  );
};

/** Renders a sticker (animated/static webp) fetched through the authenticated backend.
 *  Stickers have no chat-bubble chrome - just the image and a timestamp. */
const InboxPrivateSticker: React.FC<{
  path: string;
  direction: string;
  isInternalNote: boolean;
  status?: string;
  sentAt: string;
}> = ({ path, direction, isInternalNote, status, sentAt }) => {
  const url = usePrivateFile(path);

  return (
    <div className="space-y-1">
      {url ? (
        <img src={url} alt="Sticker" className="w-32 h-32 object-contain" loading="lazy" />
      ) : (
        <div className="w-32 h-32 rounded-md bg-muted/40 animate-pulse" />
      )}
      <div className={cn('flex items-center gap-1 px-1', direction === 'outgoing' ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {direction === 'outgoing' && status && !isInternalNote && (
          <MessageStatusTicks status={status} variant="subtle" />
        )}
      </div>
    </div>
  );
};

/** Renders a video message fetched through the authenticated backend.
 *  A WhatsApp "GIF" is a looping mp4 videoMessage under the hood (isGif),
 *  so it plays back muted/looping with no controls, like a real GIF. */
const InboxPrivateVideo: React.FC<{
  path: string;
  isGif: boolean;
  caption?: string | null;
  isInternalNote: boolean;
  direction: string;
  status?: string;
  sentAt: string;
}> = ({ path, isGif, caption, isInternalNote, direction, status, sentAt }) => {
  const url = usePrivateFile(path);
  const videoRef = useRef<HTMLVideoElement>(null);

  // React's `muted` JSX prop only sets the initial attribute, not the live
  // DOM property browsers check for autoplay - without setting it
  // imperatively first, Chrome/Safari silently block autoplay and the GIF
  // is left stuck on a blank frame. Setting it on the element directly
  // before calling play() is the reliable fix.
  useEffect(() => {
    if (!isGif || !url) return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // Autoplay still blocked (e.g. browser setting) - clicking the
      // element falls back to a manual, still-muted play below.
    });
  }, [isGif, url]);

  return (
    <div className="space-y-1">
      {url ? (
        <video
          ref={videoRef}
          src={url}
          className="rounded-md max-w-full max-h-64 object-contain"
          controls={!isGif}
          autoPlay={isGif}
          loop={isGif}
          muted={isGif}
          playsInline
          preload="auto"
          onClick={() => {
            if (isGif) videoRef.current?.play().catch(() => {});
          }}
        />
      ) : (
        <div className="w-48 h-32 rounded-md bg-muted/40 animate-pulse" />
      )}
      {caption && (
        <p className={cn('text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] px-2 pt-1', isInternalNote && 'text-amber-900 dark:text-amber-100')}>
          {caption}
        </p>
      )}
      <div className={cn('flex items-center gap-1 px-2 pb-1', direction === 'outgoing' ? 'justify-end' : 'justify-start')}>
        <span className={cn('text-xs', isInternalNote ? 'text-amber-600 dark:text-amber-400' : direction === 'outgoing' ? 'text-blue-100' : 'text-muted-foreground')}>
          {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {direction === 'outgoing' && status && !isInternalNote && (
          <MessageStatusTicks status={status} variant="onBlue" />
        )}
      </div>
    </div>
  );
};

/**
 * One action in the conversation header.
 *
 * The tooltip is the button's only label, so it doubles as the accessible
 * name. A disabled trigger swallows pointer events — and with them the
 * tooltip — so the wrapper stays focusable and the explanation survives:
 * "why is this greyed out" is exactly when the label is most wanted.
 */
const ChatHeaderAction: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ label, onClick, disabled = false, className, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
        >
          {children}
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent side="bottom">{label}</TooltipContent>
  </Tooltip>
);

interface ChatConversationProps {
  chat: InboxChat | null;
  onBack?: () => void;
  showBackButton?: boolean;
  onMessageSent?: (message: InboxMessage) => void;
  /** Hide the "open lead preview" link/modal - useful when already embedded in that lead's own page. */
  hideLeadPreview?: boolean;
  /** Pin/unpin and archive/restore, mirrored from the conversation list. */
  onToggleFavorite?: (chat: InboxChat) => void;
  onToggleArchived?: (chat: InboxChat) => void;
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
  onMessageSent,
  hideLeadPreview = false,
  onToggleFavorite,
  onToggleArchived
}) => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const { handleChatCleared, handleChatUpdated, chats: contextChats } = useInbox();
  const { openUserProfile } = useUserProfileModal();
  const { isUserOnline } = useOnlinePresence();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [leadPreviewOpen, setLeadPreviewOpen] = useState(false);
  const [messageMode, setMessageMode] = useState<'external' | 'internal'>('external');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [showEndConversation, setShowEndConversation] = useState(false);

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

  // Lead activity (Record) log entries shown inline in the timeline
  const [leadActivityEvents, setLeadActivityEvents] = useState<ActivityEvent[]>([]);
  const leadActivityIdsRef = useRef<Set<string>>(new Set());

  const getViewport = useCallback(() =>
    scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null,
  []);

  const scrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [getViewport]);

  // Load messages when chat changes
  useEffect(() => {
    setPendingMessages([]);

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

  // Load the lead's Record log (stage changes, assignments, notes, etc.) when chat changes
  useEffect(() => {
    leadActivityIdsRef.current = new Set();
    const leadId = chat?.lead?.id;
    if (!leadId) {
      setLeadActivityEvents([]);
      return;
    }
    let cancelled = false;
    recordsApi.fetchRecordsForLead(leadId)
      .then(res => {
        if (cancelled) return;
        const events = res.records.map(r => adaptRecord(r, 'lead'));
        events.forEach(e => leadActivityIdsRef.current.add(e.id));
        setLeadActivityEvents(events);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [chat?.lead?.id]);

  // Live-append new Record log entries for this lead as they're created elsewhere in the app
  useEffect(() => {
    const leadId = chat?.lead?.id;
    if (!leadId) return;
    return onLeadTransaction((payload) => {
      if (payload.lead?.id !== leadId) return;
      const event = adaptLeadTransactionPayload(payload);
      if (leadActivityIdsRef.current.has(event.id)) return;
      leadActivityIdsRef.current.add(event.id);
      setLeadActivityEvents(prev => [...prev, event]);
      setTimeout(scrollToBottom, 50);
    });
  }, [chat?.lead?.id, scrollToBottom]);

  // AI agent ownership: live flag from context (updated via inbox.chat.updated
  // broadcasts and the toggle below), bound agent from the chat payload.
  const [togglingAi, setTogglingAi] = useState(false);
  const liveContextChat = chat ? contextChats.find(c => c.id === chat.id) : null;
  const aiAgentActive = (liveContextChat?.ai_agent_service ?? chat?.ai_agent_service) === true;
  const boundAgent = liveContextChat?.bound_agent ?? chat?.bound_agent ?? null;

  const handleToggleAiAgent = async () => {
    if (!chat || togglingAi) return;

    setTogglingAi(true);
    try {
      const response = await updateChatAiAgentService(chat.id, !aiAgentActive);
      // Broadcast goes toOthers — apply the change locally through the
      // same context path so every view stays in sync.
      handleChatUpdated({
        chat: {
          id: chat.id,
          lead_id: chat.lead_id,
          ai_agent_service: response.chat.ai_agent_service,
        },
        timestamp: new Date().toISOString(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: t('chat.inbox.ai-agent-toggle-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setTogglingAi(false);
    }
  };

  // Track the chat's active ChatSession (drives the "End Conversation" menu item)
  const liveChatLastMessageAt = chat ? contextChats.find(c => c.id === chat.id)?.last_message_at ?? chat.last_message_at : null;
  useEffect(() => {
    if (!chat) {
      setActiveSession(null);
      return;
    }
    let cancelled = false;
    fetchActiveSession(chat.id)
      .then(data => { if (!cancelled) setActiveSession(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [chat?.id, liveChatLastMessageAt]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Sync in-place updates (reactions, edited flag, delivery status) for messages already shown
  useEffect(() => {
    if (!chat) return;
    const contextChat = contextChats.find(c => c.id === chat.id);
    if (!contextChat?.messages?.length) return;

    setLocalMessages(prev => {
      let changed = false;
      const updated = prev.map(m => {
        const match = contextChat.messages.find(cm => cm.id === m.id);
        if (match && (match.reactions !== m.reactions || match.is_edited !== m.is_edited || match.status !== m.status || match.text !== m.text || match.transcription !== m.transcription)) {
          changed = true;
          return { ...m, text: match.text, reactions: match.reactions, is_edited: match.is_edited, status: match.status, transcription: match.transcription };
        }
        return m;
      });
      return changed ? updated : prev;
    });
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
    if (chat.channel !== 'instagram' && chat.channel !== 'website' && !chat?.lead?.id) {
      return;
    }

    const text = messageText.trim();
    const tempId = `pending-${Date.now()}`;
    const currentMode = messageMode;

    setMessageText('');
    setIsSending(true);
    setPendingMessages(prev => [...prev, { id: tempId, text, status: 'sending', messageMode: currentMode }]);

    try {
      const response = chat.channel === 'website'
        ? await sendWebsiteChatMessage(chat.id, text, currentMode)
        : chat.channel === 'instagram'
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
        reply_to_message_id: response.message.reply_to_message_id,
        reply_to_snapshot: response.message.reply_to_snapshot,
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

  // A single chat timeline entry: either an inbox message or a lead Record log
  type TimelineItem =
    | { kind: 'message'; ts: string; message: InboxMessage }
    | { kind: 'record'; ts: string; event: ActivityEvent };

  /** Merges messages + lead activity records into one chronological, date-grouped timeline. */
  const buildTimelineGroups = (messages: InboxMessage[], events: ActivityEvent[]) => {
    // Records (e.g. "Conversation Started") are always created in the backend
    // before the message that triggered them, but can land on the same
    // second-precision timestamp. List events first so the stable sort below
    // keeps records ahead of same-timestamp messages.
    const items: TimelineItem[] = [
      ...events.map((event): TimelineItem => ({ kind: 'record', ts: event.createdAt, event })),
      ...messages.map((message): TimelineItem => ({ kind: 'message', ts: message.sent_at, message })),
    ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const groups: { date: string; items: TimelineItem[] }[] = [];
    let currentDate = '';

    items.forEach((item) => {
      const itemDate = new Date(item.ts).toDateString();
      if (itemDate !== currentDate) {
        currentDate = itemDate;
        groups.push({ date: item.ts, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });

    return groups;
  };

  const isInternalNote = (message: InboxMessage) => message.message_mode === 'internal';

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  // Instagram's Send API only accepts a fixed set of reaction types (love/like/smile/wow/sad/angry)
  const INSTAGRAM_QUICK_REACTIONS = ['👍', '❤️', '😆', '😮', '😢', '😠'];

  const handleReact = async (message: InboxMessage, emoji: string) => {
    const currentEmoji = message.reactions?.agent?.emoji;
    const newEmoji = currentEmoji === emoji ? '' : emoji;

    try {
      const response = await sendInboxReaction(message.id, newEmoji);
      const updatedReactions = response.message.reactions;

      setLocalMessages(prev => prev.map(m => m.id === message.id ? { ...m, reactions: updatedReactions } : m));
    } catch (error: any) {
      toast({
        title: t('chat.inbox.reaction-error'),
        description: error?.response?.data?.message || '',
        variant: 'destructive',
      });
    }
  };

  const getReplyPreviewLabel = (snapshot: { type?: string | null; text?: string | null }): string => {
    if (snapshot.text) return snapshot.text;
    switch (snapshot.type) {
      case 'image': return t('chat.inbox.reply-photo');
      case 'video': return t('chat.inbox.reply-video');
      case 'audio': return t('chat.inbox.reply-audio');
      case 'sticker': return t('chat.inbox.reply-sticker');
      case 'document': return t('chat.inbox.reply-document');
      case 'location': return t('chat.inbox.reply-location');
      case 'contact': return t('chat.inbox.reply-contact');
      case 'product': return t('chat.inbox.product');
      case 'story_reply': return t('chat.inbox.reply-story');
      case 'ephemeral': return t('chat.inbox.reply-ephemeral');
      default: return t('chat.inbox.reply-message');
    }
  };

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

  const timelineGroups = buildTimelineGroups(localMessages, leadActivityEvents);
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
            {chat.lead?.id && !hideLeadPreview ? (
              <button onClick={() => setLeadPreviewOpen(true)} className="font-semibold truncate hover:underline hover:text-primary transition-colors block text-left max-w-full">
                {getLeadName()}
              </button>
            ) : (
              <h3 className="font-semibold truncate">{getLeadName()}</h3>
            )}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              {chat.channel === 'instagram' && chat.lead?.username ? (
                <>
                  <AtSign className="h-3 w-3 shrink-0" />
                  <span className="truncate">{chat.lead.username}</span>
                </>
              ) : (
                <>
                  <Phone className="h-3 w-3 shrink-0" />
                  <span className="truncate">{chat.channel === 'whatsapp' ? formatPhoneNumber(chat.external_contact_id) : chat.external_contact_id}</span>
                </>
              )}
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
              {boundAgent && aiAgentActive && (
                <Badge className="text-[10px] px-1.5 py-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                  <Bot className="h-3 w-3" />
                  {t('chat.inbox.ai-agent-active')}
                </Badge>
              )}
            </div>
          </div>
          {/*
            Chat actions, laid out as icon buttons rather than hidden behind a
            menu. Each one names itself on hover and to screen readers, since
            an icon alone does not say what it does — and a disabled action
            still explains why it is unavailable.
          */}
          <div className="flex shrink-0 items-center gap-0.5">
            {onToggleFavorite && (
              <ChatHeaderAction
                label={chat.is_favorite ? t('chat.inbox.unfavorite') : t('chat.inbox.favorite')}
                onClick={() => onToggleFavorite(chat)}
                className={chat.is_favorite ? 'text-amber-500 hover:text-amber-500' : undefined}
              >
                <Star className={cn('h-4 w-4', chat.is_favorite && 'fill-amber-400')} />
              </ChatHeaderAction>
            )}

            {onToggleArchived && (
              <ChatHeaderAction
                label={chat.is_archived ? t('chat.inbox.unarchive') : t('chat.inbox.archive')}
                onClick={() => onToggleArchived(chat)}
              >
                {chat.is_archived
                  ? <ArchiveRestore className="h-4 w-4" />
                  : <Archive className="h-4 w-4" />}
              </ChatHeaderAction>
            )}

            <ChatHeaderAction
              label={aiAgentActive ? t('chat.inbox.ai-agent-pause') : t('chat.inbox.ai-agent-activate')}
              onClick={handleToggleAiAgent}
              disabled={!boundAgent || togglingAi}
              className={aiAgentActive ? 'text-emerald-600 hover:text-emerald-600 dark:text-emerald-400' : undefined}
            >
              {togglingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
            </ChatHeaderAction>

            <ChatHeaderAction
              label={t('chat.inbox.end-conversation')}
              onClick={() => setShowEndConversation(true)}
              disabled={!activeSession}
            >
              <CircleSlash className="h-4 w-4" />
            </ChatHeaderAction>

            {/* Still opens a confirmation, so a mis-click destroys nothing. */}
            <ChatHeaderAction
              label={t('chat.inbox.clear-messages')}
              onClick={() => setShowClearConfirm(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </ChatHeaderAction>
          </div>
        </div>
      </div>

      {activeSession && (
        <EndConversationDialog
          open={showEndConversation}
          onOpenChange={setShowEndConversation}
          chatId={chat.id}
          session={activeSession}
          onClosed={() => setActiveSession(null)}
        />
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4 w-full overflow-x-hidden" ref={scrollAreaRef} scrollbarVariant="dark">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : localMessages.length > 0 || leadActivityEvents.length > 0 ? (
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

            {timelineGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center justify-center">
                  <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {formatMessageDate(group.date)}
                  </span>
                </div>

                {/* Messages + lead activity log entries, interleaved chronologically */}
                {group.items.map((item, itemIndex) => {
                  if (item.kind === 'record') {
                    return <LeadRecordLogEntry key={`record-${item.event.id}`} event={item.event} />;
                  }
                  const message = item.message;
                  const messageIndex = itemIndex;
                  return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: messageIndex * 0.03 }}
                    className={cn(
                      "group flex items-end gap-2",
                      message.reactions && Object.keys(message.reactions).length > 0 && "mb-2",
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
                    <div className="relative max-w-[75%]">
                    {/* WhatsApp reactions are temporarily hidden — not working correctly yet. Code kept intact for Instagram and for re-enabling later. */}
                    {chat.channel === 'instagram' && !isInternalNote(message) && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        message.direction === 'outgoing' ? "-left-8" : "-right-8"
                      )}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded-full bg-card border border-border/60 shadow-sm hover:bg-muted"
                          >
                            <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-1"
                          side="top"
                          align={message.direction === 'outgoing' ? 'end' : 'start'}
                        >
                          <div className="flex gap-1">
                            {(chat.channel === 'instagram' ? INSTAGRAM_QUICK_REACTIONS : QUICK_REACTIONS).map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleReact(message, emoji)}
                                className={cn(
                                  "text-lg p-1 rounded hover:bg-surface-3 transition-colors duration-fast ease-standard",
                                  message.reactions?.agent?.emoji === emoji && "bg-muted"
                                )}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg shadow-sm overflow-hidden",
                        message.type === 'image' ? "p-1" :
                        message.type === 'video' ? "p-1" :
                        message.type === 'audio' ? "px-2 py-1.5" :
                        message.type === 'location' ? "p-2" :
                        message.type === 'document' ? "p-2" :
                        message.type === 'sticker' ? "p-0" :
                        message.type === 'product' ? "p-2" :
                        message.type === 'contact' ? "p-3" : "p-3",
                        message.type === 'sticker'
                          ? "bg-transparent border-0 shadow-none"
                          : isInternalNote(message)
                            ? "bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-br-none"
                            : message.direction === 'outgoing'
                              ? "bg-blue-400 text-white rounded-br-none"
                              : "bg-card border border-border/50 rounded-bl-none"
                      )}
                    >
                      {/* Reply / quoted-message preview */}
                      {message.reply_to_snapshot && (
                        <div className={cn(
                          "mb-1.5 px-2 py-1 rounded border-l-2 text-xs overflow-hidden",
                          message.type === 'sticker'
                            ? "bg-muted/70 border-primary/40 text-foreground/80"
                            : isInternalNote(message)
                              ? "bg-amber-200/40 dark:bg-amber-950/30 border-amber-400/60 text-amber-900/80 dark:text-amber-100/80"
                              : message.direction === 'outgoing'
                                ? "bg-surface-3 border-blue-100/60 text-blue-50"
                                : "bg-muted/60 border-primary/40 text-foreground/70"
                        )}>
                          <p className="truncate">{getReplyPreviewLabel(message.reply_to_snapshot)}</p>
                        </div>
                      )}

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
                            messageId={message.id}
                            transcription={message.transcription}
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
                              message.direction === 'outgoing' ? "text-blue-100" : "text-primary"
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
                                ? "text-blue-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <MessageStatusTicks status={message.status} variant="onBlue" />
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
                      ) : message.type === 'sticker' && message.media_url ? (
                        <InboxPrivateSticker
                          path={message.media_url}
                          direction={message.direction}
                          isInternalNote={isInternalNote(message)}
                          status={message.status}
                          sentAt={message.sent_at}
                        />
                      ) : message.type === 'video' && message.media_url ? (
                        <InboxPrivateVideo
                          path={message.media_url}
                          isGif={!!message.metadata?.gif_playback}
                          caption={message.text}
                          isInternalNote={isInternalNote(message)}
                          direction={message.direction}
                          status={message.status}
                          sentAt={message.sent_at}
                        />
                      ) : message.type === 'ephemeral' ? (
                        /* Meta never provides a URL for view-once media, so
                           there is nothing to fetch — say what arrived. */
                        <div className="flex items-center gap-2 py-0.5">
                          <EyeOff className="h-4 w-4 shrink-0 opacity-70" />
                          <span className="text-sm italic opacity-90">
                            {t('chat.inbox.ephemeral-media')}
                          </span>
                          <span className={cn(
                            "text-xs",
                            message.direction === 'outgoing' ? "text-blue-100" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(message.sent_at)}
                          </span>
                        </div>
                      ) : message.type === 'product' ? (
                        <div className="space-y-1">
                          <ProductMessage
                            product={(message.metadata ?? {}) as ProductDetails}
                            mediaPath={message.media_url}
                            fallbackTitle={message.text}
                            isOutgoing={message.direction === 'outgoing' && !isInternalNote(message)}
                          />
                          <div className={cn(
                            "flex items-center gap-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              message.direction === 'outgoing' ? "text-blue-100" : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <MessageStatusTicks status={message.status} variant="onBlue" />
                            )}
                          </div>
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
                                ? "text-blue-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <MessageStatusTicks status={message.status} variant="onBlue" />
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
                                ? "text-blue-100"
                                : "text-muted-foreground"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.is_edited && (
                              <span className={cn(
                                "text-xs italic",
                                isInternalNote(message) ? "text-amber-600/70 dark:text-amber-400/70" :
                                message.direction === 'outgoing'
                                  ? "text-blue-100/80"
                                  : "text-muted-foreground/70"
                              )}>
                                {t('chat.inbox.edited')}
                              </span>
                            )}
                            {message.direction === 'outgoing' && message.status && !isInternalNote(message) && (
                              <MessageStatusTicks status={message.status} variant="onBlue" />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Reaction badges */}
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className={cn(
                        "absolute -bottom-2.5 flex items-center gap-0.5 bg-card border border-border/60 rounded-full px-1.5 py-0.5 shadow-sm z-10",
                        message.direction === 'outgoing' ? "right-1" : "left-1"
                      )}>
                        {Object.values(message.reactions).map((reaction, i) => (
                          <span key={i} className="text-xs leading-none">{reaction.emoji}</span>
                        ))}
                      </div>
                    )}
                    </div>
                    {message.direction === 'outgoing' && (() => {
                      // Resolve the outbound sender by explicit source, with
                      // fallbacks for messages broadcast before `source` existed.
                      const source = message.source;
                      let kind: 'user' | 'ai_agent' | 'automation' | 'external';
                      if (message.user || source === 'user') kind = 'user';
                      else if (source === 'ai_agent' || message.ai_agent_id) kind = 'ai_agent';
                      else if (source === 'automation') kind = 'automation';
                      else kind = 'external';

                      const senderName =
                        kind === 'user' ? (message.user?.name || 'Optomyze')
                        : kind === 'ai_agent' ? (message.ai_agent?.name || (boundAgent?.name) || t('chat.inbox.sender-ai'))
                        : kind === 'automation' ? t('chat.inbox.sender-automation')
                        : t('chat.inbox.sender-external');

                      const icon =
                        kind === 'ai_agent' ? <Bot className="h-4 w-4" />
                        : kind === 'automation' ? <Settings className="h-4 w-4" />
                        : kind === 'external' ? <HiOutlineDevicePhoneMobile className="h-4 w-4" />
                        : undefined;

                      // Live online/offline dot for human senders (reuses the
                      // company presence channel).
                      const userOnline = kind === 'user' && message.user ? isUserOnline(message.user.id) : false;

                      const avatar = (
                        <span className="relative inline-block">
                          <InboxAvatar
                            profilePicPath={kind === 'user' ? message.user?.profile_pic : undefined}
                            name={senderName}
                            size="sm"
                            icon={icon}
                          />
                          {kind === 'user' && message.user && (
                            <span
                              className={cn(
                                'absolute bottom-0 right-0.5 h-2 w-2 rounded-full ring-2 ring-background',
                                userOnline ? 'bg-green-500' : 'bg-muted-foreground'
                              )}
                            />
                          )}
                        </span>
                      );

                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {kind === 'user' && message.user ? (
                              <button
                                type="button"
                                onClick={() => openUserProfile(message.user!.id)}
                                className="rounded-full transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                {avatar}
                              </button>
                            ) : (
                              <span>{avatar}</span>
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {senderName}
                            {kind === 'user' && (
                              <span className="text-muted-foreground"> · {userOnline ? t('users.status.online') : t('users.status.offline')}</span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })()}
                  </motion.div>
                  );
                })}
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
                        : "bg-blue-400/70 text-white"
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
                        pending.messageMode === 'internal' ? "text-amber-600 dark:text-amber-400" : "text-blue-100"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    {currentUser ? (
                      <button
                        type="button"
                        onClick={() => openUserProfile(currentUser.id)}
                        className="rounded-full transition-colors duration-fast ease-standard hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="relative inline-block">
                          <InboxAvatar
                            profilePicPath={currentUser.profile_pic}
                            name={currentUser.name || 'Optomyze'}
                            size="sm"
                          />
                          <span
                            className={cn(
                              'absolute bottom-0 right-0.5 h-2 w-2 rounded-full ring-2 ring-background',
                              isUserOnline(currentUser.id) ? 'bg-green-500' : 'bg-muted-foreground'
                            )}
                          />
                        </span>
                      </button>
                    ) : (
                      <span>
                        <InboxAvatar
                          profilePicPath={undefined}
                          name="Optomyze"
                          size="sm"
                          icon={<Bot className="h-4 w-4" />}
                        />
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top">{currentUser?.name || 'Optomyze'}</TooltipContent>
                </Tooltip>
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
            // Website chat is text-only for now — hide the media affordances
            // rather than offering actions the channel can't deliver.
            onAttach={chat.channel === 'website' ? undefined : () => imageInputRef.current?.click()}
            isAttaching={isSendingMedia}
            onSendAudio={chat.channel === 'website' ? undefined : (file) => handleSendMedia(file, 'audio', messageMode)}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/95 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-surface-3 z-10"
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
      {!hideLeadPreview && (
        <LeadPreviewModal
          isOpen={leadPreviewOpen}
          onClose={() => setLeadPreviewOpen(false)}
          leadId={chat?.lead?.id ? String(chat.lead.id) : null}
        />
      )}

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
