import type { RecordItem, RecordLead, RecordSale } from '@/services/recordsApi';
import type { LeadTransactionNotification, DealTransactionNotification } from '@/contexts/NotificationContext';

export type ActivityDomain = 'lead' | 'deal';

/** Domain filter accepted by `useActivityFeed` — 'all' merges both into a single feed. */
export type ActivityFeedDomain = ActivityDomain | 'all';

/** Sentinel actor names used when no user performed the action. */
export const SYSTEM_ACTOR = '__SYSTEM__';
export const AUTOMATION_ACTOR = '__AUTOMATION__';

export interface ActivityActor {
  id: number | null;
  /** Resolved user name, or one of the sentinel constants above. */
  name: string;
  isSystem: boolean;
}

export interface ActivitySubject {
  leadName?: string | null;
  dealName?: string | null;
}

export interface ActivityEvent {
  id: string;
  domain: ActivityDomain;
  type: string;
  action: string;
  source: string;
  description: string;
  createdAt: string;
  actor: ActivityActor;
  subject: ActivitySubject;
}

export interface ActivityMeta {
  total: number;
  returned: number;
  truncated: boolean;
}

export type ActivityDateRangeValue = 'today' | 'yesterday' | '7_days' | '30_days' | 'custom';

export interface ActivityQueryParams {
  date_range?: ActivityDateRangeValue;
  date_from?: string;
  date_to?: string;
}

export type ActivityFilterGroup =
  | 'lead_events'
  | 'deal_events'
  | 'stage_changes'
  | 'assignments'
  | 'messages'
  | 'notes'
  | 'products'
  | 'integrations'
  | 'system_events';

export type ActivityFilterValue = 'all' | ActivityFilterGroup;

const resolveActor = (
  user: { id: number; name: string } | null | undefined,
  source: string
): ActivityActor =>
  user
    ? { id: user.id, name: user.name, isSystem: false }
    : { id: null, name: source === 'automation' ? AUTOMATION_ACTOR : SYSTEM_ACTOR, isSystem: true };

/**
 * Maps a polymorphic `Record` (Lead or Sale "recordable") into the
 * domain-agnostic `ActivityEvent` shape used by the registry/timeline.
 *
 * `record.recordable` may be absent (e.g. when records are eager-loaded
 * directly off the Lead/Sale they belong to, so the parent is implicit).
 */
export const adaptRecord = (record: RecordItem, domain: ActivityDomain): ActivityEvent => {
  const subject: ActivitySubject =
    domain === 'lead'
      ? {
          leadName: record.recordable
            ? `${(record.recordable as RecordLead).first_name} ${(record.recordable as RecordLead).last_name}`.trim()
            : null,
        }
      : {
          dealName: (record.recordable as RecordSale)?.name ?? null,
          leadName: (record.recordable as RecordSale)?.lead
            ? `${(record.recordable as RecordSale).lead!.first_name} ${(record.recordable as RecordSale).lead!.last_name}`.trim()
            : null,
        };

  return {
    id: `${domain}-${record.id}`,
    domain,
    type: record.type,
    action: record.action,
    source: record.source,
    description: record.description,
    createdAt: record.created_at,
    actor: resolveActor(record.user, record.source),
    subject,
  };
};

export const adaptLeadTransactionPayload = (
  payload: LeadTransactionNotification['transaction']
): ActivityEvent => ({
  id: `lead-${payload.id}`,
  domain: 'lead',
  type: payload.txType,
  action: payload.action,
  source: payload.source,
  description: payload.description,
  createdAt: payload.created_at,
  actor: resolveActor(payload.user, payload.source),
  subject: {
    leadName: payload.lead ? `${payload.lead.first_name} ${payload.lead.last_name}`.trim() : null,
  },
});

export const adaptDealTransactionPayload = (
  payload: DealTransactionNotification['transaction']
): ActivityEvent => ({
  id: `deal-${payload.id}`,
  domain: 'deal',
  type: payload.txType,
  action: payload.action,
  source: payload.source,
  description: payload.description,
  createdAt: payload.created_at,
  actor: resolveActor(payload.user, payload.source),
  subject: {
    dealName: payload.deal?.name ?? null,
    leadName: payload.deal?.lead ? `${payload.deal.lead.first_name} ${payload.deal.lead.last_name}`.trim() : null,
  },
});
