import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'preview';

const LEVEL_BAR_COUNT = 32;
const PREVIEW_BAR_COUNT = 40;
const LEVEL_BOOST = 1.6;

const EMPTY_LEVELS = () => Array.from({ length: LEVEL_BAR_COUNT }, () => 0);

interface WaveformResult {
  peaks: number[];
  duration: number;
}

/** Decodes a recorded blob into normalized peak values for the static (post-recording) waveform. */
const buildWaveformPeaks = async (blob: Blob, barCount: number): Promise<WaveformResult> => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / barCount));

    const peaks: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const value = Math.abs(channelData[start + j] ?? 0);
        if (value > max) max = value;
      }
      peaks.push(max);
    }

    const maxPeak = Math.max(...peaks, 0.01);
    const normalized = peaks.map((p) => Math.max(0.08, p / maxPeak));
    void audioContext.close();
    return { peaks: normalized, duration: audioBuffer.duration };
  } catch {
    return { peaks: Array.from({ length: barCount }, () => 0.3), duration: 0 };
  }
};

export interface UseAudioRecorderResult {
  status: RecorderStatus;
  /** Elapsed recording time in seconds, ticking while `status === 'recording'`. */
  recordingTime: number;
  /** Rolling window of normalized (0-1) mic input levels for the live waveform. */
  levels: number[];
  /** Object URL for the recorded clip, available while `status === 'preview'`. */
  previewUrl: string | null;
  /** Duration in seconds of the recorded clip. */
  previewDuration: number;
  /** Normalized (0-1) peaks for the static preview waveform. */
  waveformPeaks: number[];
  /** Requests mic access and starts recording. Returns false if permission was denied. */
  start: () => Promise<boolean>;
  /** Stops recording and transitions to the preview state. */
  stop: () => void;
  /** Discards the recording (in-progress or preview) and returns to idle. */
  cancel: () => void;
  /** Clears any preview state and returns to idle. */
  reset: () => void;
  /** Returns the recorded clip as a File, or null if none is available. */
  getFile: () => File | null;
}

export const useAudioRecorder = (): UseAudioRecorderResult => {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [levels, setLevels] = useState<number[]>(EMPTY_LEVELS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const blobRef = useRef<Blob | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopVisualizer();
    stopTimer();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
  }, [stopStream, stopTimer, stopVisualizer]);

  const visualize = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;

    const tick = () => {
      frame += 1;
      if (frame % 2 === 0) {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
        const level = Math.min(1, (avg / 255) * LEVEL_BOOST);
        setLevels((prev) => [...prev.slice(1), level]);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    blobRef.current = null;
    setPreviewUrl(null);
    setPreviewDuration(0);
    setWaveformPeaks([]);
    setRecordingTime(0);
    setLevels(EMPTY_LEVELS());
    setStatus('idle');
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stopVisualizer();
        stopTimer();
        stopStream();

        if (cancelledRef.current) {
          chunksRef.current = [];
          return;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        blobRef.current = blob;

        const { peaks, duration } = await buildWaveformPeaks(blob, PREVIEW_BAR_COUNT);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;

        setWaveformPeaks(peaks);
        setPreviewDuration(duration);
        setPreviewUrl(url);
        setStatus('preview');
      };

      recorderRef.current = recorder;
      recorder.start();

      setLevels(EMPTY_LEVELS());
      setRecordingTime(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      visualize();
      setStatus('recording');
      return true;
    } catch {
      cleanup();
      return false;
    }
  }, [cleanup, stopStream, stopTimer, stopVisualizer, visualize]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      cancelledRef.current = false;
      recorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      cancelledRef.current = true;
      recorderRef.current.stop();
    } else {
      cleanup();
    }
    reset();
  }, [cleanup, reset]);

  const getFile = useCallback((): File | null => {
    if (!blobRef.current) return null;
    return new File([blobRef.current], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [cleanup]);

  return {
    status,
    recordingTime,
    levels,
    previewUrl,
    previewDuration,
    waveformPeaks,
    start,
    stop,
    cancel,
    reset,
    getFile,
  };
};
