/**
 * LEAD AVATARS
 *
 * Illustrated faces shown for contacts that have no photo of their own.
 *
 * Contacts without a picture used to render as initials, which meant a funnel
 * board was a wall of identical grey circles — nothing to recognise a contact
 * by while scanning. Each contact carries an `avatar_key` assigned when it was
 * created, so its face is stable everywhere it appears and across sessions.
 *
 * The backend only ever stores the key (see Lead::AVATAR_KEYS); the images
 * live here. An unknown key resolves to null and the caller falls back to
 * initials, so the backend can add a key before the image ships without
 * breaking anything.
 */

import happyBlue from '@/assets/avatar-happy-blue.jpeg';
import happyPurple from '@/assets/avatar-happy-purple.jpeg';
import shyOrange from '@/assets/avatar-shy-orange.jpeg';
import shyPink from '@/assets/avatar-shy-pink.jpeg';
import suspiciousGreen from '@/assets/avatar-suspicious-green.jpeg';
import suspiciousRed from '@/assets/avatar-suspicious-red.jpeg';

export const LEAD_AVATARS: Record<string, string> = {
  'happy-blue': happyBlue,
  'happy-purple': happyPurple,
  'shy-orange': shyOrange,
  'shy-pink': shyPink,
  'suspicious-green': suspiciousGreen,
  'suspicious-red': suspiciousRed,
};

/** The face for a contact's key, or null when there isn't one to show. */
export const leadAvatarSrc = (avatarKey?: string | null): string | null =>
  (avatarKey && LEAD_AVATARS[avatarKey]) || null;
