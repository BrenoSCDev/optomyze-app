import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Pause, Play, Send, Square, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const barHeight = (level: number) => Math.max(4, 4 + level * 28);

const LiveWaveform = ({ levels }: { levels: number[] }) => (
  <div className="flex h-9 flex-1 min-w-0 items-center gap-[3px] overflow-hidden">
    {levels.map((level, index) => (
      <motion.span
        key={index}
        className="w-[3px] shrink-0 rounded-full bg-primary/70"
        animate={{ height: barHeight(level) }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
      />
    ))}
  </div>
);

const StaticWaveform = ({ peaks, progress }: { peaks: number[]; progress: number }) => (
  <div className="flex h-9 flex-1 min-w-0 items-center gap-[3px] overflow-hidden">
    {peaks.map((peak, index) => {
      const played = peaks.length > 0 && index / peaks.length < progress;
      return (
        <span
          key={index}
          className={cn('w-[3px] shrink-0 rounded-full transition-colors', played ? 'bg-primary' : 'bg-muted-foreground/30')}
          style={{ height: barHeight(peak) }}
        />
      );
    })}
  </div>
);

interface VoiceRecorderBarProps {
  status: 'recording' | 'preview';
  recordingTime: number;
  levels: number[];
  previewUrl: string | null;
  previewDuration: number;
  waveformPeaks: number[];
  onCancel: () => void;
  onStop: () => void;
  onSend: () => void;
  isSending?: boolean;
  className?: string;
}

/**
 * Shared recording/preview bar used by both the Lead Conversation composer and the
 * Teams Chat message input, so the voice message experience is identical everywhere.
 */
const VoiceRecorderBar = ({
  status,
  recordingTime,
  levels,
  previewUrl,
  previewDuration,
  waveformPeaks,
  onCancel,
  onStop,
  onSend,
  isSending = false,
  className,
}: VoiceRecorderBarProps) => {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (status !== 'preview') {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [status]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play();
    }
  };

  const progress = previewDuration > 0 ? Math.min(1, currentTime / previewDuration) : 0;
  const displayTime = status === 'recording' ? recordingTime : isPlaying ? currentTime : previewDuration;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('flex items-center gap-2 px-3 py-2', className)}
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('chat.recorder.cancel')}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {status === 'recording' ? (
        <>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
          <LiveWaveform levels={levels} />
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? t('chat.recorder.pause') : t('chat.recorder.play')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <StaticWaveform peaks={waveformPeaks} progress={progress} />
          {previewUrl && (
            <audio
              ref={audioRef}
              src={previewUrl}
              className="hidden"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            />
          )}
        </>
      )}

      <span className="min-w-[2.5rem] shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
        {formatDuration(displayTime)}
      </span>

      {status === 'recording' ? (
        <button
          type="button"
          onClick={onStop}
          aria-label={t('chat.recorder.stop')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={isSending}
          aria-label={t('chat.recorder.send')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      )}
    </motion.div>
  );
};

export default VoiceRecorderBar;
