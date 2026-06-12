import type { ActivityTransaction } from '@/services/leadActivityApi';
import type { DealActivityTransaction } from '@/services/dealActivityApi';
import type { LeadTransactionNotification, DealTransactionNotification } from '@/contexts/NotificationContext';

export type ActivityDomain = 'lead' | 'deal';

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
 * `leadData.transactions` (LeadPreviewModal) lacks the nested `lead` object —
 * relax it to optional so the same adapter works for both the activity page
 * and the modal's compact timeline.
 */
type LeadTransactionLike = Omit<ActivityTransaction, 'lead'> & {
  lead?: ActivityTransaction['lead'];
};

export const adaptLeadTransaction = (tx: LeadTransactionLike): ActivityEvent => ({
  id: `lead-${tx.id}`,
  domain: 'lead',
  type: tx.type,
  action: tx.action,
  source: tx.source,
  description: tx.description,
  createdAt: tx.created_at,
  actor: resolveActor(tx.user, tx.source),
  subject: {
    leadName: tx.lead ? `${tx.lead.first_name} ${tx.lead.last_name}`.trim() : null,
  },
});

/**
 * `sale.transactions` (DealPreviewModal) lacks the nested `sale` object —
 * relax it to optional, same reasoning as `LeadTransactionLike` above.
 */
type DealTransactionLike = Omit<DealActivityTransaction, 'sale'> & {
  sale?: DealActivityTransaction['sale'];
};

export const adaptDealTransaction = (tx: DealTransactionLike): ActivityEvent => ({
  id: `deal-${tx.id}`,
  domain: 'deal',
  type: tx.type,
  action: tx.action,
  source: tx.source,
  description: tx.description,
  createdAt: tx.created_at,
  actor: resolveActor(tx.user, tx.source),
  subject: {
    dealName: tx.sale?.name ?? null,
    leadName: tx.sale?.lead ? `${tx.sale.lead.first_name} ${tx.sale.lead.last_name}`.trim() : null,
  },
});

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
