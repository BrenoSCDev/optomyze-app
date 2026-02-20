import React from 'react';
import { ChatMessage } from '@/services/inboxChatApi';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  showDaySeparator: boolean;
}

function formatDaySeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message, isOwn, showSender, showDaySeparator,
}) => {
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {showDaySeparator && (
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border/40" />
          <span className="text-xs text-muted-foreground px-2 bg-background/60 rounded-full border border-border/30 py-0.5">
            {formatDaySeparator(message.created_at)}
          </span>
          <div className="flex-1 h-px bg-border/40" />
        </div>
      )}

      <div className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isOwn && (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mb-1">
            <span className="text-[10px] font-semibold text-primary">
              {getInitials(message.sender.name)}
            </span>
          </div>
        )}

        <div className={`flex flex-col max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {showSender && !isOwn && (
            <span className="text-[11px] text-muted-foreground mb-1 ml-1 font-medium">
              {message.sender.name}
            </span>
          )}

          {/* Bubble */}
          <div
            className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed
              ${isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border/50 text-foreground rounded-bl-sm'
              }`}
          >
            {message.type === 'text' && message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}

            {message.type === 'image' && message.file_url && (
              <img
                src={message.file_url}
                alt="Image"
                className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
                onClick={() => window.open(message.file_url!, '_blank')}
              />
            )}

            {message.type === 'audio' && message.file_url && (
              <audio controls src={message.file_url} className="max-w-[240px]" />
            )}
          </div>

          <span className={`text-[10px] text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? 'text-right' : 'text-left'}`}>
            {time}
          </span>
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
