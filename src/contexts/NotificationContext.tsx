/**
 * NOTIFICATION CONTEXT
 * 
 * Manages real-time notifications for:
 * - Lead creation events
 * - Chat: new group created
 * - Chat: private message received
 * 
 * Subscribes to company-specific and user-specific WebSocket channels
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { getEcho } from '@/services/echo';
import { playNotificationSound } from '@/lib/notificationSounds';

// ─── Notification types ──────────────────────────────────────────────────────

export interface LeadNotification {
  id: string;
  type: 'lead_created';
  message: string;
  lead: {
    id: number;
    funnel_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  creator: {
    id: number;
    name: string;
    profile_pic?: string;
  };
  timestamp: string;
  read: boolean;
}

export interface ChatGroupNotification {
  id: string;
  type: 'group_created';
  message: string;
  groupName: string;
  creatorName: string;
  creatorPic: string | null;
  timestamp: string;
  read: boolean;
}

export interface ChatMessageNotification {
  id: string;
  type: 'private_message';
  message: string;
  conversationId: number;
  senderName: string;
  senderPic: string | null;
  preview: string;
  timestamp: string;
  read: boolean;
}

export interface LeadTransactionNotification {
  id: string;
  type: 'lead_transaction';
  message: string;
  transaction: {
    id: number;
    txType: string;
    action: string;
    description: string;
    source: string;
    is_important: boolean;
    lead: { id: number; first_name: string; last_name: string };
    user: { id: number; name: string; profile_pic_url?: string } | null;
    created_at: string;
  };
  timestamp: string;
  read: boolean;
}

export interface DealTransactionNotification {
  id: string;
  type: 'deal_transaction';
  message: string;
  transaction: {
    id: number;
    txType: string;
    action: string;
    description: string;
    source: string;
    deal: {
      id: number;
      name: string;
      total: number;
      status: string;
      lead: { id: number; first_name: string; last_name: string } | null;
    };
    user: { id: number; name: string; profile_pic_url?: string } | null;
    created_at: string;
  };
  timestamp: string;
  read: boolean;
}

export interface AppointmentNotification {
  id: string;
  type: 'appointment_scheduled';
  message: string;
  appointment: {
    id: number;
    title: string;
    scheduled_at: string;
    end_at?: string | null;
  };
  lead: { id: number; funnel_id: number; first_name: string; last_name: string } | null;
  assigned_user: { id: number; name: string } | null;
  actor: { id: number; name: string; profile_pic_url?: string | null } | null;
  timestamp: string;
  read: boolean;
}

/**
 * A contract (or proposal, quote, NDA) reached a milestone.
 *
 * `type` carries the server's event key rather than a single 'document' value,
 * because the four outcomes want different words and different urgency — a
 * refusal is not a signature with a minus sign.
 */
export interface DocumentNotification {
  id: string;
  type: 'document_signed' | 'document_rejected' | 'document_expired' | 'document_sent';
  message: string;
  priority: 'low' | 'normal' | 'high';
  document: {
    id: number;
    number: string;
    title: string;
    status: string;
    category: string | null;
    lead_id: number | null;
    sale_id: number | null;
    owner_id: number | null;
  };
  actor: { id: number; name: string } | null;
  timestamp: string;
  read: boolean;
}

export type AppNotification = LeadNotification | ChatGroupNotification | ChatMessageNotification | LeadTransactionNotification | DealTransactionNotification | AppointmentNotification | DocumentNotification;

// Global event emitter for lead transactions (used by activity dashboards)
type LeadTransactionListener = (payload: LeadTransactionNotification['transaction']) => void;
const leadTransactionListeners = new Set<LeadTransactionListener>();
export const onLeadTransaction = (listener: LeadTransactionListener) => {
  leadTransactionListeners.add(listener);
  return () => { leadTransactionListeners.delete(listener); };
};
const emitLeadTransaction = (payload: LeadTransactionNotification['transaction']) => {
  leadTransactionListeners.forEach(fn => fn(payload));
};

// Global event emitter for deal transactions (used by deal activity dashboard)
type DealTransactionListener = (payload: DealTransactionNotification['transaction']) => void;
const dealTransactionListeners = new Set<DealTransactionListener>();
export const onDealTransaction = (listener: DealTransactionListener) => {
  dealTransactionListeners.add(listener);
  return () => { dealTransactionListeners.delete(listener); };
};
const emitDealTransaction = (payload: DealTransactionNotification['transaction']) => {
  dealTransactionListeners.forEach(fn => fn(payload));
};

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Play notification sound — the chosen sound comes from user preferences
  const playSound = useCallback(() => {
    playNotificationSound();
  }, []);

  // Use refs to store latest callbacks for stable event handlers
  const navigateRef = useRef(navigate);
  const playSoundRef = useRef(playSound);

  useEffect(() => {
    navigateRef.current = navigate;
    playSoundRef.current = playSound;
  }, [navigate, playSound]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAsReadRef = useRef(markAsRead);
  useEffect(() => {
    markAsReadRef.current = markAsRead;
  }, [markAsRead]);

  // Add a new notification - STABLE callback
  // Spelled out rather than `Omit<AppNotification, 'read'>`: Omit over a union
  // collapses it to the keys the members share, which would reduce every
  // notification to { id, type, message, timestamp } and reject the rest.
  const addNotification = useCallback((data: Omit<LeadNotification, 'read'> | Omit<ChatGroupNotification, 'read'> | Omit<ChatMessageNotification, 'read'> | Omit<LeadTransactionNotification, 'read'> | Omit<DealTransactionNotification, 'read'> | Omit<AppointmentNotification, 'read'> | Omit<DocumentNotification, 'read'>) => {
    const notification = { ...data, read: false } as AppNotification;

    setNotifications(prev => {
      if (prev.some(n => n.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, 50);
    });

    playSoundRef.current();

    if (data.type === 'lead_created') {
      toast.success(data.message, {
        description: 'Click to view lead details',
        action: {
          label: 'View',
          onClick: () => {
            markAsReadRef.current(notification.id);
            navigateRef.current(`/leads/${data.lead.funnel_id}/lead/${data.lead.id}`);
          },
        },
        duration: 5000,
      });
    } else if (data.type === 'group_created') {
      toast.success(data.message, { duration: 4000 });
    } else if (data.type === 'private_message') {
      toast.success(data.senderName, {
        description: data.preview,
        action: {
          label: 'Open',
          onClick: () => {
            markAsReadRef.current(notification.id);
            navigateRef.current('/?section=optomyze-inbox');
          },
        },
        duration: 5000,
      });
    } else if (data.type === 'lead_transaction') {
      // Only toast for important events
      if (data.transaction.is_important) {
        const actor = data.transaction.user?.name ?? (data.transaction.source === 'automation' ? 'Automation' : 'System');
        const lead = data.transaction.lead;
        const initials = [lead.first_name, lead.last_name]
          .filter(Boolean)
          .map(n => n.charAt(0).toUpperCase())
          .join('') || '?';
        toast.success(actor, {
          description: data.transaction.description,
          icon: (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-[10px]">{initials}</span>
            </div>
          ),
          duration: 4000,
        });
      }
    } else if (data.type === 'appointment_scheduled') {
      const lead = data.lead;
      const initials = lead
        ? [lead.first_name, lead.last_name].filter(Boolean).map(n => n.charAt(0).toUpperCase()).join('') || '?'
        : null;
      const scheduledAt = new Date(data.appointment.scheduled_at).toLocaleString();
      toast.info(data.actor?.name ?? 'Optomyze CRM', {
        description: `${data.appointment.title} · ${scheduledAt}${data.assigned_user ? ` · ${data.assigned_user.name}` : ''}`,
        icon: initials ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-500 font-bold text-[10px]">{initials}</span>
          </div>
        ) : undefined,
        duration: 5000,
      });
    } else if (data.type === 'deal_transaction') {
      const isWonLost = ['won', 'lost'].includes(data.transaction.action);
      const isCreated = data.transaction.action === 'created';
      if (isWonLost || isCreated) {
        const actor = data.transaction.user?.name ?? (data.transaction.source === 'automation' ? 'Automation' : 'System');
        const lead = data.transaction.deal?.lead;
        const initials = lead
          ? [lead.first_name, lead.last_name].filter(Boolean).map(n => n.charAt(0).toUpperCase()).join('') || '?'
          : null;
        const toastFn = data.transaction.action === 'lost' ? toast.error : toast.success;
        toastFn(actor, {
          description: data.transaction.description,
          icon: initials ? (
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-bold text-[10px]">{initials}</span>
            </div>
          ) : undefined,
          duration: isCreated ? 4000 : 5000,
        });
      }
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ─── WebSocket subscriptions ───────────────────────────────────────────

  // Company channel: lead.created + group.created
  useEffect(() => {
    if (!user?.company_id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `company.${user.company_id}`;
    console.log(`🔔 Subscribing to channel: ${channelName}`);
    const channel = echo.private(channelName);

    // Lead created
    channel.listen('.lead.created', (data: Omit<LeadNotification, 'read'>) => {
      console.log('🔔 Received lead.created event:', data);
      addNotification(data);
    });

    // Lead transaction (stage change, assignment, note, etc.)
    channel.listen('.lead.transaction', (payload: any) => {
      console.log('🔔 Received lead.transaction event:', payload);

      const txPayload = {
        id: payload.id,
        txType: payload.type,
        action: payload.action,
        description: payload.description,
        source: payload.source,
        is_important: payload.is_important,
        lead: payload.lead,
        user: payload.user,
        created_at: payload.created_at,
      };

      // Emit to any listening activity dashboards
      emitLeadTransaction(txPayload);

      // Only notify other users' actions (skip own actions)
      if (payload.user?.id === user.id) return;

      addNotification({
        id: `lead_tx_${payload.id}_${Date.now()}`,
        type: 'lead_transaction',
        message: payload.description,
        transaction: txPayload,
        timestamp: payload.created_at ?? new Date().toISOString(),
      });
    });

    // Deal transaction (stage change, won/lost, creation, deletion, etc.)
    channel.listen('.deal.transaction', (payload: any) => {
      console.log('🔔 Received deal.transaction event:', payload);

      const txPayload = {
        id: payload.id,
        txType: payload.type,
        action: payload.action,
        description: payload.description,
        source: payload.source,
        deal: payload.deal,
        user: payload.user,
        created_at: payload.created_at,
      };

      // Emit to any listening deal activity dashboards
      emitDealTransaction(txPayload);

      // Only notify other users' actions (skip own actions)
      if (payload.user?.id === user.id) return;

      addNotification({
        id: `deal_tx_${payload.id}_${Date.now()}`,
        type: 'deal_transaction',
        message: payload.description,
        transaction: txPayload,
        timestamp: payload.created_at ?? new Date().toISOString(),
      });
    });

    // Appointment scheduled
    channel.listen('.appointment.scheduled', (payload: any) => {
      console.log('🔔 Received appointment.scheduled event:', payload);

      if (payload.actor?.id === user.id) return;

      addNotification({
        id: payload.id ?? `appointment_${Date.now()}`,
        type: 'appointment_scheduled',
        message: payload.message,
        appointment: payload.appointment,
        lead: payload.lead ?? null,
        assigned_user: payload.assigned_user ?? null,
        actor: payload.actor,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      });
    });

    // Document milestone (contract signed / refused / expired / sent)
    channel.listen('.document.transaction', (payload: any) => {
      console.log('🔔 Received document.transaction event:', payload);

      // The server already decided this event is worth a notification and who
      // is eligible; the only thing left to filter is the person who caused it.
      if (payload.actor?.id === user.id) return;

      addNotification({
        id: payload.id ?? `document_${payload.document?.id}_${Date.now()}`,
        type: payload.type,
        message: payload.message,
        priority: payload.priority ?? 'normal',
        document: payload.document,
        actor: payload.actor ?? null,
        timestamp: payload.timestamp ?? new Date().toISOString(),
      });
    });

    // Group created
    channel.listen('.group.created', (payload: any) => {
      console.log('🔔 Received group.created event:', payload);
      // Only notify if the current user is in the participants list
      const isParticipant = payload?.participants?.some((p: any) => p.id === user.id);
      if (!isParticipant) return;

      addNotification({
        id: `group_created_${payload.id}_${Date.now()}`,
        type: 'group_created',
        message: `New group "${payload.name}" created`,
        groupName: payload.name,
        creatorName: payload.participants?.find((p: any) => p.id === payload.created_by)?.name ?? 'Someone',
        creatorPic: payload.participants?.find((p: any) => p.id === payload.created_by)?.profile_pic_url ?? null,
        timestamp: payload.created_at ?? new Date().toISOString(),
      });
    });

    return () => {
      console.log(`🔔 Leaving channel: ${channelName}`);
      echo.leave(channelName);
    };
  }, [user?.company_id, user?.id, addNotification]);

  // User personal channel: private message notifications
  useEffect(() => {
    if (!user?.id) return;
    const echo = getEcho();
    if (!echo) return;

    const channelName = `chat-notifications.${user.id}`;
    console.log(`🔔 Subscribing to channel: ${channelName}`);
    const channel = echo.private(channelName);

    channel.listen('.private.message.notification', (payload: any) => {
      console.log('🔔 Received private.message.notification event:', payload);
      addNotification({
        id: `pm_${payload.conversation_id}_${Date.now()}`,
        type: 'private_message',
        message: `${payload.sender?.name}: ${payload.preview}`,
        conversationId: payload.conversation_id,
        senderName: payload.sender?.name ?? 'Unknown',
        senderPic: payload.sender?.profile_pic_url ?? null,
        preview: payload.preview ?? '',
        timestamp: payload.created_at ?? new Date().toISOString(),
      });
    });

    return () => {
      console.log(`🔔 Leaving channel: ${channelName}`);
      echo.leave(channelName);
    };
  }, [user?.id, addNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
