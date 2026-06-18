import type { ElementType } from 'react';
import {
  UserPlus,
  Workflow,
  ArrowRightLeft,
  Ban,
  Handshake,
  Trophy,
  XCircle,
  Pencil,
  Trash2,
  UserCog,
  UserMinus,
  Tag,
  PackagePlus,
  PackageMinus,
  StickyNote,
  MessageSquare,
  Plug,
  RefreshCw,
  ListTodo,
  CheckCircle2,
  CalendarPlus,
  CalendarClock,
  CalendarCheck2,
  Eye,
  Paperclip,
  Activity,
} from 'lucide-react';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import type { ActivityDateRangeValue, ActivityDomain, ActivityEvent, ActivityFilterGroup, ActivityFilterValue } from './types';

export interface ActivityRegistryEntry {
  domain?: ActivityDomain;
  type?: string | string[];
  action?: string | string[];
  source?: string;
  /** Extra predicate for cases plain field matching can't express (e.g. funnel vs. stage moves). */
  match?: (event: ActivityEvent) => boolean;
  icon: ElementType;
  iconColor: string;
  badgeColor: string;
  titleKey: string;
  group: ActivityFilterGroup;
}

const matchesField = (value: string | string[] | undefined, actual: string): boolean => {
  if (!value) return true;
  return Array.isArray(value) ? value.includes(actual) : value === actual;
};

/**
 * Ordered, first-match-wins event catalog. Live entries (backed by data the
 * backend currently produces) come first; future entries have registry rows
 * ready ahead of any backend instrumentation, so wiring them up later is a
 * one-line addition with no UI changes. The final catch-all always matches.
 */
export const ACTIVITY_REGISTRY: ActivityRegistryEntry[] = [
  // Lead events (live)
  {
    domain: 'lead',
    type: 'creation',
    action: 'created',
    icon: UserPlus,
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/15',
    titleKey: 'activity.title.lead-created',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'stage_change',
    match: (event) => /funnel/i.test(event.description),
    icon: Workflow,
    iconColor: 'text-violet-500',
    badgeColor: 'bg-violet-500/15',
    titleKey: 'activity.title.funnel-changed',
    group: 'stage_changes',
  },
  {
    domain: 'lead',
    type: 'stage_change',
    action: 'moved',
    icon: ArrowRightLeft,
    iconColor: 'text-amber-500',
    badgeColor: 'bg-amber-500/15',
    titleKey: 'activity.title.stage-changed',
    group: 'stage_changes',
  },
  {
    domain: 'lead',
    type: 'lost',
    action: 'lost',
    icon: Ban,
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-500/15',
    titleKey: 'activity.title.lead-lost',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'task',
    action: 'created',
    icon: ListTodo,
    iconColor: 'text-indigo-500',
    badgeColor: 'bg-indigo-500/15',
    titleKey: 'activity.title.task-created',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'task',
    action: 'completed',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/15',
    titleKey: 'activity.title.task-completed',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'task',
    action: 'updated',
    icon: Pencil,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/15',
    titleKey: 'activity.title.task-updated',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'appointment',
    action: 'created',
    icon: CalendarPlus,
    iconColor: 'text-violet-500',
    badgeColor: 'bg-violet-500/15',
    titleKey: 'activity.title.appointment-created',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'appointment',
    action: 'completed',
    icon: CalendarCheck2,
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/15',
    titleKey: 'activity.title.appointment-completed',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'appointment',
    action: 'updated',
    icon: CalendarClock,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/15',
    titleKey: 'activity.title.appointment-updated',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'observation',
    action: 'created',
    icon: Eye,
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-500/15',
    titleKey: 'activity.title.observation-created',
    group: 'notes',
  },
  {
    type: 'document',
    action: 'added',
    icon: Paperclip,
    iconColor: 'text-cyan-500',
    badgeColor: 'bg-cyan-500/15',
    titleKey: 'activity.title.document-added',
    group: 'lead_events',
  },
  {
    domain: 'lead',
    type: 'whatsapp_chat',
    action: 'chat_started',
    icon: FaWhatsapp,
    iconColor: 'text-green-500',
    badgeColor: 'bg-green-500/15',
    titleKey: 'activity.title.message-received',
    group: 'messages',
  },
  {
    domain: 'lead',
    type: 'instagram_chat',
    action: 'chat_started',
    icon: FaInstagram,
    iconColor: 'text-pink-500',
    badgeColor: 'bg-pink-500/15',
    titleKey: 'activity.title.message-received',
    group: 'messages',
  },

  // Deal events (live)
  {
    domain: 'deal',
    type: 'creation',
    action: 'created',
    icon: Handshake,
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/15',
    titleKey: 'activity.title.deal-created',
    group: 'deal_events',
  },
  {
    domain: 'deal',
    type: ['stage_change', 'status_change'],
    action: ['won', 'closed'],
    icon: Trophy,
    iconColor: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/15',
    titleKey: 'activity.title.deal-won',
    group: 'deal_events',
  },
  {
    domain: 'deal',
    type: ['stage_change', 'status_change'],
    action: 'lost',
    icon: XCircle,
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-500/15',
    titleKey: 'activity.title.deal-lost',
    group: 'deal_events',
  },
  {
    domain: 'deal',
    type: 'stage_change',
    action: 'moved',
    icon: ArrowRightLeft,
    iconColor: 'text-amber-500',
    badgeColor: 'bg-amber-500/15',
    titleKey: 'activity.title.stage-changed',
    group: 'stage_changes',
  },
  {
    domain: 'deal',
    type: 'update',
    action: 'updated',
    icon: Pencil,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/15',
    titleKey: 'activity.title.deal-updated',
    group: 'deal_events',
  },
  {
    domain: 'deal',
    type: 'deletion',
    action: 'deleted',
    icon: Trash2,
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-500/15',
    titleKey: 'activity.title.deal-deleted',
    group: 'system_events',
  },

  // Future event types — registry rows ready, no backend data yet.
  {
    domain: 'lead',
    type: 'update',
    icon: Pencil,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/15',
    titleKey: 'activity.title.lead-updated',
    group: 'lead_events',
  },
  {
    type: 'assignment',
    action: 'unassigned',
    icon: UserMinus,
    iconColor: 'text-slate-500',
    badgeColor: 'bg-slate-500/15',
    titleKey: 'activity.title.assigned-user-removed',
    group: 'assignments',
  },
  {
    type: 'assignment',
    icon: UserCog,
    iconColor: 'text-indigo-500',
    badgeColor: 'bg-indigo-500/15',
    titleKey: 'activity.title.assigned-user-changed',
    group: 'assignments',
  },
  {
    type: 'tag_change',
    action: 'added',
    icon: Tag,
    iconColor: 'text-teal-500',
    badgeColor: 'bg-teal-500/15',
    titleKey: 'activity.title.tag-added',
    group: 'lead_events',
  },
  {
    type: 'tag_change',
    action: 'removed',
    icon: Tag,
    iconColor: 'text-slate-500',
    badgeColor: 'bg-slate-500/15',
    titleKey: 'activity.title.tag-removed',
    group: 'lead_events',
  },
  {
    type: 'product_change',
    action: 'removed',
    icon: PackageMinus,
    iconColor: 'text-slate-500',
    badgeColor: 'bg-slate-500/15',
    titleKey: 'activity.title.product-removed',
    group: 'products',
  },
  {
    type: ['product_change', 'product_update'],
    icon: PackagePlus,
    iconColor: 'text-cyan-500',
    badgeColor: 'bg-cyan-500/15',
    titleKey: 'activity.title.product-added',
    group: 'products',
  },
  {
    type: 'note',
    action: 'noted',
    icon: StickyNote,
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-500/15',
    titleKey: 'activity.title.note-created',
    group: 'notes',
  },
  {
    type: 'message',
    action: 'received',
    icon: MessageSquare,
    iconColor: 'text-green-500',
    badgeColor: 'bg-green-500/15',
    titleKey: 'activity.title.message-received',
    group: 'messages',
  },
  {
    type: 'message',
    action: 'sent',
    icon: MessageSquare,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/15',
    titleKey: 'activity.title.message-sent',
    group: 'messages',
  },
  {
    type: 'integration',
    icon: Plug,
    iconColor: 'text-purple-500',
    badgeColor: 'bg-purple-500/15',
    titleKey: 'activity.title.integration-event',
    group: 'integrations',
  },
  {
    type: 'status_change',
    icon: RefreshCw,
    iconColor: 'text-slate-500',
    badgeColor: 'bg-slate-500/15',
    titleKey: 'activity.title.status-changed',
    group: 'system_events',
  },

  // Catch-all — always matches, must remain last.
  {
    icon: Activity,
    iconColor: 'text-muted-foreground',
    badgeColor: 'bg-muted',
    titleKey: 'activity.title.system-event',
    group: 'system_events',
  },
];

export const resolveActivityRegistryEntry = (event: ActivityEvent): ActivityRegistryEntry => {
  for (const entry of ACTIVITY_REGISTRY) {
    if (entry.domain && entry.domain !== event.domain) continue;
    if (!matchesField(entry.type, event.type)) continue;
    if (!matchesField(entry.action, event.action)) continue;
    if (entry.source && entry.source !== event.source) continue;
    if (entry.match && !entry.match(event)) continue;
    return entry;
  }
  return ACTIVITY_REGISTRY[ACTIVITY_REGISTRY.length - 1];
};

export const ACTIVITY_FILTER_GROUPS: { value: ActivityFilterValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'activity.filter.group.all' },
  { value: 'lead_events', labelKey: 'activity.filter.group.lead-events' },
  { value: 'deal_events', labelKey: 'activity.filter.group.deal-events' },
  { value: 'stage_changes', labelKey: 'activity.filter.group.stage-changes' },
  { value: 'assignments', labelKey: 'activity.filter.group.assignments' },
  { value: 'messages', labelKey: 'activity.filter.group.messages' },
  { value: 'notes', labelKey: 'activity.filter.group.notes' },
  { value: 'products', labelKey: 'activity.filter.group.products' },
  { value: 'integrations', labelKey: 'activity.filter.group.integrations' },
  { value: 'system_events', labelKey: 'activity.filter.group.system-events' },
];

export const ACTIVITY_DATE_RANGE_OPTIONS: { value: ActivityDateRangeValue; labelKey: string }[] = [
  { value: 'today', labelKey: 'activity.filter.range.today' },
  { value: 'yesterday', labelKey: 'activity.filter.range.yesterday' },
  { value: '7_days', labelKey: 'activity.filter.range.7-days' },
  { value: '30_days', labelKey: 'activity.filter.range.30-days' },
  { value: 'custom', labelKey: 'activity.filter.range.custom' },
];
