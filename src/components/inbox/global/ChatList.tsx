/**
 * CHAT LIST COMPONENT
 *
 * Left panel displaying the list of Global Inbox conversations across all channels
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Inbox, MessageSquare, Clock, Image as ImageIcon, Mic, MapPin, FileText, User, Loader2, Film, Search, X, RefreshCw, Filter, Star, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InboxChat, InboxChannel } from '@/types/inbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, extractTime } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phone';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import InboxAvatar from './InboxAvatar';
import ChannelIcon from './ChannelIcon';

/** Read-state tabs; resolved by the backend, see fetchInboxChats. */
export type ReadFilter = 'all' | 'unread' | 'read';

const CHANNEL_FILTERS: (InboxChannel | 'all')[] = [
  'all', 'whatsapp', 'instagram', 'messenger', 'website', 'sms',
];

const ChatListImageThumb: React.FC<{ path: string | undefined }> = ({ path }) => {
  const url = usePrivateFile(path);
  if (!url) return <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <img src={url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />;
};

interface ChatListProps {
  chats: InboxChat[];
  selectedChat: InboxChat | null;
  onSelectChat: (chat: InboxChat) => void;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** Current value of the lead/chat search box (backend-searched, controlled by the parent). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Reloads the conversation list; renders the refresh action when supplied. */
  onRefresh?: () => void;
  /**
   * Total conversations matching the current filters, from the backend's
   * paginator count — not `chats.length`, which is only the loaded page(s).
   * Falls back to the loaded count when the parent doesn't supply it.
   */
  totalCount?: number;
  /** Channel ("conversation type") filter, moved here from the old page-level bar. */
  channelFilter?: InboxChannel | 'all';
  onChannelFilterChange?: (channel: InboxChannel | 'all') => void;
  readFilter?: ReadFilter;
  onReadFilterChange?: (filter: ReadFilter) => void;
  /** Show only archived conversations instead of only unarchived ones. */
  showArchived?: boolean;
  onShowArchivedChange?: (value: boolean) => void;
  /** Narrow the list to pinned conversations. */
  favoritesOnly?: boolean;
  onFavoritesOnlyChange?: (value: boolean) => void;
  onToggleFavorite?: (chat: InboxChat) => void;
  onToggleArchived?: (chat: InboxChat) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChat,
  onSelectChat,
  isLoading,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  searchValue = '',
  onSearchChange,
  onRefresh,
  totalCount,
  channelFilter = 'all',
  onChannelFilterChange,
  readFilter = 'all',
  onReadFilterChange,
  showArchived = false,
  onShowArchivedChange,
  favoritesOnly = false,
  onFavoritesOnlyChange,
  onToggleFavorite,
  onToggleArchived,
}) => {
  const { t } = useLanguage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  // Detect scroll-to-bottom for loading more chats
  const handleScroll = useCallback(() => {
    if (!onLoadMore || isLoadingMore || !hasMore) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      onLoadMore();
    }
  }, [onLoadMore, isLoadingMore, hasMore]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const getLeadName = (chat: InboxChat): string => {
    if (chat.lead?.first_name || chat.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    if (chat.contact_name) return chat.contact_name;
    return chat.channel === 'whatsapp' ? formatPhoneNumber(chat.external_contact_id) : chat.external_contact_id;
  };

  const getLastMessage = (chat: InboxChat): { type: 'text' | 'image' | 'audio' | 'video' | 'location' | 'document' | 'contact'; text: string; imagePath?: string } => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.type === 'image') {
        return {
          type: 'image',
          text: lastMessage.text || t('chat.inbox.photo'),
          imagePath: lastMessage.media_url ?? undefined,
        };
      }
      if (lastMessage.type === 'video') {
        return {
          type: 'video',
          text: lastMessage.metadata?.gif_playback ? t('chat.inbox.gif') : t('chat.inbox.video'),
        };
      }
      if (lastMessage.type === 'audio') {
        return {
          type: 'audio',
          text: t('chat.inbox.audio')
        };
      }
      if (lastMessage.type === 'location') {
        return {
          type: 'location',
          text: t('chat.inbox.location') || 'Location'
        };
      }
      if (lastMessage.type === 'document') {
        return {
          type: 'document',
          text: lastMessage.text || t('chat.inbox.document') || 'Document'
        };
      }
      if (lastMessage.type === 'contact') {
        return {
          type: 'contact',
          text: lastMessage.metadata?.contact_name || lastMessage.text || t('chat.inbox.contact') || 'Contact'
        };
      }
      return { type: 'text', text: lastMessage.text || '' };
    }
    return { type: 'text', text: t('chat.inbox.no-messages-yet') };
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return extractTime(dateString);
    } else if (diffDays === 1) {
      return t('chat.inbox.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const channelLabel = (channel: InboxChannel | 'all'): string => {
    switch (channel) {
      case 'all': return t('chat.inbox.filter-all');
      case 'whatsapp': return t('chat.inbox.filter-whatsapp');
      case 'instagram': return t('chat.inbox.filter-instagram');
      case 'messenger': return t('chat.inbox.filter-messenger');
      case 'sms': return t('chat.inbox.filter-sms');
      case 'website': return t('chat.inbox.filter-website');
      default: return channel;
    }
  };

  const conversationCount = totalCount ?? chats.length;

  const readTabs: { key: ReadFilter; label: string }[] = [
    { key: 'all', label: t('chat.inbox.tab-all-messages') },
    { key: 'unread', label: t('chat.inbox.tab-unread') },
    { key: 'read', label: t('chat.inbox.tab-read') },
  ];

  const header = (
    <div className="px-3 pt-3 pb-0 border-b border-border/50">
      {/* Title + actions. This is the inbox's only header now — the page-level
          one was removed to give the message thread back its vertical space. */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold flex items-center gap-2 min-w-0">
          <Inbox className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{t('chat.inbox.conversations')}</span>
          {!isLoading && conversationCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground shrink-0">
              ({conversationCount})
            </span>
          )}
        </h2>

        <div className="flex items-center gap-0.5 shrink-0">
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label={t('chat.inbox.refresh-conversations')}
                  className="h-8 w-8"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('chat.inbox.refresh-conversations')}</TooltipContent>
            </Tooltip>
          )}

          {onChannelFilterChange && (
            <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('chat.inbox.filter-conversations')}
                      className={cn(
                        'relative h-8 w-8 text-muted-foreground hover:bg-surface-3 hover:text-foreground',
                        channelFilter !== 'all' && 'text-primary'
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      {/* Dot marks a narrowed list when the icon alone can't */}
                      {channelFilter !== 'all' && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {/* Dropped while the menu is open, otherwise the tooltip
                    lingers on top of the menu it just opened. */}
                {!isFilterOpen && (
                  <TooltipContent>{t('chat.inbox.filter-conversations')}</TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {t('chat.inbox.filter-channel-label')}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={channelFilter}
                  onValueChange={(value) => onChannelFilterChange(value as InboxChannel | 'all')}
                >
                  {CHANNEL_FILTERS.map((channel) => (
                    <DropdownMenuRadioItem key={channel} value={channel} className="gap-2 text-sm">
                      {channel !== 'all' && <ChannelIcon channel={channel} className="h-3.5 w-3.5" />}
                      {channelLabel(channel)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {onSearchChange && (
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('chat.inbox.search-chats-placeholder')}
            className="pl-8 pr-8 h-9"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Read-state tabs, plus the two list-scope toggles. All resolved by
          the backend — see fetchInboxChats. */}
      {onReadFilterChange && (
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="flex items-center gap-4">
            {readTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onReadFilterChange(key)}
                aria-current={readFilter === key}
                className={cn(
                  'relative -mb-px border-b-2 pb-2 pt-0.5 text-xs font-medium transition-colors',
                  readFilter === key
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 pb-1.5">
            {onFavoritesOnlyChange && (
              <button
                type="button"
                aria-pressed={favoritesOnly}
                title={t('chat.inbox.filter-favorites')}
                onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
                className={cn(
                  'rounded p-1 transition-colors',
                  favoritesOnly
                    ? 'bg-amber-400/15 text-amber-500'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Star className={cn('h-3.5 w-3.5', favoritesOnly && 'fill-amber-400')} />
              </button>
            )}
            {onShowArchivedChange && (
              <button
                type="button"
                aria-pressed={showArchived}
                title={t('chat.inbox.filter-archived')}
                onClick={() => onShowArchivedChange(!showArchived)}
                className={cn(
                  'rounded p-1 transition-colors',
                  showArchived
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-3 w-full p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {header}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchValue ? t('chat.inbox.no-search-results') : t('chat.inbox.no-chats')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {header}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2 space-y-1">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectChat(chat)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors duration-fast ease-standard group",
                "hover:bg-muted/60",
                selectedChat?.id === chat.id
                  ? "bg-muted border-l-2 border-primary text-foreground"
                  : "bg-background/50"
              )}
            >
              <div className="flex items-start gap-3">
                <InboxAvatar profilePicPath={chat.profile_pic_url} name={getLeadName(chat)} channel={chat.channel} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate', chat.unread_count ? 'font-semibold text-foreground' : 'font-medium')}>
                      {chat.is_favorite && (
                        <Star className="mr-1 inline h-3 w-3 shrink-0 fill-amber-400 text-amber-400 align-[-1px]" />
                      )}
                      {getLeadName(chat)}
                    </span>

                    <span className="flex shrink-0 items-center gap-1.5">
                      {/* Row actions: shown on hover, and kept visible while
                          pinned so the state is discoverable without hovering. */}
                      <span
                        className={cn(
                          'flex items-center gap-0.5 transition-opacity',
                          chat.is_favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                        )}
                      >
                        {onToggleFavorite && (
                          <button
                            type="button"
                            aria-label={chat.is_favorite ? t('chat.inbox.unfavorite') : t('chat.inbox.favorite')}
                            title={chat.is_favorite ? t('chat.inbox.unfavorite') : t('chat.inbox.favorite')}
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(chat); }}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-amber-500"
                          >
                            <Star className={cn('h-3.5 w-3.5', chat.is_favorite && 'fill-amber-400 text-amber-400')} />
                          </button>
                        )}
                        {onToggleArchived && (
                          <button
                            type="button"
                            aria-label={chat.is_archived ? t('chat.inbox.unarchive') : t('chat.inbox.archive')}
                            title={chat.is_archived ? t('chat.inbox.unarchive') : t('chat.inbox.archive')}
                            onClick={(e) => { e.stopPropagation(); onToggleArchived(chat); }}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {chat.is_archived
                              ? <ArchiveRestore className="h-3.5 w-3.5" />
                              : <Archive className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </span>

                      {chat.unread_count ? (
                        <span
                          className="min-w-[1.25rem] rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-primary-foreground tabular-nums"
                          aria-label={t('chat.inbox.unread-count').replace('{count}', String(chat.unread_count))}
                        >
                          {chat.unread_count > 99 ? '99+' : chat.unread_count}
                        </span>
                      ) : null}

                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(chat.last_message_at)}
                      </span>
                    </span>
                  </div>
                  {(() => {
                    const lastMsg = getLastMessage(chat);
                    if (lastMsg.type === 'image') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ChatListImageThumb path={lastMsg.imagePath} />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    if (lastMsg.type === 'video') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Film className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    if (lastMsg.type === 'audio') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mic className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    if (lastMsg.type === 'location') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    if (lastMsg.type === 'document') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    if (lastMsg.type === 'contact') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground truncate">
                            {lastMsg.text}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {lastMsg.text}
                      </p>
                    );
                  })()}
                  {/* Funnel and WhatsApp instance intentionally omitted here —
                      the row stays to name / preview / time. Both are shown in
                      ChatDetails once a conversation is opened. */}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Infinite scroll indicators */}
          {isLoadingMore && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && chats.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              {t('chat.inbox.all-chats-loaded')}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList;
