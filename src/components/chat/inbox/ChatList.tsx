/**
 * CHAT LIST COMPONENT
 * 
 * Left panel displaying list of WhatsApp conversations
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, Image as ImageIcon, Mic, MapPin, FileText, User, Pencil, Loader2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppChat } from '@/types/whatsappChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, extractTime } from '@/lib/utils';
import { usePrivateFile } from '@/hooks/usePrivateFile';

const ChatListImageThumb: React.FC<{ path: string | undefined }> = ({ path }) => {
  const url = usePrivateFile(path);
  if (!url) return <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <img src={url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />;
};

const ChatAvatar: React.FC<{ path: string | null | undefined; name: string }> = ({ path, name }) => {
  const url = usePrivateFile(path ?? undefined);
  if (url) {
    return <img src={url} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
      <FaWhatsapp className="h-5 w-5 text-green-600" />
    </div>
  );
};

interface ChatListProps {
  chats: WhatsAppChat[];
  selectedChat: WhatsAppChat | null;
  onSelectChat: (chat: WhatsAppChat) => void;
  isLoading: boolean;
  onStartConversation?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChat,
  onSelectChat,
  isLoading,
  onStartConversation,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}) => {
  const { t } = useLanguage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  const getLeadName = (chat: WhatsAppChat): string => {
    if (chat.lead?.first_name || chat.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    return chat.phone_number;
  };

  const getLastMessage = (chat: WhatsAppChat): { type: 'text' | 'image' | 'audio' | 'location' | 'document' | 'contact'; text: string; imagePath?: string } => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.type === 'image') {
        return {
          type: 'image',
          text: lastMessage.text || t('chat.inbox.photo'),
          imagePath: lastMessage.media_url ?? undefined,
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            {t('chat.inbox.conversations')}
          </h2>
          {onStartConversation && (
            <Button variant="ghost" size="icon" onClick={onStartConversation} title={t('chat.inbox.start-conversation')} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
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
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            {t('chat.inbox.conversations')}
          </h2>
          {onStartConversation && (
            <Button variant="ghost" size="icon" onClick={onStartConversation} title={t('chat.inbox.start-conversation')} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-2">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('chat.inbox.no-chats')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FaWhatsapp className="h-5 w-5 text-green-600" />
          {t('chat.inbox.conversations')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {chats.length} {t('chat.inbox.chats-count')}
        </p>
      </div>
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
                "p-3 rounded-lg cursor-pointer transition-all duration-200 group",
                "hover:bg-muted/60",
                selectedChat?.id === chat.id 
                  ? "bg-muted border-l-2 border-green-500 text-foreground" 
                  : "bg-background/50"
              )}
            >
              <div className="flex items-start gap-3">
                <ChatAvatar path={chat.profile_pic_url} name={getLeadName(chat)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">
                      {getLeadName(chat)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(chat.last_message_at)}
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
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {chat.lead?.funnel && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {chat.lead.funnel.name}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-green-100 text-green-800">
                      {chat.instance?.instance_name?.split('_')[0] || 'Instance'}
                    </Badge>
                  </div>
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
