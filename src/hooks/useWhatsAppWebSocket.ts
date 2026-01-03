/**
 * WHATSAPP WEBSOCKET HOOK
 * 
 * Manages real-time WebSocket connection for WhatsApp messages
 * using Laravel Echo and Reverb
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import echo from '@/lib/echo';

export interface WebSocketMessage {
  message: {
    id: number;
    wa_message_id: string;
    direction: 'incoming' | 'outgoing';
    type: string;
    text: string;
    status: string;
    sent_at: string;
    created_at: string;
  };
  conversation: {
    id: number;
    remote_jid: string;
    phone_number: string;
    last_message_at: string;
  };
  lead: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
  };
  meta: {
    company_id: number;
    timestamp: string;
  };
}

interface UseWhatsAppWebSocketOptions {
  onMessageReceived?: (message: WebSocketMessage) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

export const useWhatsAppWebSocket = (options: UseWhatsAppWebSocketOptions = {}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  const { onMessageReceived, onConnectionChange, onError } = options;

  // Handle new incoming message
  const handleNewMessage = useCallback((event: WebSocketMessage) => {
    console.log('📨 Real-time message received:', event);
    onMessageReceived?.(event);
  }, [onMessageReceived]);

  // Subscribe to company channel
  useEffect(() => {
    const companyId = user?.company_id;

    if (!companyId) {
      console.warn('No company ID available, skipping WebSocket subscription');
      return;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) {
      return;
    }

    console.log(`🔌 Subscribing to company channel: private-company.${companyId}`);

    try {
      // Subscribe to private company channel
      const channel = echo.private(`company.${companyId}`);
      channelRef.current = channel;
      isSubscribedRef.current = true;

      // Listen for incoming messages
      channel.listen('.message.received', handleNewMessage);

      // Handle subscription errors
      channel.error((error: Error) => {
        console.error('Channel subscription error:', error);
        setConnectionError('Failed to subscribe to message channel');
        onError?.(error);
      });

    } catch (error) {
      console.error('Failed to set up WebSocket connection:', error);
      setConnectionError('Failed to connect to WebSocket server');
      onError?.(error as Error);
    }

    // Monitor connection status
    const pusherConnection = echo.connector.pusher.connection;

    pusherConnection.bind('connected', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      setConnectionError(null);
      onConnectionChange?.(true);
    });

    pusherConnection.bind('disconnected', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    pusherConnection.bind('error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError('WebSocket connection error');
      onError?.(error);
    });

    pusherConnection.bind('state_change', (states: { previous: string; current: string }) => {
      console.log(`WebSocket state: ${states.previous} → ${states.current}`);
    });

    // Cleanup function
    return () => {
      console.log(`🔌 Unsubscribing from company.${companyId}`);
      try {
        if (channelRef.current) {
          channelRef.current.stopListening('.message.received');
        }
        echo.leave(`private-company.${companyId}`);
        isSubscribedRef.current = false;
        channelRef.current = null;
      } catch (error) {
        console.error('Error leaving channel:', error);
      }
    };
  }, [user?.company_id, handleNewMessage, onConnectionChange, onError]);

  return {
    isConnected,
    connectionError,
  };
};

export default useWhatsAppWebSocket;
