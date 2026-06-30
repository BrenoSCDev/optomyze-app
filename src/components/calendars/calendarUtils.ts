/**
 * CALENDAR UTILITIES
 *
 * Shared types, color/icon configs, and formatting helpers used across
 * the calendar grid, event chips, agenda cards, and previews.
 */

import { format } from 'date-fns';
import {
  Phone, Users, Building2, AlertTriangle, Bell, CircleDot,
  FileEdit, CalendarCheck2, CheckCircle2, XCircle, UserX,
  ArrowUp, Minus, ArrowDown, Clock,
  type LucideIcon,
} from 'lucide-react';
import type { CalendarEvent } from '@/services/calendarApi';

// Unified calendar item type used by the grid, agenda panel, and dialogs
export interface CalendarItem {
  id: string;
  originalId: number;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  type: 'task' | 'event' | 'appointment';
  subType: string;
  allDay?: boolean;
  priority?: string;
  status?: string;
  attendee?: string;
  location?: string;
  hasReminder: boolean;
  leadName?: string;
  leadId?: number;
  funnelId?: number;
  originalEvent?: CalendarEvent;
  // Appointments
  appointmentTypeColor?: string;
  timezone?: string;
}

// ---- Color maps (soft, translucent badges consistent with the rest of the app) ----

export const eventTypeColors: Record<string, string> = {
  call: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/50',
  meeting: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/50',
  internal: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/50',
  deadline: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/50',
  reminder: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
  other: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/50',
};

export const taskPriorityColors: Record<string, string> = {
  urgent: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/50',
  high: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/50',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
  low: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/50',
};

export const taskStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
  in_progress: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/50',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/50',
  cancelled: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/50',
};

export const appointmentStatusColors: Record<string, string> = {
  draft: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/50',
  scheduled: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/50',
  completed: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/50',
  cancelled: 'bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/50',
  no_show: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/50',
};

// Solid dot colors used for the day-density indicator and chip accent bars
export const densityDotColors = {
  appointment: { draft: '#f59e0b', scheduled: '#14b8a6', completed: '#22c55e', cancelled: '#6b7280', no_show: '#ef4444' },
  taskPriority: { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' },
  eventType: { call: '#3b82f6', meeting: '#a855f7', internal: '#22c55e', deadline: '#ef4444', reminder: '#eab308', other: '#6b7280' },
};

export type StatusBadgeKind = 'appointment-status' | 'task-priority' | 'task-status' | 'event-type';

export interface StatusConfig {
  label: string;
  classes: string;
  Icon: LucideIcon;
  translationKey?: string;
}

const appointmentStatusConfig: Record<string, StatusConfig> = {
  draft: { label: 'Draft', classes: appointmentStatusColors.draft, Icon: FileEdit, translationKey: 'appointments.status-draft' },
  scheduled: { label: 'Scheduled', classes: appointmentStatusColors.scheduled, Icon: CalendarCheck2, translationKey: 'appointments.status-scheduled' },
  completed: { label: 'Completed', classes: appointmentStatusColors.completed, Icon: CheckCircle2, translationKey: 'appointments.status-completed' },
  cancelled: { label: 'Cancelled', classes: appointmentStatusColors.cancelled, Icon: XCircle, translationKey: 'appointments.status-cancelled' },
  no_show: { label: 'No Show', classes: appointmentStatusColors.no_show, Icon: UserX, translationKey: 'appointments.status-no-show' },
};

const taskPriorityConfig: Record<string, StatusConfig> = {
  urgent: { label: 'Urgent', classes: taskPriorityColors.urgent, Icon: AlertTriangle },
  high: { label: 'High', classes: taskPriorityColors.high, Icon: ArrowUp },
  medium: { label: 'Medium', classes: taskPriorityColors.medium, Icon: Minus },
  low: { label: 'Low', classes: taskPriorityColors.low, Icon: ArrowDown },
};

const taskStatusConfig: Record<string, StatusConfig> = {
  pending: { label: 'Pending', classes: taskStatusColors.pending, Icon: Clock },
  in_progress: { label: 'In Progress', classes: taskStatusColors.in_progress, Icon: CircleDot },
  completed: { label: 'Completed', classes: taskStatusColors.completed, Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', classes: taskStatusColors.cancelled, Icon: XCircle },
};

const eventTypeConfig: Record<string, StatusConfig> = {
  call: { label: 'Call', classes: eventTypeColors.call, Icon: Phone },
  meeting: { label: 'Meeting', classes: eventTypeColors.meeting, Icon: Users },
  internal: { label: 'Internal', classes: eventTypeColors.internal, Icon: Building2 },
  deadline: { label: 'Deadline', classes: eventTypeColors.deadline, Icon: AlertTriangle },
  reminder: { label: 'Reminder', classes: eventTypeColors.reminder, Icon: Bell },
  other: { label: 'Other', classes: eventTypeColors.other, Icon: CircleDot },
};

const configMaps: Record<StatusBadgeKind, Record<string, StatusConfig>> = {
  'appointment-status': appointmentStatusConfig,
  'task-priority': taskPriorityConfig,
  'task-status': taskStatusConfig,
  'event-type': eventTypeConfig,
};

const fallbackKeyForKind: Record<StatusBadgeKind, string> = {
  'appointment-status': 'scheduled',
  'task-priority': 'medium',
  'task-status': 'pending',
  'event-type': 'other',
};

export function getStatusConfig(kind: StatusBadgeKind, value: string | null | undefined): StatusConfig {
  const map = configMaps[kind];
  const key = value && map[value] ? value : fallbackKeyForKind[kind];
  return map[key];
}

// Get badge color classes for an item based on its type (used for accents/fallback styling)
export function getItemColor(item: CalendarItem): string {
  if (item.type === 'task') return taskPriorityColors[item.priority || 'medium'] || taskPriorityColors.medium;
  if (item.type === 'appointment') return appointmentStatusColors[item.subType] || appointmentStatusColors.scheduled;
  return eventTypeColors[item.subType] || eventTypeColors.other;
}

// Solid accent color for an item, used for left border bars and density dots
export function getAccentColor(item: CalendarItem): string {
  if (item.type === 'appointment') {
    return item.appointmentTypeColor || densityDotColors.appointment[item.status as keyof typeof densityDotColors.appointment] || densityDotColors.appointment.scheduled;
  }
  if (item.type === 'task') {
    return densityDotColors.taskPriority[item.priority as keyof typeof densityDotColors.taskPriority] || densityDotColors.taskPriority.medium;
  }
  return densityDotColors.eventType[item.subType as keyof typeof densityDotColors.eventType] || densityDotColors.eventType.other;
}

export function formatSubType(subType: string | null | undefined): string {
  return (subType || 'scheduled').replace('_', ' ');
}

export function formatTime(date: Date, allDay?: boolean): string {
  if (allDay) return 'All day';
  return format(date, 'HH:mm');
}

// Human-readable duration between two dates, e.g. "30 min" or "1h 30min"
export function formatDuration(start: Date, end?: Date | null): string | null {
  if (!end) return null;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}min`;
}

// ---- Avatar helpers (deterministic color from id/name, no backend changes needed) ----

const AVATAR_PALETTE = [
  'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  'bg-teal-500/20 text-teal-700 dark:text-teal-300',
  'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  'bg-pink-500/20 text-pink-700 dark:text-pink-300',
  'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/20 text-amber-700 dark:text-amber-300',
];

export function getAvatarColorClass(id?: number | null, name?: string | null): string {
  let seed = id ?? 0;
  if (!seed && name) {
    for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(seed) % AVATAR_PALETTE.length];
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
