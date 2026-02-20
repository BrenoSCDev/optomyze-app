import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessagePlayerProps {
  src?: string;
  duration: string;
  isOwn: boolean;
}

const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({ src, duration, isOwn }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState('0:00');

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setElapsed(formatTime(audio.currentTime));
      }
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setElapsed('0:00');
    });

    return () => { audio.pause(); audio.src = ''; };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <div className={`flex items-center gap-2.5 min-w-[200px] rounded-full px-3 py-2
      ${isOwn ? 'bg-primary-foreground/10' : 'bg-muted/60'}`}
    >
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
          ${isOwn
            ? 'text-primary-foreground hover:bg-primary-foreground/15'
            : 'text-foreground hover:bg-muted-foreground/15'
          }`}
      >
        {isPlaying
          ? <Pause className="w-4 h-4" />
          : <Play className="w-4 h-4 ml-0.5" />
        }
      </button>

      <span className={`text-xs font-mono tabular-nums whitespace-nowrap
        ${isOwn ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
      >
        {elapsed} / {duration}
      </span>

      <div className={`flex-1 h-1 rounded-full overflow-hidden min-w-[40px]
        ${isOwn ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-100
            ${isOwn ? 'bg-primary-foreground' : 'bg-foreground'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <Volume2 className={`w-4 h-4 shrink-0
        ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
      />
    </div>
  );
};

export default AudioMessagePlayer;
