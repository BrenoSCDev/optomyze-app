/**
 * MESSAGE COMPOSER
 *
 * Shared composer for inbox-style conversations (Global Inbox, Lead detail
 * chat). Provides an auto-expanding text area and an icon-based action
 * toolbar, with a dedicated "internal note" mode that visually separates
 * customer-facing messages from team-only notes.
 *
 * Actions (attach, audio recording) are optional so the same composer can be
 * used in contexts that don't yet support media. Voice recording uses the
 * shared `useAudioRecorder` hook and `VoiceRecorderBar`, so the experience
 * matches the Teams Chat message input.
 */

import React, { useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, StickyNote, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import VoiceRecorderBar from '@/components/chat/VoiceRecorderBar';
import EmojiPickerButton from '@/components/chat/EmojiPickerButton';

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
          "h-8 w-8 transition-colors",
          active
            ? (activeClassName || "text-primary bg-primary/10 hover:bg-primary/15")
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
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

  /** When provided, enables the voice recorder. Called with the recorded clip on send. */
  onSendAudio?: (file: File) => void;
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
  internalNoteLabel,
  onAttach,
  isAttaching,
  onSendAudio,
}) => {
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInternal = mode === 'internal';
  const recorder = useAudioRecorder();
  const isRecording = recorder.status !== 'idle';

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
      title: t('chat.composer.ai-assist-toast-title'),
      description: t('chat.composer.ai-assist-toast-description'),
    });
  };

  const handleStartRecording = async () => {
    const started = await recorder.start();
    if (!started) {
      toast({ title: t('chat.recorder.mic-denied'), variant: 'destructive' });
    }
  };

  const handleSendRecording = () => {
    const file = recorder.getFile();
    if (file) {
      onSendAudio?.(file);
    }
    recorder.reset();
  };

  const handleEmojiSelect = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + emoji);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
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
      {isInternal && !isRecording && (
        <div className="flex items-center gap-1.5 px-3 pt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          <StickyNote className="h-3.5 w-3.5" />
          {internalNoteLabel ?? t('chat.composer.internal-note-indicator')}
        </div>
      )}

      {isRecording ? (
        <VoiceRecorderBar
          status={recorder.status === 'preview' ? 'preview' : 'recording'}
          recordingTime={recorder.recordingTime}
          levels={recorder.levels}
          previewUrl={recorder.previewUrl}
          previewDuration={recorder.previewDuration}
          waveformPeaks={recorder.waveformPeaks}
          onCancel={recorder.cancel}
          onStop={recorder.stop}
          onSend={handleSendRecording}
          isSending={isAttaching}
        />
      ) : (
        <>
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
                  label={t('chat.composer.attach-file')}
                  onClick={onAttach}
                  disabled={disabled || isAttaching}
                />
              )}
              {onSendAudio && (
                <ToolbarButton
                  icon={<Mic className="h-4 w-4" />}
                  label={t('chat.recorder.record')}
                  onClick={handleStartRecording}
                  disabled={disabled || isAttaching}
                />
              )}
              <EmojiPickerButton
                onEmojiSelect={handleEmojiSelect}
                disabled={disabled}
              />
              <ToolbarButton
                icon={<Sparkles className="h-4 w-4" />}
                label={t('chat.composer.ai-assist')}
                onClick={handleAIAssist}
                className="text-violet-500 hover:text-violet-700 hover:bg-violet-500/10 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-400/15"
              />
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarButton
                icon={<StickyNote className="h-4 w-4" />}
                label={isInternal ? t('chat.composer.switch-to-reply') : t('chat.composer.write-internal-note')}
                onClick={() => onModeChange(isInternal ? 'external' : 'internal')}
                active={isInternal}
                activeClassName="text-amber-700 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60"
                disabled={disabled}
              />
            </div>

            <Button
              type="button"
              onClick={onSend}
              disabled={!value.trim() || isSending || disabled}
              size="icon"
              aria-label={t('chat.composer.send')}
              className={cn(
                "h-8 w-8 rounded-lg shrink-0",
                isInternal ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary hover:bg-primary/90"
              )}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageComposer;
