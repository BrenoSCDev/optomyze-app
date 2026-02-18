import React from 'react';
import { InboxMessage, InboxUser, formatDaySeparator } from '@/data/mockInboxData';
import AudioMessagePlayer from './AudioMessage';
import FileMessageCard from './FileMessage';

interface MessageBubbleProps {
  message: InboxMessage;
  isOwn: boolean;
  sender: InboxUser | undefined;
  showSender: boolean;
  showDaySeparator: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  sender,
  showSender,
  showDaySeparator,
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
              {sender?.initials ?? '?'}
            </span>
          </div>
        )}

        <div className={`flex flex-col max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {showSender && !isOwn && sender && (
            <span className="text-[11px] text-muted-foreground mb-1 ml-1 font-medium">
              {sender.name}
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
            {message.type === 'text' && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {message.type === 'audio' && (
              <AudioMessagePlayer duration={message.audio_duration ?? '0:00'} isOwn={isOwn} />
            )}

            {message.type === 'file' && (
              <FileMessageCard
                fileName={message.file_name ?? 'File'}
                fileSize={message.file_size ?? ''}
                fileMime={message.file_mime ?? ''}
                isOwn={isOwn}
              />
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
