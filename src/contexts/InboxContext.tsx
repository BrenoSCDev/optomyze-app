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
    is_archived?: boolean;
    is_favorite?: boolean;
  };
  timestamp: string;
}

/**
 * Messages in a conversation were marked read.
 *
 * `direction` decides what it means: 'incoming' is a colleague opening the
 * conversation (clear the unread badge), 'outgoing' is the website visitor
 * reading what we sent (turn our own bubbles' ticks).
 */
interface MessagesReadEvent {
  chat_id: number;
  direction: 'incoming' | 'outgoing';
  message_ids: number[];
  unread_count: number;
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

  /**
   * The open conversation, readable from the websocket callbacks.
   *
   * Those callbacks are deliberately dependency-free so the subscription is
   * not torn down and rebuilt on every selection; a ref is how they see
   * current state without becoming unstable.
   */
  const selectedChatRef = useRef<InboxChat | null>(null);
  selectedChatRef.current = selectedChat;

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

          // An arriving inbound message is unread until someone opens the
          // conversation — unless this is the conversation already open, in
          // which case the reader is looking straight at it and the thread
          // marks it read on arrival.
          if (message.direction === 'incoming' && selectedChatRef.current?.id !== existingChat.id) {
            existingChat.unread_count = (existingChat.unread_count || 0) + 1;
          }

          updatedChats[existingChatIndex] = existingChat;
        } else {
          console.warn('💬 Duplicate message prevented:', message.id);
          return prevChats;
        }

        // Favourites stay pinned; the rest order by most recent activity.
        return updatedChats.sort((a, b) => {
          const pinned = Number(!!b.is_favorite) - Number(!!a.is_favorite);
          if (pinned !== 0) return pinned;
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

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

  // Merge chat-level state updates (AI agent ownership, archived, favourited)
  const handleChatUpdated = useCallback((event: ChatUpdatedEvent) => {
    const { chat } = event;

    const merge = <T extends InboxChat>(c: T): T => ({
      ...c,
      ai_agent_service: chat.ai_agent_service,
      ...(chat.is_archived === undefined ? {} : { is_archived: chat.is_archived }),
      ...(chat.is_favorite === undefined ? {} : { is_favorite: chat.is_favorite }),
    });

    setChats(prevChats => prevChats.map(c => (c.id === chat.id ? merge(c) : c)));

    setSelectedChat(prevSelected =>
      prevSelected && prevSelected.id === chat.id ? merge(prevSelected) : prevSelected
    );
  }, []);

  /**
   * Someone read messages in a conversation.
   *
   * Inbound: a colleague opened it, so the unread badge clears for everyone.
   * Outgoing: the website visitor read what we sent, so those bubbles get
   * their read state — this is the website channel's equivalent of the
   * delivery receipts WhatsApp and Instagram push over their webhooks.
   */
  const handleMessagesRead = useCallback((event: MessagesReadEvent) => {
    const { chat_id, direction, message_ids, unread_count } = event;
    const readIds = new Set(message_ids || []);

    const markRead = (m: InboxMessage): InboxMessage =>
      readIds.has(m.id) ? { ...m, status: 'read' } : m;

    setChats(prevChats =>
      prevChats.map(c => {
        if (c.id !== chat_id) return c;
        return {
          ...c,
          messages: (c.messages || []).map(markRead),
          ...(direction === 'incoming' ? { unread_count: unread_count ?? 0 } : {}),
        };
      })
    );

    setSelectedChat(prevSelected =>
      prevSelected && prevSelected.id === chat_id
        ? {
            ...prevSelected,
            messages: (prevSelected.messages || []).map(markRead),
            ...(direction === 'incoming' ? { unread_count: unread_count ?? 0 } : {}),
          }
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

    // Listen for inbox.chat.updated events (AI agent ownership, archive, pin)
    channel.listen('.inbox.chat.updated', (event: ChatUpdatedEvent) => {
      console.log('💬 Received inbox.chat.updated event:', event);
      handleChatUpdated(event);
    });

    // Listen for inbox.messages.read events (unread badges, read receipts)
    channel.listen('.inbox.messages.read', (event: MessagesReadEvent) => {
      console.log('💬 Received inbox.messages.read event:', event);
      handleMessagesRead(event);
    });

    console.log('💬 Subscribed to Inbox message channel successfully');

    // Cleanup - only on logout or company change, NOT on route navigation
    return () => {
      console.log(`💬 Unsubscribing Inbox listener from company.${companyId}`);
      channel.stopListening('.inbox.message.received');
      channel.stopListening('.inbox.messages.cleared');
      channel.stopListening('.inbox.message.updated');
      channel.stopListening('.inbox.chat.updated');
      channel.stopListening('.inbox.messages.read');
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
