import React, { useId, useState } from 'react';
import {
  Search, Plus, Users, MessageSquare, UserCheck, Hash, RefreshCw, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ChatConversation, ChatContact, conversationDisplayName } from '@/services/inboxChatApi';
import { extractTime } from '@/lib/utils';
import { usePrivateFile } from '@/hooks/usePrivateFile';

type Tab = 'all' | 'contacts' | 'groups';

/** Read-state tabs. Presentational until the filtering lands, as in the inbox. */
export type ReadFilter = 'all' | 'unread' | 'read';

interface ConversationListProps {
  conversations: ChatConversation[];
  contacts: ChatContact[];
  selectedConversation: ChatConversation | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onContactClick: (contact: ChatContact) => void;
  onOpenCreateGroup: () => void;
  isLoading?: boolean;
  /** Reloads conversations + contacts; renders the refresh action when supplied. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

function getInitials(name: string | null | undefined): string {
  // Names arrive from the API and can be null (deleted user / unnamed group).
  return (name ?? '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const ConversationAvatar: React.FC<{ conv: ChatConversation; currentUserId: number | undefined }> = ({ conv, currentUserId }) => {
  const isGroup = conv.type === 'group';
  const otherParticipant = !isGroup ? conv.participants.find(p => p.id !== currentUserId) : null;
  const picPath = isGroup ? conv.cover_image_url : otherParticipant?.profile_pic_url;
  const blobUrl = usePrivateFile(picPath);

  if (isGroup && blobUrl) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shrink-0">
        <img src={blobUrl} alt={conversationDisplayName(conv)} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (isGroup) {
    return (
      <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
        <Hash className="w-4 h-4" />
      </div>
    );
  }
  if (blobUrl) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shrink-0">
        <img src={blobUrl} alt={conversationDisplayName(conv)} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
      {getInitials(conversationDisplayName(conv))}
    </div>
  );
};

const ContactAvatar: React.FC<{ contact: ChatContact }> = ({ contact }) => {
  const blobUrl = usePrivateFile(contact.profile_pic_url);
  if (blobUrl) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shrink-0">
        <img src={blobUrl} alt={contact.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
      {getInitials(contact.name)}
    </div>
  );
};

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === y.toDateString();
  if (isToday) return extractTime(iso);
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getLastMessagePreview(conv: ChatConversation): string {
  if (!conv.last_message) return 'No messages yet';
  const m = conv.last_message;
  if (m.type === 'image') return '📷 Image';
  if (m.type === 'audio') return '🎵 Audio';
  return m.body ?? '';
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations, contacts, selectedConversation,
  onSelectConversation, onContactClick, onOpenCreateGroup, isLoading,
  onRefresh, isRefreshing = false,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const instanceId = useId();
  const [tab, setTab] = useState<Tab>('all');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [search, setSearch] = useState('');

  const lowerSearch = search.toLowerCase();

  const filteredConversations = conversations
    .filter(c => conversationDisplayName(c).toLowerCase().includes(lowerSearch))
    .sort((a, b) => {
      const ta = a.last_message_at ?? a.created_at;
      const tb = b.last_message_at ?? b.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });

  const filteredContacts = contacts
    .filter(c => c.name.toLowerCase().includes(lowerSearch) || c.role.toLowerCase().includes(lowerSearch))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredGroups = filteredConversations.filter(c => c.type === 'group');

  const typeLabel = (id: Tab): string => {
    switch (id) {
      // "People" rather than "Contacts": in Teams these are colleagues, and
      // "contacts" already means leads everywhere else in the CRM.
      case 'all': return t('chat.inbox.filter-all');
      case 'contacts': return t('chat.teams.filter-contacts');
      case 'groups': return t('chat.teams.filter-groups');
    }
  };

  const readTabs: { key: ReadFilter; label: string }[] = [
    { key: 'all', label: t('chat.inbox.tab-all-messages') },
    { key: 'unread', label: t('chat.inbox.tab-unread') },
    { key: 'read', label: t('chat.inbox.tab-read') },
  ];

  const conversationCount = conversations.length;

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header — mirrors the Global Inbox: title + count, icon actions,
          search, then read-state tabs. The page-level header this panel used
          to sit under has been removed, so this is the only chrome. */}
      <div className="px-3 pt-3 pb-0 border-b border-border/40">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{t('chat.teams.conversations')}</span>
            {!isLoading && conversationCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground shrink-0">
                ({conversationCount})
              </span>
            )}
          </h2>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Kept, unlike the inbox's "New Conversation": a group can only
                come into existence from here, so removing it would remove the
                capability rather than just the button. */}
            {onOpenCreateGroup && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onOpenCreateGroup}
                    aria-label={t('chat.teams.new-group')}
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('chat.teams.new-group')}</TooltipContent>
              </Tooltip>
            )}

            {onRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    aria-label={t('chat.inbox.refresh-conversations')}
                  >
                    <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('chat.inbox.refresh-conversations')}</TooltipContent>
              </Tooltip>
            )}

          </div>
        </div>

        {/* Type tabs.

            These used to live inside the filter dropdown behind an unlabelled
            funnel icon, which meant the directory of everyone in the company
            was effectively invisible — the reason it read as removed. On the
            surface, starting a chat with a colleague is one click. */}
        <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-muted/40 p-0.5">
          {(['all', 'contacts', 'groups'] as Tab[]).map(id => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                tab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {typeLabel(id)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('chat.teams.search-placeholder')}
            className="flex h-9 w-full rounded-md border border-input-border bg-input-bg pl-8 pr-8 text-sm text-foreground placeholder:text-input-placeholder outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background transition-colors duration-fast ease-standard"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Read-state tabs. Presentational for now, same as the Global Inbox. */}
        <div className="mt-2.5 flex items-center gap-4">
          {readTabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setReadFilter(key)}
              aria-current={readFilter === key}
              className={cn(
                'relative -mb-px border-b-2 pb-2 pt-0.5 text-xs font-medium transition-colors duration-fast ease-standard',
                readFilter === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading conversations...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ALL TAB */}
            {tab === 'all' && (
              <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {filteredConversations.map(conv => {
                  const preview  = getLastMessagePreview(conv);
                  const time     = conv.last_message_at ? formatMessageTime(conv.last_message_at) : '';
                  const selected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/20 text-left
                        ${selected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}
                    >
                      <div className="relative shrink-0">
                        <ConversationAvatar conv={conv} currentUserId={currentUserId} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${conv.unread_count
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground/80'}`}>
                            {conversationDisplayName(conv)}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{time}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs truncate ${conv.unread_count
                            ? 'text-foreground/70'
                            : 'text-muted-foreground'}`}>
                            {preview}
                          </span>
                          {conv.unread_count ? (
                            <span className="min-w-[1.25rem] shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-primary-foreground tabular-nums">
                              {conv.unread_count > 99 ? '99+' : conv.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredConversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">No conversations found</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* CONTACTS TAB */}
            {tab === 'contacts' && (
              <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => onContactClick(contact)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 text-left"
                  >
                    <div className="relative shrink-0">
                      <ContactAvatar contact={contact} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.role} &bull; {contact.email}</p>
                    </div>
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </button>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">No contacts found</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* GROUPS TAB */}
            {tab === 'groups' && (
              <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="px-4 py-2">
                  <button
                    onClick={onOpenCreateGroup}
                    className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Group
                  </button>
                </div>

                {filteredGroups.map(conv => {
                  const memberCount = conv.participants.length;
                  const selected = selectedConversation?.id === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 text-left
                        ${selected ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                    >
                      <ConversationAvatar conv={conv} currentUserId={currentUserId} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate text-foreground ${conv.unread_count ? 'font-semibold' : 'font-medium'}`}>
                          {conversationDisplayName(conv)}
                        </p>
                        <p className="text-xs text-muted-foreground">{memberCount} members</p>
                      </div>
                      {conv.unread_count ? (
                        <span className="min-w-[1.25rem] shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-primary-foreground tabular-nums">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}

                {filteredGroups.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-xs">No groups found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
