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
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalDuration, setTotalDuration] = useState(duration);

  const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(formatTime(audio.duration));
      }
    });
    audio.addEventListener('timeupdate', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(formatTime(audio.currentTime));
      }
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('0:00');
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
    <div className="flex items-center gap-2 min-w-[220px]">
      <button
        onClick={togglePlay}
        className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-full transition-colors
          ${isOwn
            ? 'text-primary-foreground/90 hover:text-primary-foreground'
            : 'text-foreground/80 hover:text-foreground'
          }`}
      >
        {isPlaying
          ? <Pause className="w-4 h-4" fill="currentColor" />
          : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        }
      </button>

      <span className={`text-[11px] font-mono tabular-nums whitespace-nowrap select-none
        ${isOwn ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}
      >
        {currentTime} / {totalDuration}
      </span>

      {/* Progress bar */}
      <div className={`flex-1 h-[3px] rounded-full overflow-hidden min-w-[50px]
        ${isOwn ? 'bg-primary-foreground/25' : 'bg-muted-foreground/25'}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-linear
            ${isOwn ? 'bg-primary-foreground/80' : 'bg-foreground/70'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <Volume2 className={`w-4 h-4 shrink-0
        ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}
      />
    </div>
  );
};

export default AudioMessagePlayer;
