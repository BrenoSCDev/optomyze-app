/**
 * GLOBAL INBOX COMPONENT
 *
 * Provides a channel-agnostic inbox aggregating conversations from all
 * connected messaging channels (WhatsApp today; Instagram, Messenger, SMS in
 * the future) with:
 * - 3-panel layout: Chat list, Conversation, Details
 * - Real-time updates via WebSocket
 * - Responsive design for desktop, tablet, and mobile
 *
 * There is deliberately no page-level header here. Title, refresh, the
 * channel ("conversation type") filter and the read-state tabs all live in
 * the ChatList header so the message thread keeps the full panel height.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useInbox } from '@/contexts/InboxContext';
import { fetchInboxChats } from '@/services/globalInboxApi';
import { InboxChannel, InboxChat, InboxMessage } from '@/types/inbox';
import ChatList, { ReadFilter } from './ChatList';
import ChatConversation from './ChatConversation';
import ChatDetails from './ChatDetails';

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
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
  // Total matching conversations as counted by the backend (meta.total), not
  // the number currently paginated into `chats`.
  const [totalChats, setTotalChats] = useState(0);
  const [channelFilter, setChannelFilter] = useState<InboxChannel | 'all'>('all');
  // Read-state tabs. Held here rather than in ChatList so that wiring the
  // actual filtering into loadChats() later is a one-line change.
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the raw input into the query actually sent to the backend, so
  // we don't fire a request on every keystroke.
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setSearchQuery(value.trim()), 350);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Fetch chats on mount and whenever the channel filter or search changes
  useEffect(() => {
    loadChats();
    setSelectedChat(null);
    setMobileView('list');
  }, [channelFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const response = await fetchInboxChats(1, channelFilter, searchQuery);
      const sortedChats = (response.data || []).sort((a, b) =>
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setChats(sortedChats);
      setTotalChats(response.meta.total);
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
      const response = await fetchInboxChats(nextPage, channelFilter, searchQuery);
      setChats(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newChats = (response.data || []).filter(c => !existingIds.has(c.id));
        return [...prev, ...newChats].sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      });
      // Re-read the total: rows can be added or removed between page fetches.
      setTotalChats(response.meta.total);
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

  // Every chat list instance (desktop / tablet / mobile) gets the same header
  // controls, so they're built once here.
  const listControls = {
    onRefresh: loadChats,
    channelFilter,
    onChannelFilterChange: setChannelFilter,
    readFilter,
    onReadFilterChange: setReadFilter,
    // A websocket can prepend a chat that wasn't in the last count, so floor
    // the total at what's actually loaded — the header must never claim
    // fewer conversations than the list is showing. Corrects on next fetch.
    totalCount: Math.max(totalChats, chats.length),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden min-h-0">
      {/* No page-level header: the title, refresh, channel filter and read
          tabs all live in the ChatList header now, so the message thread
          keeps the full height of the panel. */}

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
            <div className="w-[22rem] xl:w-96 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
                onLoadMore={loadMoreChats}
                hasMore={hasMoreChats}
                isLoadingMore={isLoadingMoreChats}
                searchValue={searchInput}
                onSearchChange={handleSearchChange}
                {...listControls}
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
            <div className="w-80 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
                onLoadMore={loadMoreChats}
                hasMore={hasMoreChats}
                isLoadingMore={isLoadingMoreChats}
                searchValue={searchInput}
                onSearchChange={handleSearchChange}
                {...listControls}
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
                    onLoadMore={loadMoreChats}
                    hasMore={hasMoreChats}
                    isLoadingMore={isLoadingMoreChats}
                    searchValue={searchInput}
                    onSearchChange={handleSearchChange}
                    {...listControls}
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

    </div>
  );
};

export default GlobalInbox;
