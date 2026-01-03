/**
 * WHATSAPP INBOX COMPONENT
 * 
 * Provides WhatsApp inbox management with:
 * - 3-panel layout: Chat list, Conversation, Details
 * - Message display and chat management
 * - Responsive design for desktop, tablet, and mobile
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { fetchWhatsAppChats } from '@/services/whatsappChatApi';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';
import ChatList from './inbox/ChatList';
import ChatConversation from './inbox/ChatConversation';
import ChatDetails from './inbox/ChatDetails';
import { cn } from '@/lib/utils';
import { useWhatsAppWebSocket, WebSocketMessage } from '@/hooks/useWhatsAppWebSocket';

type ViewMode = 'list' | 'conversation' | 'details';

const WhatsAppInbox: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<ViewMode>('list');

  // Handle real-time message received via WebSocket
  const handleWebSocketMessage = useCallback((event: WebSocketMessage) => {
    const { message, conversation, lead } = event;

    // Create new message object matching WhatsAppMessage type
    const newMessage: WhatsAppMessage = {
      id: message.id,
      whatsapp_evo_chat_id: conversation.id,
      direction: message.direction,
      type: message.type,
      text: message.text,
      status: message.status,
      sent_at: message.sent_at,
    };

    // Update chats with the new message
    setChats(prevChats => {
      const chatExists = prevChats.some(chat => chat.id === conversation.id);
      
      if (chatExists) {
        // Update existing chat
        const updatedChats = prevChats.map(chat => {
          if (chat.id === conversation.id) {
            // Check if message already exists
            const messageExists = chat.messages?.some(m => m.id === message.id);
            if (messageExists) return chat;

            return {
              ...chat,
              messages: [...(chat.messages || []), newMessage],
              last_message_at: message.sent_at,
            };
          }
          return chat;
        });

        // Sort by last_message_at descending
        return updatedChats.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
      } else {
        // New conversation - trigger a full refresh
        loadChats();
        return prevChats;
      }
    });

    // Update selected chat if it matches
    setSelectedChat(prev => {
      if (prev?.id === conversation.id) {
        const messageExists = prev.messages?.some(m => m.id === message.id);
        if (messageExists) return prev;

        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage],
          last_message_at: message.sent_at,
        };
      }
      return prev;
    });

    // Show notification for incoming messages
    if (message.direction === 'incoming') {
      const leadName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || conversation.phone_number;
      toast({
        title: t('chat.inbox.new-message'),
        description: `${leadName}: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`,
      });
    }
  }, [toast, t]);

  // WebSocket connection
  const { isConnected } = useWhatsAppWebSocket({
    onMessageReceived: handleWebSocketMessage,
    onConnectionChange: (connected) => {
      if (connected) {
        console.log('✅ WebSocket connected - real-time messages enabled');
      } else {
        console.log('❌ WebSocket disconnected');
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  // Fetch chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWhatsAppChats();
      // Sort by last_message_at descending
      const sortedChats = (response.data || []).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setChats(sortedChats);
    } catch (err) {
      console.error('Failed to fetch WhatsApp chats:', err);
      setError(t('chat.inbox.error-loading'));
      toast({
        title: t('chat.inbox.error-title'),
        description: t('chat.inbox.error-loading'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat: WhatsAppChat) => {
    setSelectedChat(chat);
    setMobileView('conversation');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleShowDetails = () => {
    setMobileView('details');
  };

  const handleCloseDetails = () => {
    setMobileView('conversation');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-border/50 bg-background flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <FaWhatsapp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              {t('chat.inbox.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('chat.inbox.description')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors",
            isConnected 
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{isConnected ? t('chat.inbox.connected') : t('chat.inbox.offline')}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadChats}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        </div>
      </motion.div>

      {/* Error State */}
      {error && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4"
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('chat.inbox.error-title')}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadChats}>
                {t('common.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content - 3 Panel Layout */}
      {!error && (
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Layout - 3 columns */}
          <div className="hidden lg:flex flex-1">
            {/* Chat List - Left Panel */}
            <div className="w-80 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
              />
            </div>

            {/* Conversation - Center Panel */}
            <div className="flex-1 min-w-0">
              <ChatConversation chat={selectedChat} onMessageSent={loadChats} />
            </div>

            {/* Details - Right Panel */}
            <div className="w-80 border-l border-border/50 shrink-0">
              <ChatDetails chat={selectedChat} />
            </div>
          </div>

          {/* Tablet Layout - 2 columns */}
          <div className="hidden md:flex lg:hidden flex-1">
            {/* Chat List - Left Panel */}
            <div className="w-72 border-r border-border/50 shrink-0">
              <ChatList
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
              />
            </div>

            {/* Conversation - Center Panel */}
            <div className="flex-1 min-w-0">
              <ChatConversation chat={selectedChat} onMessageSent={loadChats} />
            </div>
          </div>

          {/* Mobile Layout - Single column with view switching */}
          <div className="flex md:hidden flex-1">
            <AnimatePresence mode="wait">
              {mobileView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full"
                >
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={handleSelectChat}
                    isLoading={isLoading}
                  />
                </motion.div>
              )}

              {mobileView === 'conversation' && (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full"
                >
                  <ChatConversation
                    chat={selectedChat}
                    onBack={handleBackToList}
                    showBackButton
                    onMessageSent={loadChats}
                  />
                </motion.div>
              )}

              {mobileView === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full"
                >
                  <ChatDetails
                    chat={selectedChat}
                    onClose={handleCloseDetails}
                    showCloseButton
                    defaultCollapsed={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppInbox;
