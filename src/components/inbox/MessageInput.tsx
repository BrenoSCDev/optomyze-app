import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, X, Image as ImageIcon } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  onSendFile?: (file: File, type: 'image' | 'audio') => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, onSendFile, disabled = false }) => {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (audioChunksRef.current.length > 0 && onSendFile) {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
            onSendFile(file, 'audio');
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
      }
    }
  };

  return (
    <div className="border-t border-border/40 bg-background/60 backdrop-blur-sm px-4 py-3">
      {isRecording && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs text-destructive font-medium flex-1">Recording audio...</span>
          <button onClick={toggleRecording} className="text-destructive hover:text-destructive/80 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      <div className="flex items-end gap-2">
        {/* Image attachment */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 mb-1"
          title="Send image"
        >
          <Paperclip className="w-4 h-4" />
        </button>

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
          onClick={toggleRecording}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 mb-1
            ${isRecording
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          title="Record audio"
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
    </div>
  );
};

export default MessageInput;
