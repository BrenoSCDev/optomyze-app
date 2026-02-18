import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Users, MessageSquare, UserCheck,
  ChevronDown, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_CONVERSATIONS, MOCK_GROUPS, MOCK_USERS, MOCK_CURRENT_USER_ID,
  InboxConversation, InboxGroup, InboxUser,
  getConversationDisplayName, getConversationInitials, getConversationStatus,
  formatMessageTime, getLastMessagePreview, getUserById, getGroupById,
} from '@/data/mockInboxData';

type Tab = 'all' | 'contacts' | 'groups';

interface ConversationListProps {
  selectedConversation: InboxConversation | null;
  onSelectConversation: (conv: InboxConversation) => void;
  onOpenCreateGroup: () => void;
}

const statusColor = (status: string | null) => {
  if (status === 'online') return 'bg-green-500';
  if (status === 'away')   return 'bg-yellow-500';
  return 'bg-muted-foreground';
};

const ConversationList: React.FC<ConversationListProps> = ({
  selectedConversation,
  onSelectConversation,
  onOpenCreateGroup,
}) => {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unread_count, 0);

  // All tab: sorted by last_message time
  const filteredConversations = MOCK_CONVERSATIONS
    .filter(c => {
      const name = getConversationDisplayName(c, MOCK_CURRENT_USER_ID);
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const ta = a.last_message?.created_at ?? a.created_at;
      const tb = b.last_message?.created_at ?? b.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });

  const filteredContacts = MOCK_USERS
    .filter(u => u.id !== MOCK_CURRENT_USER_ID)
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const order = { online: 0, away: 1, offline: 2 };
      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
    });

  const filteredGroups = MOCK_GROUPS.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all',      label: 'All',      count: totalUnread },
    { id: 'contacts', label: 'Contacts', count: 0 },
    { id: 'groups',   label: 'Groups',   count: 0 },
  ];

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground text-sm">Messages</h2>
          <button
            onClick={onOpenCreateGroup}
            className="w-7 h-7 rounded-lg bg-primary/15 hover:bg-primary/25 flex items-center justify-center text-primary transition-colors"
            title="Create Group"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 border border-border/30 rounded-lg outline-none focus:border-primary/50 focus:bg-muted/60 transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative flex items-center justify-center gap-1.5
              ${tab === t.id
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {t.count}
              </span>
            )}
            {tab === t.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <AnimatePresence mode="wait">

          {/* ALL TAB */}
          {tab === 'all' && (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredConversations.map(conv => {
                const name     = getConversationDisplayName(conv, MOCK_CURRENT_USER_ID);
                const initials = getConversationInitials(conv, MOCK_CURRENT_USER_ID);
                const status   = getConversationStatus(conv, MOCK_CURRENT_USER_ID);
                const preview  = getLastMessagePreview(conv.last_message);
                const time     = conv.last_message ? formatMessageTime(conv.last_message.created_at) : '';
                const isGroup  = conv.type === 'group';
                const selected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-border/20 text-left
                      ${selected
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-muted/30'
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                        ${isGroup
                          ? 'bg-accent/20 border border-accent/30 text-accent'
                          : 'bg-primary/20 border border-primary/30 text-primary'
                        }`}>
                        {isGroup ? <Hash className="w-4 h-4" /> : initials}
                      </div>
                      {status && (
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor(status)}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-medium truncate ${conv.unread_count > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                          {name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs truncate ${conv.unread_count > 0 ? 'text-foreground/70 font-medium' : 'text-muted-foreground'}`}>
                          {preview}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ml-2 shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
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
            <motion.div
              key="contacts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filteredContacts.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    // Find existing DM or create one
                    const existing = MOCK_CONVERSATIONS.find(
                      c => c.type === 'direct' && c.participant_ids.includes(user.id)
                    );
                    if (existing) {
                      onSelectConversation(existing);
                      setTab('all');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 text-left"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-sm text-primary">
                      {user.initials}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor(user.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role} &bull; {user.status === 'online' ? 'Online' : user.last_seen ?? 'Offline'}</p>
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
            <motion.div
              key="groups"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="px-4 py-2">
                <button
                  onClick={onOpenCreateGroup}
                  className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Group
                </button>
              </div>

              {filteredGroups.map(group => {
                const conv = MOCK_CONVERSATIONS.find(c => c.group_id === group.id);
                const memberCount = group.member_ids.length;
                const initials = group.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <button
                    key={group.id}
                    onClick={() => conv && onSelectConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 text-left
                      ${selectedConversation?.group_id === group.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{memberCount} members</p>
                    </div>
                    {conv && conv.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
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
      </div>
    </div>
  );
};

export default ConversationList;
