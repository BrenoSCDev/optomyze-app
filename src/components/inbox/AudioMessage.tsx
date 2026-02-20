import React, { useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessagePlayerProps {
  duration: string;
  isOwn: boolean;
}

const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({ duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState('0:00');

  // Parse duration string "M:SS" to seconds
  const parseDuration = (d: string): number => {
    const parts = d.split(':');
    if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return 0;
  };

  const totalSeconds = parseDuration(duration);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    setIsPlaying(p => !p);
    if (!isPlaying) {
      let prog = progress;
      const interval = setInterval(() => {
        prog += 2;
        setProgress(prog);
        setElapsed(formatTime((prog / 100) * totalSeconds));
        if (prog >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          setProgress(0);
          setElapsed('0:00');
        }
      }, (totalSeconds * 10) || 80);
    }
  };

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

      {/* Progress bar */}
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
