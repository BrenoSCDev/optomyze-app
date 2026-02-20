import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, ChevronRight, MessageSquare, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { getEcho } from '@/services/echo';
import {
  ChatConversation, ChatContact, ChatMessage,
  fetchConversations, fetchContacts, openPrivateConversation, createGroupConversation,
} from '@/services/inboxChatApi';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import CreateGroupModal from './CreateGroupModal';
import optoIcon from '@/assets/opto-icon.png';

type MobileView = 'list' | 'thread';

const OptomyzeInbox: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep a ref so WebSocket callbacks can access latest conversations
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const selectedRef = useRef(selectedConversation);
  selectedRef.current = selectedConversation;

  // ─── Load data ───────────────────────────────────────────────────────────
  const loadInboxData = useCallback(async (showFullLoader = true) => {
    try {
      if (showFullLoader) setIsLoading(true);
      else setIsRefreshing(true);
      const [convs, conts] = await Promise.all([fetchConversations(), fetchContacts()]);
      setConversations(convs);
      setContacts(conts);
    } catch (err) {
      console.error('Failed to load inbox data:', err);
      toast({ title: 'Error', description: 'Failed to load inbox conversations.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { loadInboxData(true); }, []);

  // ─── Real-time: company channel ──────────────────────────────────────────
  useEffect(() => {
    const echo = getEcho();
    if (!echo || !user?.company_id) return;

    const companyChannel = echo.private(`company.${user.company_id}`);

    // Group created
    companyChannel.listen('.group.created', (payload: any) => {
      if (!payload?.id) return;
      const isParticipant = payload.participants?.some((p: any) => p.id === user.id);
      if (!isParticipant) return;

      const newConv: ChatConversation = {
        id: payload.id,
        type: 'group',
        name: payload.name,
        cover_image_url: payload.cover_image_url ?? null,
        participants: payload.participants.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email ?? '',
          role: p.role ?? '',
          profile_pic_url: p.profile_pic_url ?? null,
          conversation_role: p.conversation_role ?? 'member',
        })),
        last_message: null,
        last_message_at: null,
        created_at: payload.created_at,
      };

      setConversations(prev => {
        if (prev.some(c => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
    });

    // Group deleted
    companyChannel.listen('.group.deleted', (payload: any) => {
      if (!payload?.conversation_id) return;
      setConversations(prev => prev.filter(c => c.id !== payload.conversation_id));
      setSelectedConversation(prev => {
        if (prev?.id === payload.conversation_id) return null;
        return prev;
      });
    });

    // Group members added
    companyChannel.listen('.group.members.added', (payload: any) => {
      if (!payload?.conversation_id) return;

      // If user was just added to this group, add it to conversation list
      const isNewMember = payload.new_member_ids?.includes(user.id);

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === payload.conversation_id);
        if (idx !== -1) {
          // Update existing conversation's participants
          const updated = { ...prev[idx], participants: payload.participants ?? prev[idx].participants };
          return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
        }
        if (isNewMember) {
          // New group for this user
          const newConv: ChatConversation = {
            id: payload.conversation_id,
            type: 'group',
            name: payload.name,
            cover_image_url: payload.cover_image_url ?? null,
            participants: payload.participants ?? [],
            last_message: null,
            last_message_at: null,
            created_at: new Date().toISOString(),
          };
          return [newConv, ...prev];
        }
        return prev;
      });

      // Also update selected conversation if it matches
      setSelectedConversation(prev => {
        if (prev?.id === payload.conversation_id && payload.participants) {
          return { ...prev, participants: payload.participants };
        }
        return prev;
      });
    });

    return () => {
      echo.leave(`company.${user.company_id}`);
    };
  }, [user?.company_id, user?.id]);

  // ─── Real-time: private message notifications ───────────────────────────
  useEffect(() => {
    const echo = getEcho();
    if (!echo || !user?.id) return;

    const notifChannel = echo.private(`chat-notifications.${user.id}`);

    notifChannel.listen('.private.message.notification', (payload: any) => {
      if (!payload?.conversation_id) return;

      // Skip if the user is currently viewing this conversation
      if (selectedRef.current?.id === payload.conversation_id) return;

      // Show toast notification
      const senderName = payload.sender?.name ?? 'Someone';
      const preview = payload.preview ?? 'New message';

      toast({
        title: senderName,
        description: preview,
      });

      // Update conversation list: move to top with preview
      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === payload.conversation_id);
        if (idx === -1) return prev;
        const updated = {
          ...prev[idx],
          last_message_at: payload.created_at ?? new Date().toISOString(),
        };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    });

    return () => {
      echo.leave(`chat-notifications.${user.id}`);
    };
  }, [user?.id, toast]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const updateConversationWithMessage = useCallback((msg: ChatMessage) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === msg.conversation_id);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], last_message: msg, last_message_at: msg.created_at };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
    setSelectedConversation(prev => {
      if (prev && prev.id === msg.conversation_id) {
        return { ...prev, last_message: msg, last_message_at: msg.created_at };
      }
      return prev;
    });
  }, []);

  const handleSelectConversation = useCallback((conv: ChatConversation) => {
    setSelectedConversation(conv);
    setMobileView('thread');
  }, []);

  const handleContactClick = useCallback(async (contact: ChatContact) => {
    try {
      const conv = await openPrivateConversation(contact.id);
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev;
        return [conv, ...prev];
      });
      setSelectedConversation(conv);
      setMobileView('thread');
    } catch (err) {
      console.error('Failed to open private conversation:', err);
      toast({ title: 'Error', description: 'Failed to open conversation.', variant: 'destructive' });
    }
  }, [toast]);

  const handleCreateGroup = useCallback(async (name: string, memberIds: number[], coverImage?: File) => {
    try {
      const conv = await createGroupConversation(name, memberIds, coverImage);
      setConversations(prev => {
        if (prev.some(c => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      setSelectedConversation(conv);
      setMobileView('thread');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors || 'Failed to create group.';
      toast({ title: 'Error', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    }
  }, [toast]);

  const handleMessageSent = useCallback((msg: ChatMessage) => {
    updateConversationWithMessage(msg);
  }, [updateConversationWithMessage]);

  const handleConversationUpdated = useCallback((conv: ChatConversation) => {
    setConversations(prev => prev.map(c => c.id === conv.id ? conv : c));
    setSelectedConversation(prev => prev?.id === conv.id ? conv : prev);
  }, []);

  const handleConversationDeleted = useCallback((convId: number) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    setSelectedConversation(prev => prev?.id === convId ? null : prev);
  }, []);

  const { t } = useLanguage();
  const totalConversations = conversations.length;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm shadow-xl">
      {/* Enhanced header */}
      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/40 bg-card/80 shrink-0">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
          <img src={optoIcon} alt="Optomyze" className="w-5 h-5" />
        </div>

        {/* Title + breadcrumbs */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <h1 className="text-sm font-semibold text-foreground leading-tight">Optomyze Inbox</h1>
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Home className="w-3 h-3 shrink-0" />
            <ChevronRight className="w-2.5 h-2.5 shrink-0 opacity-50" />
            <span>Inboxes</span>
            <ChevronRight className="w-2.5 h-2.5 shrink-0 opacity-50" />
            <span className="text-foreground/80 font-medium truncate">Optomyze Inbox</span>
          </nav>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2.5">
          {/* Conversation count */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/30">
            <MessageSquare className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{totalConversations}</span>
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadInboxData(false)}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/30 transition-all disabled:opacity-40"
            title="Refresh inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_1px] shadow-emerald-500/40" />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Desktop: side-by-side */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="w-72 lg:w-80 border-r border-border/40 shrink-0 overflow-hidden">
            <ConversationList
              conversations={conversations}
              contacts={contacts}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onContactClick={handleContactClick}
              onOpenCreateGroup={() => setShowCreateGroup(true)}
              isLoading={isLoading}
            />
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden">
            <MessageThread
              conversation={selectedConversation}
              contacts={contacts}
              onMessageSent={handleMessageSent}
              onConversationUpdated={handleConversationUpdated}
              onConversationDeleted={handleConversationDeleted}
            />
          </div>
        </div>

        {/* Mobile: single column with animation */}
        <div className="flex md:hidden flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {mobileView === 'list' && (
              <motion.div
                key="list"
                className="w-full overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ConversationList
                  conversations={conversations}
                  contacts={contacts}
                  selectedConversation={selectedConversation}
                  onSelectConversation={handleSelectConversation}
                  onContactClick={handleContactClick}
                  onOpenCreateGroup={() => setShowCreateGroup(true)}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {mobileView === 'thread' && (
              <motion.div
                key="thread"
                className="w-full overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <MessageThread
                  conversation={selectedConversation}
                  contacts={contacts}
                  onBack={() => setMobileView('list')}
                  showBackButton
                  onMessageSent={handleMessageSent}
                  onConversationUpdated={handleConversationUpdated}
                  onConversationDeleted={handleConversationDeleted}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
        contacts={contacts}
      />
    </div>
  );
};

export default OptomyzeInbox;
