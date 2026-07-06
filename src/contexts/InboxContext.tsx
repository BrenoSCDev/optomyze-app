/**
 * GLOBAL INBOX CONTEXT - OPTIMIZED FOR MESSAGE-BASED BROADCASTING
 *
 * Handles individual message events instead of full chat updates
 * Much more efficient and scalable. Channel-agnostic (WhatsApp, Instagram,
 * Messenger, SMS, ...).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { getEcho } from '@/services/echo';
import { InboxChat, InboxMessage } from '@/types/inbox';
import { playNotificationSound } from '@/lib/notificationSounds';

// Broadcast event payload structure for optimized message-based updates
interface MessageReceivedEvent {
  message: InboxMessage;
  chat: Omit<InboxChat, 'messages'>; // Chat metadata without messages array
  timestamp: string;
}

interface ChatMessagesClearedEvent {
  chat_id: number;
  channel: string;
  timestamp: string;
}

// Broadcast event payload for in-place updates to an existing message
// (e.g. a reaction was added/removed, or the message was edited)
interface MessageUpdatedEvent {
  message: Pick<InboxMessage, 'id' | 'inbox_chat_id' | 'text' | 'reactions' | 'is_edited' | 'status'>;
}

// Broadcast event payload for chat-level state changes (AI ownership flag)
interface ChatUpdatedEvent {
  chat: {
    id: number;
    lead_id: number | null;
    ai_agent_service: boolean;
  };
  timestamp: string;
}

interface InboxContextType {
  chats: InboxChat[];
  setChats: React.Dispatch<React.SetStateAction<InboxChat[]>>;
  handleNewMessage: (event: MessageReceivedEvent) => void;
  handleMessageUpdated: (event: MessageUpdatedEvent) => void;
  handleChatCleared: (chatId: number) => void;
  handleChatUpdated: (event: ChatUpdatedEvent) => void;
  selectedChat: InboxChat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<InboxChat | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

interface InboxProviderProps {
  children: ReactNode;
}

export const InboxProvider: React.FC<InboxProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<InboxChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<InboxChat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Play notification sound for new messages - uses user's selected sound from preferences
  const playMessageSoundRef = useRef(() => {
    playNotificationSound();
  });

  // OPTIMIZED: Handle individual message updates - STABLE callback (no deps that change on route)
  const handleNewMessage = useCallback((event: MessageReceivedEvent) => {
    const { message, chat: chatMetadata } = event;
    console.log('💬 Processing new message:', message.id, 'for chat:', message.inbox_chat_id);

    setChats(prevChats => {
      // Find existing chat
      const existingChatIndex = prevChats.findIndex(c => c.id === message.inbox_chat_id);

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
        const newChat: InboxChat = {
          ...chatMetadata,
          messages: [message],
        } as InboxChat;

        // Add new chat at the beginning
        return [newChat, ...prevChats];
      }
    });

    // Update selected chat if it matches
    setSelectedChat(prevSelected => {
      if (prevSelected && prevSelected.id === message.inbox_chat_id) {
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

  // Merge an in-place message update (reaction added/removed, edit flag) by id
  const handleMessageUpdated = useCallback((event: MessageUpdatedEvent) => {
    const { message } = event;

    const applyUpdate = (m: InboxMessage): InboxMessage =>
      m.id === message.id
        ? { ...m, text: message.text, reactions: message.reactions, is_edited: message.is_edited, status: message.status }
        : m;

    setChats(prevChats =>
      prevChats.map(c =>
        c.id === message.inbox_chat_id
          ? { ...c, messages: (c.messages || []).map(applyUpdate) }
          : c
      )
    );

    setSelectedChat(prevSelected =>
      prevSelected && prevSelected.id === message.inbox_chat_id
        ? { ...prevSelected, messages: (prevSelected.messages || []).map(applyUpdate) }
        : prevSelected
    );
  }, []);

  // Merge chat-level state updates (AI agent ownership toggled on/off)
  const handleChatUpdated = useCallback((event: ChatUpdatedEvent) => {
    const { chat } = event;

    setChats(prevChats =>
      prevChats.map(c =>
        c.id === chat.id ? { ...c, ai_agent_service: chat.ai_agent_service } : c
      )
    );

    setSelectedChat(prevSelected =>
      prevSelected && prevSelected.id === chat.id
        ? { ...prevSelected, ai_agent_service: chat.ai_agent_service }
        : prevSelected
    );
  }, []);

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
      console.log('💬 No company_id, skipping Inbox WebSocket subscription');
      return;
    }

    const echo = getEcho();
    if (!echo) {
      console.log('💬 Echo not initialized, skipping Inbox WebSocket subscription');
      return;
    }

    console.log(`💬 Subscribing to Inbox message updates: company.${companyId}`);

    // Subscribe to private channel (reuses existing Echo instance)
    const channel = echo.private(`company.${companyId}`);

    // Listen for inbox.message.received events (OPTIMIZED EVENT)
    channel.listen('.inbox.message.received', (event: MessageReceivedEvent) => {
      console.log('💬 Received inbox.message.received event:', event);
      handleNewMessage(event);
    });

    // Listen for inbox.messages.cleared events
    channel.listen('.inbox.messages.cleared', (event: ChatMessagesClearedEvent) => {
      console.log('💬 Received inbox.messages.cleared event:', event);
      handleChatCleared(event.chat_id);
    });

    // Listen for inbox.message.updated events (reaction added/removed, edits)
    channel.listen('.inbox.message.updated', (event: MessageUpdatedEvent) => {
      console.log('💬 Received inbox.message.updated event:', event);
      handleMessageUpdated(event);
    });

    // Listen for inbox.chat.updated events (AI agent ownership changes)
    channel.listen('.inbox.chat.updated', (event: ChatUpdatedEvent) => {
      console.log('💬 Received inbox.chat.updated event:', event);
      handleChatUpdated(event);
    });

    console.log('💬 Subscribed to Inbox message channel successfully');

    // Cleanup - only on logout or company change, NOT on route navigation
    return () => {
      console.log(`💬 Unsubscribing Inbox listener from company.${companyId}`);
      channel.stopListening('.inbox.message.received');
      channel.stopListening('.inbox.messages.cleared');
      channel.stopListening('.inbox.message.updated');
      channel.stopListening('.inbox.chat.updated');
      // Don't call echo.leave() here - NotificationContext might still need the channel
    };
  }, [user?.company_id, handleNewMessage, handleChatCleared, handleMessageUpdated, handleChatUpdated]);

  const value: InboxContextType = {
    chats,
    setChats,
    handleNewMessage,
    handleMessageUpdated,
    handleChatCleared,
    handleChatUpdated,
    selectedChat,
    setSelectedChat,
    isLoading,
    setIsLoading,
  };

  return (
    <InboxContext.Provider value={value}>
      {children}
    </InboxContext.Provider>
  );
};

export const useInbox = (): InboxContextType => {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error('useInbox must be used within an InboxProvider');
  }
  return context;
};
