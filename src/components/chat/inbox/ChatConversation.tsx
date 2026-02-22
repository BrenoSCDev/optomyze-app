/**
 * CHAT CONVERSATION COMPONENT
 * 
 * Center panel displaying the message thread
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, User, ArrowLeft, Send, Loader2, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { sendWhatsAppMessage } from '@/services/whatsappChatApi';
import { toast } from '@/hooks/use-toast';
import { getStorageUrl } from '@/lib/constants';
import AudioPlayer from './AudioPlayer';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';

interface ChatConversationProps {
  chat: WhatsAppChat | null;
  onBack?: () => void;
  showBackButton?: boolean;
  onMessageSent?: (message: WhatsAppMessage) => void;
}

interface PendingMessage {
  id: string;
  text: string;
  status: 'sending' | 'error';
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  chat,
  onBack,
  showBackButton = false,
  onMessageSent
}) => {
  const { t } = useLanguage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [leadPreviewOpen, setLeadPreviewOpen] = useState(false);
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (chat) {
      scrollToBottom();
    }
  }, [chat]);

  useEffect(() => {
    // Scroll when pending messages change
    scrollToBottom();
  }, [pendingMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chat?.lead?.id || !chat?.whatsapp_instance_id) {
      return;
    }

    const text = messageText.trim();
    const tempId = `pending-${Date.now()}`;
    
    // Clear input immediately
    setMessageText('');
    setIsSending(true);

    // Add pending message
    setPendingMessages(prev => [...prev, { id: tempId, text, status: 'sending' }]);

    try {
      const response = await sendWhatsAppMessage(chat.whatsapp_instance_id, {
        lead_id: chat.lead.id,
        text
      });

      // Remove pending message on success
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      
      // Create the message object from the API response
      const sentMessage: WhatsAppMessage = {
        id: response.message.id,
        whatsapp_evo_chat_id: response.message.whatsapp_evo_chat_id,
        direction: response.message.direction || 'outgoing',
        type: 'text',
        text: response.message.text,
        status: response.message.status,
        sent_at: response.message.sent_at,
      };

      // Notify parent to add the message to the chat
      onMessageSent?.(sentMessage);
    } catch (error: any) {
      // Mark message as error
      setPendingMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m)
      );

      toast({
        title: t('chat.inbox.message-error'),
        description: error?.response?.data?.message || t('chat.inbox.message-error-description'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = (pendingMessage: PendingMessage) => {
    // Remove failed message and set text back to input
    setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
    setMessageText(pendingMessage.text);
  };

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
    <div className="flex flex-col h-full min-h-0 bg-background" style={{maxHeight: "700px"}}>
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
            {chat.lead?.id ? (
              <button onClick={() => setLeadPreviewOpen(true)} className="font-semibold truncate hover:underline hover:text-primary transition-colors block text-left">
                {getLeadName()}
              </button>
            ) : (
              <h3 className="font-semibold truncate">{getLeadName()}</h3>
            )}
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
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef} scrollbarVariant="dark">
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
                                        "max-w-[75%] rounded-lg shadow-sm overflow-hidden",
                                        message.type === 'image' ? "p-1" : 
                                        message.type === 'audio' ? "px-2 py-1.5" : "p-3",
                                        message.direction === 'outgoing'
                                          ? "bg-green-500 text-white rounded-br-none"
                                          : "bg-card border border-border/50 rounded-bl-none"
                                      )}
                                    >
                                      {message.type === 'image' && message.media_url ? (
                                        <div className="space-y-1">
                                          <button 
                                            onClick={() => setLightboxImage(getStorageUrl(message.media_url) || null)}
                                            className="block"
                                          >
                                            <img
                                              src={getStorageUrl(message.media_url)}
                                              alt="Shared image"
                                              className="rounded-md max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                              loading="lazy"
                                            />
                                          </button>
                                          {message.text && (
                                            <p className="text-sm whitespace-pre-wrap break-words px-2 pt-1">
                                              {message.text}
                                            </p>
                                          )}
                                          <div className={cn(
                                            "flex items-center gap-1 px-2 pb-1",
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
                                      ) : message.type === 'audio' && message.media_url ? (
                                        <div className="space-y-2">
                                          <AudioPlayer 
                                            src={getStorageUrl(message.media_url) || ''} 
                                            isOutgoing={message.direction === 'outgoing'}
                                          />
                                          {message.text && (
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                              {message.text}
                                            </p>
                                          )}
                                          <div className={cn(
                                            "flex items-center gap-1",
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
                                      ) : (
                                        <>
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
                                        </>
                                      )}
                                    </div>
                  </motion.div>
                ))}
              </div>
            ))}

            {/* Pending Messages */}
            {pendingMessages.map((pending) => (
              <motion.div
                key={pending.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 shadow-sm rounded-br-none",
                    pending.status === 'error'
                      ? "bg-destructive/80 text-destructive-foreground"
                      : "bg-green-500/70 text-white"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {pending.text}
                  </p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    {pending.status === 'sending' ? (
                      <span className="text-xs text-green-100 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('chat.inbox.sending')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRetry(pending)}
                        className="text-xs underline hover:no-underline"
                      >
                        {t('chat.inbox.retry')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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

      {/* Message Input */}
      <div className="p-4 border-t border-border/50 bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.inbox.type-message')}
            disabled={isSending || !chat.lead?.id}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending || !chat.lead?.id}
            size="icon"
            className="shrink-0 bg-green-500 hover:bg-green-600"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={lightboxImage}
              alt="Full size image"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Preview Modal */}
      <LeadPreviewModal
        isOpen={leadPreviewOpen}
        onClose={() => setLeadPreviewOpen(false)}
        leadId={chat?.lead?.id ? String(chat.lead.id) : null}
      />
    </div>
  );
};

export default ChatConversation;
