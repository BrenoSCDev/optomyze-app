import React, { useState } from 'react';
import {
  Search, Plus, Users, MessageSquare, UserCheck, Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatConversation, ChatContact } from '@/services/inboxChatApi';

type Tab = 'all' | 'contacts' | 'groups';

interface ConversationListProps {
  conversations: ChatConversation[];
  contacts: ChatContact[];
  selectedConversation: ChatConversation | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onContactClick: (contact: ChatContact) => void;
  onOpenCreateGroup: () => void;
  isLoading?: boolean;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === y.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${baseUrl}/${url.replace(/^\//, '')}`;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations, contacts, selectedConversation,
  onSelectConversation, onContactClick, onOpenCreateGroup, isLoading,
}) => {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  const lowerSearch = search.toLowerCase();

  const filteredConversations = conversations
    .filter(c => c.name.toLowerCase().includes(lowerSearch))
    .sort((a, b) => {
      const ta = a.last_message_at ?? a.created_at;
      const tb = b.last_message_at ?? b.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });

  const filteredContacts = contacts
    .filter(c => c.name.toLowerCase().includes(lowerSearch) || c.role.toLowerCase().includes(lowerSearch))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredGroups = filteredConversations.filter(c => c.type === 'group');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all',      label: 'All' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'groups',   label: 'Groups' },
  ];

  // Render avatar for a conversation
  const renderConversationAvatar = (conv: ChatConversation) => {
    const isGroup = conv.type === 'group';
    const coverUrl = getAvatarUrl(conv.cover_image_url);

    if (isGroup && coverUrl) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shrink-0">
          <img src={coverUrl} alt={conv.name} className="w-full h-full object-cover" />
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

    // Private: try to find the other participant's profile pic
    // We don't have currentUserId here so just use first participant with a pic or initials
    const otherParticipant = conv.participants.find(p => p.profile_pic_url);
    const picUrl = otherParticipant ? getAvatarUrl(otherParticipant.profile_pic_url) : null;

    if (picUrl) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shrink-0">
          <img src={picUrl} alt={conv.name} className="w-full h-full object-cover" />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
        {getInitials(conv.name)}
      </div>
    );
  };

  const renderContactAvatar = (contact: ChatContact) => {
    const picUrl = getAvatarUrl(contact.profile_pic_url);
    if (picUrl) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/30 shrink-0">
          <img src={picUrl} alt={contact.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-semibold text-sm text-primary shrink-0">
        {getInitials(contact.name)}
      </div>
    );
  };

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
              ${tab === t.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
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
                        {renderConversationAvatar(conv)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-medium truncate text-foreground/80">{conv.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate text-muted-foreground">{preview}</span>
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
                      {renderContactAvatar(contact)}
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
                      {renderConversationAvatar(conv)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                        <p className="text-xs text-muted-foreground">{memberCount} members</p>
                      </div>
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
