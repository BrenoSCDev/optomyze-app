/**
 * CHAT CONVERSATION COMPONENT
 * 
 * Center panel displaying the message thread
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, User, ArrowLeft } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ChatConversationProps {
  chat: WhatsAppChat | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  onBack,
  showBackButton = false
}) => {
  const { t } = useLanguage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat && scrollAreaRef.current) {
      // Find the scrollable viewport inside ScrollArea and scroll to bottom
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [chat]);

  const getLeadName = (): string => {
    if (chat?.lead?.first_name || chat?.lead?.last_name) {
      return `${chat.lead.first_name || ''} ${chat.lead.last_name || ''}`.trim();
    }
    return chat?.phone_number || '';
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('chat.inbox.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('chat.inbox.yesterday');
    }
    return date.toLocaleDateString([], { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: WhatsAppMessage[]) => {
    const groups: { date: string; messages: WhatsAppMessage[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.sent_at).toDateString();
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: message.sent_at, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  if (!chat) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/20">
        <div className="text-center space-y-3 p-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FaWhatsapp className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium">{t('chat.inbox.select-chat')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {t('chat.inbox.select-chat-description')}
          </p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(chat.messages || []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-card">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{getLeadName()}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{chat.phone_number}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {chat.lead?.funnel && (
              <Badge variant="outline" className="text-xs">
                {chat.lead.funnel.name}
              </Badge>
            )}
            {chat.lead?.stage && (
              <Badge variant="secondary" className="text-xs">
                {chat.lead.stage.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {chat.messages && chat.messages.length > 0 ? (
          <div className="space-y-4">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center justify-center">
                  <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                    {formatMessageDate(group.date)}
                  </span>
                </div>
                
                {/* Messages */}
                {group.messages.map((message, messageIndex) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: messageIndex * 0.03 }}
                    className={cn(
                      "flex",
                      message.direction === 'outgoing' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg p-3 shadow-sm",
                        message.direction === 'outgoing'
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-card border border-border/50 rounded-bl-none"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        message.direction === 'outgoing' ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          message.direction === 'outgoing' 
                            ? "text-green-100" 
                            : "text-muted-foreground"
                        )}>
                          {formatMessageTime(message.sent_at)}
                        </span>
                        {message.direction === 'outgoing' && message.status && (
                          <span className="text-xs text-green-100">
                            • {message.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
            <div />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground mt-2">
              {t('chat.inbox.no-messages-in-chat')}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Message input placeholder (out of scope for now) */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center">
          <MessageSquare className="h-4 w-4" />
          <span>{t('chat.inbox.sending-coming-soon')}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
