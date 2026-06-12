/**
 * MESSAGE COMPOSER
 *
 * Shared composer for inbox-style conversations (Global Inbox, Lead detail
 * chat). Provides an auto-expanding text area and an icon-based action
 * toolbar, with a dedicated "internal note" mode that visually separates
 * customer-facing messages from team-only notes.
 *
 * Actions (attach, audio recording) are optional so the same composer can be
 * used in contexts that don't yet support media.
 */

import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, StickyNote, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export type MessageComposerMode = 'external' | 'internal';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClassName?: string;
  className?: string;
  disabled?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, label, onClick, active, activeClassName, className, disabled }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground",
          active && (activeClassName || "text-primary bg-primary/10"),
          className
        )}
      >
        {icon}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
);

export interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  isSending?: boolean;

  mode: MessageComposerMode;
  onModeChange: (mode: MessageComposerMode) => void;
  internalNoteLabel?: string;

  onAttach?: () => void;
  isAttaching?: boolean;

  isRecording?: boolean;
  onToggleRecording?: () => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  isSending,
  mode,
  onModeChange,
  internalNoteLabel = 'Internal note — only visible to your team',
  onAttach,
  isAttaching,
  isRecording,
  onToggleRecording,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInternal = mode === 'internal';

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleAIAssist = () => {
    toast({
      title: 'AI Assist',
      description: 'AI-generated replies are coming soon.',
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-background transition-colors focus-within:ring-2 focus-within:ring-offset-0",
        isInternal
          ? "border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 focus-within:ring-amber-400/40"
          : "border-border focus-within:ring-primary/30"
      )}
    >
      {/* Internal note indicator */}
      {isInternal && (
        <div className="flex items-center gap-1.5 px-3 pt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          <StickyNote className="h-3.5 w-3.5" />
          {internalNoteLabel}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 pt-2 text-xs font-medium text-destructive">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Recording audio...
          <button
            type="button"
            onClick={onToggleRecording}
            className="ml-auto text-destructive hover:text-destructive/80"
            aria-label="Cancel recording"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-sm text-foreground placeholder:text-muted-foreground outline-none max-h-40"
      />

      {/* Action toolbar */}
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <div className="flex items-center gap-0.5">
          {onAttach && (
            <ToolbarButton
              icon={isAttaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              label="Attach file"
              onClick={onAttach}
              disabled={disabled || isAttaching}
            />
          )}
          {onToggleRecording && (
            <ToolbarButton
              icon={<Mic className="h-4 w-4" />}
              label={isRecording ? 'Stop recording' : 'Record audio'}
              onClick={onToggleRecording}
              disabled={disabled || isAttaching}
              active={isRecording}
              activeClassName="text-destructive bg-destructive/10 hover:text-destructive"
            />
          )}
          <ToolbarButton
            icon={<Sparkles className="h-4 w-4" />}
            label="AI Assist (coming soon)"
            onClick={handleAIAssist}
            className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/10"
          />
          <div className="mx-1 h-5 w-px bg-border" />
          <ToolbarButton
            icon={<StickyNote className="h-4 w-4" />}
            label={isInternal ? 'Switch to reply' : 'Write internal note'}
            onClick={() => onModeChange(isInternal ? 'external' : 'internal')}
            active={isInternal}
            activeClassName="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40"
            disabled={disabled}
          />
        </div>

        <Button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isSending || disabled}
          size="icon"
          aria-label="Send"
          className={cn(
            "h-8 w-8 rounded-lg shrink-0",
            isInternal ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary hover:bg-primary/90"
          )}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default MessageComposer;
