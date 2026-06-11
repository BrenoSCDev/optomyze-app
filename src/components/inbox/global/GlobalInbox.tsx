/**
 * GLOBAL INBOX COMPONENT
 *
 * Provides a channel-agnostic inbox aggregating conversations from all
 * connected messaging channels (WhatsApp today; Instagram, Messenger, SMS in
 * the future) with:
 * - 3-panel layout: Chat list, Conversation, Details
 * - Channel filter bar (All / WhatsApp / Instagram / Messenger / SMS)
 * - Real-time updates via WebSocket
 * - Responsive design for desktop, tablet, and mobile
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Inbox as InboxIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useInbox } from '@/contexts/InboxContext';
import { fetchInboxChats } from '@/services/globalInboxApi';
import { InboxChannel, InboxChat, InboxMessage } from '@/types/inbox';
import ChannelFilterBar from './ChannelFilterBar';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import ChatDetails from './ChatDetails';
import StartConversationModal from './StartConversationModal';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'conversation' | 'details';

const GlobalInbox: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  // Use Inbox context for state management and real-time updates
  const {
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    isLoading,
    setIsLoading
  } = useInbox();

  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<ViewMode>('list');
  const [showStartModal, setShowStartModal] = useState(false);
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
  const [channelFilter, setChannelFilter] = useState<InboxChannel | 'all'>('all');

  // Fetch chats on mount and whenever the channel filter changes
  useEffect(() => {
    loadChats();
    setSelectedChat(null);
    setMobileView('list');
  }, [channelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close chat on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedChat) {
        setSelectedChat(null);
        setMobileView('list');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChat, setSelectedChat]);

  const loadChats = async () => {
    setIsLoading(true);
    setError(null);
    setChatPage(1);
    try {
      const response = await fetchInboxChats(1, channelFilter);
      const sortedChats = (response.data || []).sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setChats(sortedChats);
      setHasMoreChats(response.meta.current_page < response.meta.last_page);
    } catch (err) {
      console.error('Failed to fetch inbox chats:', err);
      setError(t('chat.inbox.error-loading'));
      toast({
        title: t('chat.inbox.error-title'),
        description: t('chat.inbox.error-loading'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreChats = async () => {
    if (isLoadingMoreChats || !hasMoreChats) return;
    setIsLoadingMoreChats(true);
    const nextPage = chatPage + 1;
    try {
      const response = await fetchInboxChats(nextPage, channelFilter);
      setChats(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newChats = (response.data || []).filter(c => !existingIds.has(c.id));
        return [...prev, ...newChats].sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      });
      setHasMoreChats(response.meta.current_page < response.meta.last_page);
      setChatPage(nextPage);
    } catch {
      // silently fail
    } finally {
      setIsLoadingMoreChats(false);
    }
  };

  const handleSelectChat = (chat: InboxChat) => {
    setSelectedChat(chat);
    setMobileView('conversation');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleShowDetails = () => {
    setMobileView('details');
  };

  const handleCloseDetails = () => {
    setMobileView('conversation');
  };

  // ChatConversation manages messages locally — we only update metadata here
  const handleMessageSent = (message: InboxMessage) => {
    if (!selectedChat) return;
    // Update last_message_at on selectedChat (metadata only, not messages array)
    setSelectedChat(prev => prev ? { ...prev, last_message_at: message.sent_at } : null);
    // Update chat in list: move to top, update preview message
    setChats(prevChats =>
      prevChats
        .map(c => c.id === selectedChat.id
          ? { ...c, last_message_at: message.sent_at, messages: [message] }
          : c
        )
        .sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        )
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-3 py-3 sm:px-4 sm:py-4 border-b border-border/50 bg-background flex items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <InboxIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight truncate">
              {t('chat.inbox.title')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">
              {t('chat.inbox.description')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadChats}
          disabled={isLoading}
          className="shrink-0 h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">{t('common.refresh')}</span>
        </Button>
      </motion.div>

      {/* Channel Filter Bar */}
      <ChannelFilterBar value={channelFilter} onChange={setChannelFilter} />

      {/* Error State */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4"
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('chat.inbox.error-title')}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadChats}>
                {t('common.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content - 3 Panel Layout */}
      {!error && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Desktop Layout - 3 columns */}
          <div className="hidden lg:flex flex-1">
            {/* Chat List - Left Panel */}
            <div className="w-80 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
                onStartConversation={() => setShowStartModal(true)}
                onLoadMore={loadMoreChats}
                hasMore={hasMoreChats}
                isLoadingMore={isLoadingMoreChats}
              />
            </div>

            {/* Conversation - Center Panel */}
            <div className="flex-1 min-w-0 min-h-0">
              <ChatConversation chat={selectedChat} onMessageSent={handleMessageSent} />
            </div>

            {/* Details - Right Panel */}
            <div className="w-80 border-l border-border/50 shrink-0">
              <ChatDetails chat={selectedChat} />
            </div>
          </div>

          {/* Tablet Layout - 2 columns */}
          <div className="hidden md:flex lg:hidden flex-1 min-h-0">
            {/* Chat List - Left Panel */}
            <div className="w-72 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
                onStartConversation={() => setShowStartModal(true)}
                onLoadMore={loadMoreChats}
                hasMore={hasMoreChats}
                isLoadingMore={isLoadingMoreChats}
              />
            </div>

            {/* Conversation - Center Panel */}
            <div className="flex-1 min-w-0 min-h-0">
              <ChatConversation chat={selectedChat} onMessageSent={handleMessageSent} />
            </div>
          </div>

          {/* Mobile Layout - Single column with view switching */}
          <div className="flex md:hidden flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {mobileView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full"
                >
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={handleSelectChat}
                    isLoading={isLoading}
                    onStartConversation={() => setShowStartModal(true)}
                    onLoadMore={loadMoreChats}
                    hasMore={hasMoreChats}
                    isLoadingMore={isLoadingMoreChats}
                  />
                </motion.div>
              )}

              {mobileView === 'conversation' && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full"
                >
                  <ChatConversation
                    chat={selectedChat}
                    onBack={handleBackToList}
                    showBackButton
                    onMessageSent={handleMessageSent}
                  />
                </motion.div>
              )}

              {mobileView === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full"
                >
                  <ChatDetails
                    chat={selectedChat}
                    onClose={handleCloseDetails}
                    showCloseButton
                    defaultCollapsed={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      <StartConversationModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        onSuccess={loadChats}
      />
    </div>
  );
};

export default GlobalInbox;
