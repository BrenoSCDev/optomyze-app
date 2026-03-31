/**
 * NOTIFICATION SOUNDS
 *
 * Provides multiple notification sound options.
 * - "default" uses the existing /sounds/notification.mp3
 * - Others are synthesized via Web Audio API for zero-dependency tones.
 * - "none" plays nothing.
 *
 * Preference is persisted in localStorage under "optomyze_notification_sound".
 */

export type NotificationSoundId = 'default' | 'soft-bell' | 'digital-pop' | 'subtle-ping' | 'bright-chime' | 'none';

export interface NotificationSoundOption {
  id: NotificationSoundId;
  label: string;
  description: string;
}

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  { id: 'default', label: 'Default Chime', description: 'Classic notification tone' },
  { id: 'soft-bell', label: 'Soft Bell', description: 'Gentle bell sound' },
  { id: 'digital-pop', label: 'Digital Pop', description: 'Quick digital alert' },
  { id: 'subtle-ping', label: 'Subtle Ping', description: 'Minimal ping' },
  { id: 'bright-chime', label: 'Bright Chime', description: 'Upbeat two-tone chime' },
  { id: 'none', label: 'No Sound', description: 'Mute notifications' },
];

const LS_KEY = 'optomyze_notification_sound';

export function getSelectedSound(): NotificationSoundId {
  const stored = localStorage.getItem(LS_KEY);
  if (stored && NOTIFICATION_SOUNDS.some(s => s.id === stored)) {
    return stored as NotificationSoundId;
  }
  return 'default';
}

export function setSelectedSound(id: NotificationSoundId): void {
  localStorage.setItem(LS_KEY, id);
}

// ─── Audio context helpers ──────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, delay = 0): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// ─── Synthesized sounds ─────────────────────────────────────────────────────

function playSoftBell(): void {
  playTone(830, 0.6, 'sine', 0.25);
  playTone(1100, 0.4, 'sine', 0.15, 0.15);
}

function playDigitalPop(): void {
  playTone(600, 0.08, 'square', 0.15);
  playTone(900, 0.12, 'square', 0.2, 0.06);
  playTone(1200, 0.15, 'sine', 0.15, 0.12);
}

function playSubtlePing(): void {
  playTone(1400, 0.25, 'sine', 0.2);
}

function playBrightChime(): void {
  playTone(784, 0.3, 'sine', 0.25);
  playTone(1047, 0.4, 'sine', 0.2, 0.15);
  playTone(1319, 0.35, 'sine', 0.15, 0.3);
}

function playDefaultSound(): void {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => console.log('🔔 Could not play notification sound:', err));
  } catch (err) {
    console.log('🔔 Error creating audio:', err);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

const SOUND_PLAYERS: Record<NotificationSoundId, () => void> = {
  'default': playDefaultSound,
  'soft-bell': playSoftBell,
  'digital-pop': playDigitalPop,
  'subtle-ping': playSubtlePing,
  'bright-chime': playBrightChime,
  'none': () => {},
};

/** Play a specific sound by ID (for previewing) */
export function previewSound(id: NotificationSoundId): void {
  SOUND_PLAYERS[id]?.();
}

/** Play the user's selected notification sound */
export function playNotificationSound(): void {
  const id = getSelectedSound();
  SOUND_PLAYERS[id]?.();
}
