/**
 * WHATSAPP CONTEXT - OPTIMIZED FOR MESSAGE-BASED BROADCASTING
 * 
 * Handles individual message events instead of full chat updates
 * Much more efficient and scalable
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import echo from '@/services/echo';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';

// Broadcast event payload structure for optimized message-based updates
interface MessageReceivedEvent {
  message: WhatsAppMessage;
  chat: Omit<WhatsAppChat, 'messages'>; // Chat metadata without messages array
  timestamp: string;
}

interface WhatsAppContextType {
  chats: WhatsAppChat[];
  setChats: React.Dispatch<React.SetStateAction<WhatsAppChat[]>>;
  handleNewMessage: (event: MessageReceivedEvent) => void;
  selectedChat: WhatsAppChat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<WhatsAppChat | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

interface WhatsAppProviderProps {
  children: ReactNode;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Play notification sound for new messages
  const playMessageSound = useCallback(() => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(err => console.log('🔔 Could not play message sound:', err));
    } catch (err) {
      console.log('🔔 Error creating audio:', err);
    }
  }, []);

  // OPTIMIZED: Handle individual message updates
  const handleNewMessage = useCallback((event: MessageReceivedEvent) => {
    const { message, chat: chatMetadata } = event;
    console.log('💬 Processing new message:', message.id, 'for chat:', message.whatsapp_evo_chat_id);

    setChats(prevChats => {
      // Find existing chat
      const existingChatIndex = prevChats.findIndex(c => c.id === message.whatsapp_evo_chat_id);

      if (existingChatIndex !== -1) {
        // Chat exists - add message to it
        const updatedChats = [...prevChats];
        const existingChat = { ...updatedChats[existingChatIndex] };

        // Check if message already exists (prevent duplicates)
        const messageExists = existingChat.messages?.some(m => m.id === message.id);
        
        if (!messageExists) {
          // Add new message to the messages array
          existingChat.messages = [...(existingChat.messages || []), message];
          
          // Update last_message_at from chat metadata
          existingChat.last_message_at = chatMetadata.last_message_at;
          
          updatedChats[existingChatIndex] = existingChat;
        } else {
          console.warn('💬 Duplicate message prevented:', message.id);
          return prevChats;
        }

        // Re-sort chats by last_message_at (move updated chat to top)
        return updatedChats.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

      } else {
        // New chat - create it with the message
        const newChat: WhatsAppChat = {
          ...chatMetadata,
          messages: [message],
        } as WhatsAppChat;

        // Add new chat at the beginning
        return [newChat, ...prevChats];
      }
    });

    // Update selected chat if it matches
    setSelectedChat(prevSelected => {
      if (prevSelected && prevSelected.id === message.whatsapp_evo_chat_id) {
        const messageExists = prevSelected.messages?.some(m => m.id === message.id);
        if (!messageExists) {
          return {
            ...prevSelected,
            messages: [...(prevSelected.messages || []), message],
            last_message_at: chatMetadata.last_message_at,
          };
        }
      }
      return prevSelected;
    });

    // Play sound and show notification for incoming messages
    if (message.direction === 'incoming') {
      playMessageSound();
      
      // Get chat info for notification
      const leadName = `${chatMetadata.lead?.first_name || ''} ${chatMetadata.lead?.last_name || ''}`.trim() || 'Unknown';
      
      let messagePreview = '';
      if (message.type === 'text') {
        messagePreview = message.text || '';
      } else if (message.type === 'image') {
        messagePreview = '📷 Image';
      } else if (message.type === 'audio') {
        messagePreview = '🎤 Voice message';
      }

      toast.info(`New message from ${leadName}`, {
        description: messagePreview.length > 50 
          ? messagePreview.substring(0, 50) + '...' 
          : messagePreview,
        duration: 4000,
      });
    }
  }, [playMessageSound]);

  // Subscribe to WebSocket channel when user is authenticated
  useEffect(() => {
    const companyId = user?.company_id;
    
    if (!companyId) {
      console.log('💬 No company_id, skipping WhatsApp WebSocket subscription');
      return;
    }

    console.log(`💬 Subscribing to WhatsApp message updates: company.${companyId}`);

    // Subscribe to private channel (reuses existing Echo instance)
    const channel = echo.private(`company.${companyId}`);

    // Listen for whatsapp.message.received events (OPTIMIZED EVENT)
    channel.listen('.whatsapp.message.received', (event: MessageReceivedEvent) => {
      console.log('💬 Received whatsapp.message.received event:', event);
      handleNewMessage(event);
    });

    console.log('💬 Subscribed to WhatsApp message channel successfully');

    // Cleanup - Note: Don't leave channel if NotificationContext is also using it
    return () => {
      console.log(`💬 Unsubscribing WhatsApp listener from company.${companyId}`);
      channel.stopListening('.whatsapp.message.received');
      // Don't call echo.leave() here - NotificationContext might still need the channel
    };
  }, [user?.company_id, handleNewMessage]);

  const value: WhatsAppContextType = {
    chats,
    setChats,
    handleNewMessage,
    selectedChat,
    setSelectedChat,
    isLoading,
    setIsLoading,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};

export const useWhatsApp = (): WhatsAppContextType => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};
