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
import {
  fetchInboxChats,
  markInboxChatRead,
  setInboxChatArchived,
  setInboxChatFavorite,
} from '@/services/globalInboxApi';
import { InboxChannel, InboxChat, InboxMessage } from '@/types/inbox';
import ChatList, { ReadFilter } from './ChatList';
import ChatConversation from './ChatConversation';
import ChatDetails from './ChatDetails';

type ViewMode = 'list' | 'conversation' | 'details';

/**
 * The list's order, matching what the backend returns.
 *
 * Favourites are pinned above everything else regardless of when they last
 * had a message; within each group the most recent conversation leads. The
 * client re-sorts because websocket events insert and reorder rows between
 * fetches, and a plain recency sort here would silently undo the pinning.
 */
const sortChats = (chats: InboxChat[]): InboxChat[] =>
  [...chats].sort((a, b) => {
    const pinned = Number(!!b.is_favorite) - Number(!!a.is_favorite);
    if (pinned !== 0) return pinned;
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
  });

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
  // Read-state tabs, resolved by the backend — the list is paginated, so
  // filtering here would only ever search the conversations already loaded.
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  /** Archived conversations are put away: hidden unless shown on their own. */
  const [showArchived, setShowArchived] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
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

  // Fetch chats on mount and whenever any filter or the search changes
  useEffect(() => {
    loadChats();
    setSelectedChat(null);
    setMobileView('list');
  }, [channelFilter, searchQuery, readFilter, showArchived, favoritesOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * A message arriving in the conversation you are already looking at is read
   * on arrival — you are watching it land.
   *
   * Without this the message would stay unread server-side: the badge would
   * come back on the next refresh, and colleagues would keep seeing it as
   * waiting. Keyed on the newest inbound id so it fires once per message
   * rather than on every re-render of the thread.
   */
  const lastReadInboundRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedChat) {
      lastReadInboundRef.current = null;
      return;
    }

    const inbound = (selectedChat.messages || []).filter(m => m.direction === 'incoming');
    const newestId = inbound.length ? inbound[inbound.length - 1].id : null;

    if (!newestId || lastReadInboundRef.current === newestId) return;

    // Nothing to do when the thread has already been marked up to here.
    if (!inbound.some(m => m.status !== 'read')) {
      lastReadInboundRef.current = newestId;
      return;
    }

    lastReadInboundRef.current = newestId;
    markInboxChatRead(selectedChat.id).catch(() => {
      lastReadInboundRef.current = null;   // let the next render retry
    });
  }, [selectedChat]);

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

  /** The filter set the backend is currently being asked for. */
  const currentFilters = () => ({
    channel: channelFilter,
    search: searchQuery,
    readState: readFilter,
    archived: showArchived,
    favorite: favoritesOnly,
  });

  const loadChats = async () => {
    setIsLoading(true);
    setError(null);
    setChatPage(1);
    try {
      const response = await fetchInboxChats(1, currentFilters());
      setChats(sortChats(response.data || []));
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
      const response = await fetchInboxChats(nextPage, currentFilters());
      setChats(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newChats = (response.data || []).filter(c => !existingIds.has(c.id));
        return sortChats([...prev, ...newChats]);
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

  /**
   * Opening a conversation is what marks it read.
   *
   * The badge clears immediately rather than waiting for the round trip — the
   * user has demonstrably seen the messages by opening them, and the server
   * call is idempotent. The broadcast that follows clears it for colleagues.
   */
  const handleSelectChat = (chat: InboxChat) => {
    setSelectedChat(chat);
    setMobileView('conversation');

    if (!chat.unread_count) return;

    setChats(prev => prev.map(c => (c.id === chat.id ? { ...c, unread_count: 0 } : c)));

    markInboxChatRead(chat.id).catch(() => {
      // Put the badge back: the messages are still unread server-side.
      setChats(prev => prev.map(c => (c.id === chat.id ? { ...c, unread_count: chat.unread_count } : c)));
    });
  };

  /** Pin or unpin, re-sorting so the row moves to where it now belongs. */
  const handleToggleFavorite = async (chat: InboxChat) => {
    const next = !chat.is_favorite;
    setChats(prev => sortChats(prev.map(c => (c.id === chat.id ? { ...c, is_favorite: next } : c))));

    try {
      await setInboxChatFavorite(chat.id, next);
    } catch {
      setChats(prev => sortChats(prev.map(c => (c.id === chat.id ? { ...c, is_favorite: !next } : c))));
      toast({ title: t('chat.inbox.error-title'), variant: 'destructive' });
    }
  };

  /**
   * Archive or restore. The row leaves the current list either way, since the
   * default view hides archived chats and the archived view shows only them.
   */
  const handleToggleArchived = async (chat: InboxChat) => {
    const next = !chat.is_archived;
    setChats(prev => prev.filter(c => c.id !== chat.id));

    if (selectedChat?.id === chat.id) {
      setSelectedChat(null);
      setMobileView('list');
    }

    try {
      await setInboxChatArchived(chat.id, next);
    } catch {
      loadChats();
      toast({ title: t('chat.inbox.error-title'), variant: 'destructive' });
    }
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
    showArchived,
    onShowArchivedChange: setShowArchived,
    favoritesOnly,
    onFavoritesOnlyChange: setFavoritesOnly,
    onToggleFavorite: handleToggleFavorite,
    onToggleArchived: handleToggleArchived,
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
              <ChatConversation
                chat={selectedChat}
                onMessageSent={handleMessageSent}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchived={handleToggleArchived}
              />
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
              <ChatConversation
                chat={selectedChat}
                onMessageSent={handleMessageSent}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchived={handleToggleArchived}
              />
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
                    onToggleFavorite={handleToggleFavorite}
                    onToggleArchived={handleToggleArchived}
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
