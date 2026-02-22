/**
 * LEAD CHAT SECTION
 * 
 * WhatsApp chat component for Lead Detail page
 * Displays chat messages and allows sending messages via the associated instance
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Phone, Send, Loader2, X, MapPin, ExternalLink } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWhatsApp } from '@/contexts/WhatsAppContext';
import { cn } from '@/lib/utils';
import { getStorageUrl } from '@/lib/constants';
import { sendWhatsAppMessage } from '@/services/whatsappChatApi';
import { toast } from 'sonner';
import AudioPlayer from '@/components/chat/inbox/AudioPlayer';
import DocumentMessage from '@/components/chat/inbox/DocumentMessage';
// Types matching the backend response
export interface LeadWhatsAppMessage {
  id: number;
  whatsapp_evo_chat_id: number;
  wa_message_id?: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  text: string;
  media_url?: string | null;
  media_mime?: string | null;
  media_size?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface LeadWhatsAppInstance {
  id: number;
  instance_name: string;
}

export interface LeadWhatsAppChat {
  id: number;
  company_id: number;
  whatsapp_instance_id: number;
  lead_id: number;
  remote_jid: string;
  phone_number: string;
  is_group: number;
  is_archived: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages: LeadWhatsAppMessage[];
  instance: LeadWhatsAppInstance;
}

interface PendingMessage {
  id: string;
  text: string;
  status: 'sending' | 'error';
}

interface LeadChatSectionProps {
  chat: LeadWhatsAppChat | null;
  leadId: number;
  onMessageSent?: (message: LeadWhatsAppMessage) => void;
}

const LeadChatSection: React.FC<LeadChatSectionProps> = ({
  chat: initialChat,
  leadId,
  onMessageSent
}) => {
  const { t } = useLanguage();
  const { chats } = useWhatsApp();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // REAL-TIME: Merge initial messages with live WebSocket messages
  const chat = useMemo(() => {
    if (!initialChat) return null;
    
    // Find matching chat in global context by chat ID
    const liveChat = chats.find(c => c.id === initialChat.id);
    
    if (liveChat && liveChat.messages?.length > 0) {
      // Get IDs of messages we already have from initial fetch
      const initialMessageIds = new Set(initialChat.messages?.map(m => m.id) || []);
      
      // Find only NEW messages from WebSocket that aren't in initial data
      const newMessages = liveChat.messages
        .filter(m => !initialMessageIds.has(m.id))
        .map(m => ({
          id: m.id,
          whatsapp_evo_chat_id: m.whatsapp_evo_chat_id,
          direction: m.direction,
          type: m.type,
          text: m.text || '',
          media_url: m.media_url,
          media_mime: m.media_mime,
          media_size: m.media_size,
          status: m.status,
          sent_at: m.sent_at,
          created_at: m.sent_at,
          updated_at: m.sent_at,
        })) as LeadWhatsAppMessage[];
      
      // Merge: keep all initial messages + append new WebSocket messages
      return {
        ...initialChat,
        messages: [...(initialChat.messages || []), ...newMessages],
        last_message_at: liveChat.last_message_at,
      };
    }
    
    return initialChat;
  }, [initialChat, chats]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  // Auto-scroll when chat loads, messages change (WebSocket), or pending messages update
  useEffect(() => {
    if (chat?.messages?.length || pendingMessages.length) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chat?.messages?.length, pendingMessages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chat?.whatsapp_instance_id) {
      return;
    }

    const text = messageText.trim();
    const tempId = `pending-${Date.now()}`;
    
    setMessageText('');
    setIsSending(true);
    setPendingMessages(prev => [...prev, { id: tempId, text, status: 'sending' }]);

    try {
      await sendWhatsAppMessage(chat.whatsapp_instance_id, {
        lead_id: leadId,
        text
      });

      // Create the sent message object to add locally
      const sentMessage: LeadWhatsAppMessage = {
        id: Date.now(), // Temporary ID
        whatsapp_evo_chat_id: chat.id,
        direction: 'outgoing',
        type: 'text',
        text,
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      toast.success(t('chat.inbox.message-sent'));
      onMessageSent?.(sentMessage);
    } catch (error: any) {
      setPendingMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m)
      );
      toast.error(error?.response?.data?.message || t('chat.inbox.message-error'));
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
    setPendingMessages(prev => prev.filter(m => m.id !== pendingMessage.id));
    setMessageText(pendingMessage.text);
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

  const groupMessagesByDate = (messages: LeadWhatsAppMessage[]) => {
    const groups: { date: string; messages: LeadWhatsAppMessage[] }[] = [];
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

  // Empty state - no WhatsApp chat associated
  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <FaWhatsapp className="w-8 h-8 text-green-500/60" />
        </div>
        <h4 className="text-white font-medium mb-2">{t('lead-details.tabs.chat-empty')}</h4>
        <p className="text-gray-400 text-sm text-center max-w-xs">
          {t('lead-details.tabs.chat-empty-desc')}
        </p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(chat.messages || []);

  return (
    <div className="flex flex-col h-[500px] rounded-lg overflow-hidden border border-white/10">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <FaWhatsapp className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">WhatsApp</span>
              {chat.instance && (
                <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                  {chat.instance.instance_name.split('_')[0]}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{chat.phone_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-black/20" ref={scrollAreaRef}>
        {chat.messages && chat.messages.length > 0 ? (
          <div className="space-y-4">
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center justify-center">
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400">
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
                        message.type === 'audio' ? "px-2 py-1.5" :
                        message.type === 'location' ? "p-2" :
                        message.type === 'document' ? "p-2" : "p-3",
                        message.direction === 'outgoing'
                          ? "bg-green-600 text-white rounded-br-none"
                          : "bg-white/10 border border-white/10 text-white rounded-bl-none"
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
                                ? "text-green-200" 
                                : "text-gray-400"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && (
                              <span className="text-xs text-green-200">
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
                                ? "text-green-200" 
                                : "text-gray-400"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && (
                              <span className="text-xs text-green-200">
                                • {message.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : message.type === 'location' && (message as any).latitude != null && (message as any).longitude != null ? (
                        <div className="space-y-1.5">
                          <div className="rounded-md overflow-hidden">
                            <iframe
                              src={`https://maps.google.com/maps?q=${(message as any).latitude},${(message as any).longitude}&z=15&output=embed`}
                              width="240"
                              height="160"
                              className="border-0 w-full"
                              loading="lazy"
                              allowFullScreen={false}
                            />
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${(message as any).latitude},${(message as any).longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-1.5 text-xs font-medium hover:underline",
                              message.direction === 'outgoing' ? "text-green-200" : "text-primary"
                            )}
                          >
                            <MapPin className="h-3 w-3" />
                            Open in Maps
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <div className={cn(
                            "flex items-center gap-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              message.direction === 'outgoing' 
                                ? "text-green-200" 
                                : "text-gray-400"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && (
                              <span className="text-xs text-green-200">
                                • {message.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : message.type === 'document' && message.media_url ? (
                        <div className="space-y-1">
                          <DocumentMessage
                            fileName={message.text || 'Document'}
                            fileUrl={getStorageUrl(message.media_url) || ''}
                            mimeType={message.media_mime}
                            fileSize={message.media_size}
                            isOutgoing={message.direction === 'outgoing'}
                          />
                          <div className={cn(
                            "flex items-center gap-1 px-1",
                            message.direction === 'outgoing' ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              message.direction === 'outgoing' 
                                ? "text-green-200" 
                                : "text-gray-400"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && (
                              <span className="text-xs text-green-200">
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
                                ? "text-green-200" 
                                : "text-gray-400"
                            )}>
                              {formatMessageTime(message.sent_at)}
                            </span>
                            {message.direction === 'outgoing' && message.status && (
                              <span className="text-xs text-green-200">
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
                      ? "bg-red-600/80 text-white"
                      : "bg-green-600/70 text-white"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {pending.text}
                  </p>
                  <div className="flex items-center gap-1 mt-1 justify-end">
                    {pending.status === 'sending' ? (
                      <span className="text-xs text-green-200 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('chat.inbox.sending')}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRetry(pending)}
                        className="text-xs underline hover:no-underline text-red-200"
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
            <MessageSquare className="h-12 w-12 text-gray-500/50" />
            <p className="text-gray-400 mt-2">
              {t('chat.inbox.no-messages-in-chat')}
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.inbox.type-message')}
            disabled={isSending}
            className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-gray-500"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            size="icon"
            className="shrink-0 bg-green-600 hover:bg-green-700"
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Full size image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadChatSection;
