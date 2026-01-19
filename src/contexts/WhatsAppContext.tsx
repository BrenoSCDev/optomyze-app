/**
 * WHATSAPP CONTEXT
 * 
 * Manages real-time WhatsApp chat updates
 * Subscribes to company-specific WebSocket channels for incoming messages
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import echo from '@/services/echo';
import { WhatsAppChat, WhatsAppMessage } from '@/types/whatsappChat';

interface WhatsAppContextType {
  chats: WhatsAppChat[];
  setChats: React.Dispatch<React.SetStateAction<WhatsAppChat[]>>;
  updateChatFromBroadcast: (updatedChat: WhatsAppChat) => void;
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

  // Update chat state when receiving broadcast
  const updateChatFromBroadcast = useCallback((updatedChat: WhatsAppChat) => {
    console.log('💬 Updating chat from broadcast:', updatedChat.id);
    
    setChats(prevChats => {
      // Remove the old version of this chat (if exists)
      const filteredChats = prevChats.filter(c => c.id !== updatedChat.id);
      
      // Add updated chat at the beginning and re-sort by last_message_at
      const newChats = [updatedChat, ...filteredChats].sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      
      return newChats;
    });

    // Update selected chat if it's the one that was updated
    setSelectedChat(prevSelected => {
      if (prevSelected && prevSelected.id === updatedChat.id) {
        return updatedChat;
      }
      return prevSelected;
    });

    // Check for new incoming messages
    const hasNewIncomingMessage = updatedChat.messages?.some(
      msg => msg.direction === 'incoming' && 
      new Date(msg.sent_at).getTime() > Date.now() - 5000 // Message sent in last 5 seconds
    );

    if (hasNewIncomingMessage) {
      playMessageSound();
      
      // Show toast notification
      const leadName = `${updatedChat.lead?.first_name || ''} ${updatedChat.lead?.last_name || ''}`.trim() || 'Unknown';
      const lastMessage = updatedChat.messages?.[updatedChat.messages.length - 1];
      
      let messagePreview = '';
      if (lastMessage) {
        if (lastMessage.type === 'text') {
          messagePreview = lastMessage.text || '';
        } else if (lastMessage.type === 'image') {
          messagePreview = '📷 Image';
        } else if (lastMessage.type === 'audio') {
          messagePreview = '🎤 Voice message';
        }
      }

      toast.info(`New message from ${leadName}`, {
        description: messagePreview.slice(0, 50) + (messagePreview.length > 50 ? '...' : ''),
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

    console.log(`💬 Subscribing to WhatsApp updates: company.${companyId}`);

    // Subscribe to private channel (reuses existing Echo instance)
    const channel = echo.private(`company.${companyId}`);

    // Listen for whatsapp.chat.updated events
    channel.listen('.whatsapp.chat.updated', (event: { chat: WhatsAppChat; timestamp: string }) => {
      console.log('💬 Received whatsapp.chat.updated event:', event);
      updateChatFromBroadcast(event.chat);
    });

    console.log('💬 Subscribed to WhatsApp channel successfully');

    // Cleanup - Note: Don't leave channel if NotificationContext is also using it
    return () => {
      console.log(`💬 Unsubscribing WhatsApp listener from company.${companyId}`);
      channel.stopListening('.whatsapp.chat.updated');
      // Don't call echo.leave() here - NotificationContext might still need the channel
    };
  }, [user?.company_id, updateChatFromBroadcast]);

  const value: WhatsAppContextType = {
    chats,
    setChats,
    updateChatFromBroadcast,
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
