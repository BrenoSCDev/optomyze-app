/**
 * CUSTOM AUDIO PLAYER COMPONENT
 * 
 * WhatsApp-styled audio player for voice messages
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  src: string;
  isOutgoing?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isOutgoing = false }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[200px] sm:min-w-[240px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Microphone icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        isOutgoing ? "bg-green-600" : "bg-muted"
      )}>
        <Mic className={cn(
          "h-5 w-5",
          isOutgoing ? "text-white" : "text-muted-foreground"
        )} />
      </div>

      {/* Play/Pause button */}
      <button
        onClick={togglePlayPause}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isOutgoing 
            ? "bg-green-600 hover:bg-green-700 text-white" 
            : "bg-muted hover:bg-muted/80 text-foreground"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      {/* Time and progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className={cn(
          "text-xs font-medium",
          isOutgoing ? "text-green-100" : "text-muted-foreground"
        )}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className={cn(
            "w-full h-1",
            isOutgoing ? "[&_[role=slider]]:bg-white [&_.bg-primary]:bg-white/80" : ""
          )}
        />
      </div>

      {/* Volume icon */}
      <Volume2 className={cn(
        "h-4 w-4 shrink-0",
        isOutgoing ? "text-green-100" : "text-muted-foreground"
      )} />
    </div>
  );
};

export default AudioPlayer;
