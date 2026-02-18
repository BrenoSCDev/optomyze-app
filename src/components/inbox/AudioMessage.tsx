import React, { useState } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface AudioMessagePlayerProps {
  duration: string;
  isOwn: boolean;
}

const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({ duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    setIsPlaying(p => !p);
    // Mock progress animation
    if (!isPlaying) {
      let prog = progress;
      const interval = setInterval(() => {
        prog += 2;
        setProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          setProgress(0);
        }
      }, 80);
    }
  };

  const bars = Array.from({ length: 24 }, (_, i) => {
    const heights = [3, 5, 8, 12, 7, 10, 14, 9, 6, 11, 8, 13, 5, 10, 7, 12, 9, 6, 14, 8, 11, 5, 9, 4];
    return heights[i] ?? 6;
  });

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors
          ${isOwn
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground'
            : 'bg-primary/15 hover:bg-primary/25 text-primary'
          }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] flex-1">
        {bars.map((h, i) => {
          const pct = (i / bars.length) * 100;
          const isActive = pct <= progress;
          return (
            <div
              key={i}
              className={`rounded-full transition-colors duration-100
                ${isOwn
                  ? isActive ? 'bg-primary-foreground' : 'bg-primary-foreground/40'
                  : isActive ? 'bg-primary' : 'bg-muted-foreground/40'
                }`}
              style={{ width: 2, height: h }}
            />
          );
        })}
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <Mic className={`w-3 h-3 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`} />
        <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {duration}
        </span>
      </div>
    </div>
  );
};

export default AudioMessagePlayer;
