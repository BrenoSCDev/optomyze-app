import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getEcho } from '@/services/echo';
import {
  ChatConversation, ChatMessage,
  openPrivateConversation, fetchMessages, sendTextMessage, sendFileMessage,
} from '@/services/inboxChatApi';
import MessageBubble from '@/components/inbox/MessageBubble';
import MessageInput from '@/components/inbox/MessageInput';

interface ChatTabProps {
  userId: number;
  active: boolean;
}

const ChatTab: React.FC<ChatTabProps> = ({ userId, active }) => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<number>>(new Set());

  // Open / load the private conversation on first activation of this tab
  useEffect(() => {
    if (!active || hasLoaded) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const conv = await openPrivateConversation(userId);
        if (cancelled) return;
        setConversation(conv);

        const firstFetch = await fetchMessages(conv.id, 1);
        if (cancelled) return;
        const lastPage = firstFetch.meta.last_page;
        const result = lastPage <= 1 ? firstFetch : await fetchMessages(conv.id, lastPage);
        if (cancelled) return;

        messageIdsRef.current = new Set(result.data.map(m => m.id));
        setMessages(result.data);
        setHasLoaded(true);
      } catch (err) {
        console.error('Failed to open conversation:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [active, userId, hasLoaded]);

  // Scroll to bottom on load / new messages
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLoading, messages.length]);

  // Real-time message subscription
  useEffect(() => {
    if (!conversation) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `conversation.${conversation.id}`;
    const channel = echo.private(channelName);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.listen('.message.sent', (payload: any) => {
      const msg: ChatMessage = payload?.id ? payload : payload?.message;
      if (!msg?.id) return;
      if (messageIdsRef.current.has(msg.id)) return;
      messageIdsRef.current.add(msg.id);
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      echo.leave(channelName);
    };
  }, [conversation?.id]);

  const handleSend = useCallback(async (content: string) => {
    if (!conversation || isSending) return;
    setIsSending(true);
    try {
      const msg = await sendTextMessage(conversation.id, content);
      messageIdsRef.current.add(msg.id);
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  }, [conversation, isSending]);

  const handleSendFile = useCallback(async (file: File, type: 'image' | 'audio') => {
    if (!conversation) return;
    try {
      const msg = await sendFileMessage(conversation.id, type, file);
      messageIdsRef.current.add(msg.id);
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      console.error('Failed to send file:', err);
    }
  }, [conversation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rendered = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const showSeparator = !prev || new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString();
    return { msg, showSeparator };
  });

  return (
    <div className="flex flex-col h-[420px] border border-border/40 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {rendered.map(({ msg, showSeparator }) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === currentUserId}
            showSender={false}
            showDaySeparator={showSeparator}
          />
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No messages yet. Say hello!
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} onSendFile={handleSendFile} disabled={isSending} />
    </div>
  );
};

export default ChatTab;
