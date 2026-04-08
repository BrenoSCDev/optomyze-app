import React from 'react';
import { ChatMessage } from '@/services/inboxChatApi';
import { Check } from 'lucide-react';
import AudioMessagePlayer from './AudioMessage';
import { extractTime } from '@/lib/utils';
import { usePrivateFile } from '@/hooks/usePrivateFile';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
  showDaySeparator: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: number) => void;
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
  selectMode = false, isSelected = false, onToggleSelect,
}) => {
  const time = extractTime(message.created_at);
  const fileUrl = usePrivateFile(message.file_url);
  const avatarUrl = usePrivateFile(message.sender.profile_pic_url);

  const handleClick = () => {
    if (selectMode && onToggleSelect) {
      onToggleSelect(message.id);
    }
  };

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

      <div
        className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${selectMode ? 'cursor-pointer' : ''} ${isSelected ? 'bg-primary/5 rounded-lg -mx-1 px-1' : ''}`}
        onClick={handleClick}
      >
        {/* Select checkbox */}
        {selectMode && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mb-1 transition-colors
            ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
        )}

        {/* Avatar */}
        {!isOwn && (
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={message.sender.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-semibold text-primary">
                {getInitials(message.sender.name)}
              </span>
            )}
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
            className={`relative rounded-2xl shadow-sm text-sm leading-relaxed
              ${message.type === 'audio' ? 'px-1.5 py-1.5' : 'px-4 py-2.5'}
              ${isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-card border border-border/50 text-foreground rounded-bl-sm'
              }`}
          >
            {message.type === 'text' && message.body && (
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
            )}

            {message.type === 'image' && fileUrl && (
              <img
                src={fileUrl}
                alt="Image"
                className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
                onClick={(e) => { if (!selectMode) { e.stopPropagation(); window.open(fileUrl, '_blank'); } }}
              />
            )}

            {message.type === 'audio' && fileUrl && (
              <AudioMessagePlayer
                src={fileUrl}
                duration={message.body || '0:00'}
                isOwn={isOwn}
              />
            )}
          </div>

          <span className={`text-[10px] text-muted-foreground mt-1 px-1 ${message.type === 'audio' ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150 ${isOwn ? 'text-right' : 'text-left'}`}>
            {time}
          </span>
        </div>
      </div>
    </>
  );
};

export default MessageBubble;
