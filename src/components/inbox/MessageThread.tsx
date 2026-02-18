import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Hash, ChevronLeft, BellOff, Archive, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  InboxConversation, InboxMessage,
  MOCK_MESSAGES, MOCK_CURRENT_USER_ID,
  getConversationDisplayName, getConversationInitials, getConversationStatus,
  getUserById, getGroupById,
  formatDaySeparator,
} from '@/data/mockInboxData';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MessageThreadProps {
  conversation: InboxConversation | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

const statusColor = (s: string | null) => {
  if (s === 'online') return 'bg-green-500';
  if (s === 'away')   return 'bg-yellow-500';
  return 'bg-muted-foreground';
};

const statusLabel = (s: string | null) => {
  if (s === 'online') return 'Online';
  if (s === 'away')   return 'Away';
  if (s === 'offline') {
    const otherId = ''; // derived below
    return 'Offline';
  }
  return null;
};

const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  onBack,
  showBackButton = false,
}) => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversation) { setMessages([]); return; }
    setMessages(MOCK_MESSAGES[conversation.id] ?? []);
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
          <Hash className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
          <p className="font-medium text-foreground/60 text-sm">Select a conversation</p>
          <p className="text-xs mt-1">Choose from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const name     = getConversationDisplayName(conversation, MOCK_CURRENT_USER_ID);
  const initials = getConversationInitials(conversation, MOCK_CURRENT_USER_ID);
  const status   = getConversationStatus(conversation, MOCK_CURRENT_USER_ID);
  const isGroup  = conversation.type === 'group';
  const group    = isGroup && conversation.group_id ? getGroupById(conversation.group_id) : null;

  const handleSend = (content: string) => {
    const newMsg: InboxMessage = {
      id: `new_${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: MOCK_CURRENT_USER_ID,
      type: 'text',
      content,
      created_at: new Date().toISOString(),
      read_by: [MOCK_CURRENT_USER_ID],
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Build message list with day-separator logic
  const rendered: Array<{ msg: InboxMessage; showSeparator: boolean; showSender: boolean }> = [];
  messages.forEach((msg, i) => {
    const prev = messages[i - 1];
    const showSeparator = !prev ||
      new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
    const showSender = isGroup && (!prev || prev.sender_id !== msg.sender_id || showSeparator);
    rendered.push({ msg, showSeparator, showSender });
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-background/60 backdrop-blur-sm shrink-0">
        {showBackButton && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm
            ${isGroup ? 'bg-accent/20 border border-accent/30 text-accent' : 'bg-primary/20 border border-primary/30 text-primary'}`}>
            {isGroup ? <Hash className="w-4 h-4" /> : initials}
          </div>
          {status && (
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${statusColor(status)}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">{name}</p>
          {isGroup && group ? (
            <p className="text-xs text-muted-foreground">{group.member_ids.length} members</p>
          ) : status ? (
            <p className={`text-xs font-medium ${status === 'online' ? 'text-green-500' : status === 'away' ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline'}
            </p>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
              <BellOff className="w-3.5 h-3.5" /> Mute
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
              <Archive className="w-3.5 h-3.5" /> Archive
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-xs text-destructive cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {rendered.map(({ msg, showSeparator, showSender }) => {
          const isOwn   = msg.sender_id === MOCK_CURRENT_USER_ID;
          const sender  = getUserById(msg.sender_id);
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              sender={sender}
              showSender={showSender}
              showDaySeparator={showSeparator}
            />
          );
        })}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Say hello!
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
};

export default MessageThread;
