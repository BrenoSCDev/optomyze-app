/**
 * WHATSAPP CONTEXT - OPTIMIZED FOR MESSAGE-BASED BROADCASTING
 * 
 * Handles individual message events instead of full chat updates
 * Much more efficient and scalable
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { getEcho } from '@/services/echo';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';
import { playNotificationSound } from '@/lib/notificationSounds';

// Broadcast event payload structure for optimized message-based updates
interface MessageReceivedEvent {
  message: WhatsAppMessage;
  chat: Omit<WhatsAppChat, 'messages'>; // Chat metadata without messages array
  timestamp: string;
}

interface ChatMessagesClearedEvent {
  chat_id: number;
  timestamp: string;
}

interface WhatsAppContextType {
  chats: WhatsAppChat[];
  setChats: React.Dispatch<React.SetStateAction<WhatsAppChat[]>>;
  handleNewMessage: (event: MessageReceivedEvent) => void;
  handleChatCleared: (chatId: number) => void;
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

  // Play notification sound for new messages - uses user's selected sound from preferences
  const playMessageSoundRef = useRef(() => {
    playNotificationSound();
  });

  // OPTIMIZED: Handle individual message updates - STABLE callback (no deps that change on route)
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
      playMessageSoundRef.current();
      
      // Get chat info for notification
      const leadName = `${chatMetadata.lead?.first_name || ''} ${chatMetadata.lead?.last_name || ''}`.trim() || 'Unknown';
      
      let messagePreview = '';
      if (message.type === 'text') {
        messagePreview = message.text || '';
      } else if (message.type === 'image') {
        messagePreview = '📷 Image';
      } else if (message.type === 'audio') {
        messagePreview = '🎤 Voice message';
      } else if (message.type === 'contact') {
        messagePreview = '👤 Contact';
      }

      toast.info(`New message from ${leadName}`, {
        description: messagePreview.length > 50 
          ? messagePreview.substring(0, 50) + '...' 
          : messagePreview,
        duration: 4000,
      });
    }
  }, []); // Empty deps = stable callback, uses refs for dynamic values

  // Handle chat messages cleared event
  const handleChatCleared = useCallback((chatId: number) => {
    console.log('💬 Clearing messages for chat:', chatId);
    setChats(prevChats => 
      prevChats.map(c => c.id === chatId ? { ...c, messages: [] } : c)
    );
    setSelectedChat(prevSelected => {
      if (prevSelected && prevSelected.id === chatId) {
        return { ...prevSelected, messages: [] };
      }
      return prevSelected;
    });
  }, []);

  // Subscribe to WebSocket channel when user is authenticated
  // IMPORTANT: Only depends on company_id, NOT on callbacks (they're stable via refs)
  useEffect(() => {
    const companyId = user?.company_id;
    
    if (!companyId) {
      console.log('💬 No company_id, skipping WhatsApp WebSocket subscription');
      return;
    }

    const echo = getEcho();
    if (!echo) {
      console.log('💬 Echo not initialized, skipping WhatsApp WebSocket subscription');
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

    // Listen for whatsapp.chat.messages.cleared events
    channel.listen('.whatsapp.chat.messages.cleared', (event: ChatMessagesClearedEvent) => {
      console.log('💬 Received whatsapp.chat.messages.cleared event:', event);
      handleChatCleared(event.chat_id);
    });

    console.log('💬 Subscribed to WhatsApp message channel successfully');

    // Cleanup - only on logout or company change, NOT on route navigation
    return () => {
      console.log(`💬 Unsubscribing WhatsApp listener from company.${companyId}`);
      channel.stopListening('.whatsapp.message.received');
      channel.stopListening('.whatsapp.chat.messages.cleared');
      // Don't call echo.leave() here - NotificationContext might still need the channel
    };
  }, [user?.company_id, handleNewMessage, handleChatCleared]);

  const value: WhatsAppContextType = {
    chats,
    setChats,
    handleNewMessage,
    handleChatCleared,
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
