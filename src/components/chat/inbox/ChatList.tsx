/**
 * CHAT LIST COMPONENT
 * 
 * Left panel displaying list of WhatsApp conversations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, Image as ImageIcon, Mic, MapPin, FileText } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppChat } from '@/types/whatsappChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getStorageUrl } from '@/lib/constants';

interface ChatListProps {
  chats: WhatsAppChat[];
  selectedChat: WhatsAppChat | null;
  onSelectChat: (chat: WhatsAppChat) => void;
  isLoading: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChat,
  onSelectChat,
  isLoading
}) => {
  const { t } = useLanguage();

  const getLeadName = (chat: WhatsAppChat): string => {
    if (chat.lead?.first_name || chat.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    return chat.phone_number;
  };

  const getLastMessage = (chat: WhatsAppChat): { type: 'text' | 'image' | 'audio' | 'location' | 'document'; text: string; imageUrl?: string } => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage.type === 'image') {
        return { 
          type: 'image', 
          text: lastMessage.text || t('chat.inbox.photo'),
          imageUrl: lastMessage.media_url ? getStorageUrl(lastMessage.media_url) : undefined
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
      return { type: 'text', text: lastMessage.text || '' };
    }
    return { type: 'text', text: t('chat.inbox.no-messages-yet') };
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            {t('chat.inbox.conversations')}
          </h2>
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
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
            {t('chat.inbox.conversations')}
          </h2>
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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectChat(chat)}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-all duration-200",
                "hover:bg-accent/50",
                selectedChat?.id === chat.id 
                  ? "bg-accent border-l-2 border-green-500" 
                  : "bg-background/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {getLeadName(chat)}
                    </span>
                  </div>
                  {(() => {
                    const lastMsg = getLastMessage(chat);
                    if (lastMsg.type === 'image') {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {lastMsg.imageUrl ? (
                            <img 
                              src={lastMsg.imageUrl} 
                              alt="" 
                              className="w-5 h-5 rounded object-cover shrink-0"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
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
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(chat.last_message_at)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatList;
