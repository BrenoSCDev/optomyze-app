import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { toast } from '@/hooks/use-toast';
import VoiceRecorderBar from '@/components/chat/VoiceRecorderBar';
import EmojiPickerButton from '@/components/chat/EmojiPickerButton';

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendFile?: (file: File, type: 'image' | 'audio') => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onSendFile, disabled = false }) => {
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();
  const isRecording = recorder.status !== 'idle';

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file, 'image');
    }
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    const started = await recorder.start();
    if (!started) {
      toast({ title: t('chat.recorder.mic-denied'), variant: 'destructive' });
    }
  };

  const handleSendRecording = () => {
    const file = recorder.getFile();
    if (file && onSendFile) {
      onSendFile(file, 'audio');
    }
    recorder.reset();
  };

  const handleEmojiSelect = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setValue(prev => prev + emoji);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setValue(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="border-t border-border/40 bg-background/60 backdrop-blur-sm px-4 py-3">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      {isRecording ? (
        <div className="rounded-xl border border-border bg-background transition-colors">
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
          />
        </div>
      ) : (
        <>
          <div className="flex items-end gap-2">
            {/* Image attachment */}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 mb-1"
              title="Send image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Emoji picker */}
            <EmojiPickerButton onEmojiSelect={handleEmojiSelect} disabled={disabled} className="mb-1" />

            {/* Text area */}
            <div className="flex-1 relative bg-muted/30 border border-border/40 rounded-xl focus-within:border-primary/50 focus-within:bg-muted/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                disabled={disabled}
                rows={1}
                className="w-full px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-[120px] leading-5"
              />
            </div>

            {/* Audio */}
            <button
              onClick={handleStartRecording}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 mb-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title={t('chat.recorder.record')}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-primary-foreground transition-colors shrink-0 mb-1"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
            Press <kbd className="text-[9px] bg-muted px-1 py-0.5 rounded border border-border">Enter</kbd> to send &nbsp;·&nbsp; Shift+Enter for new line
          </p>
        </>
      )}
    </div>
  );
};

export default MessageInput;
