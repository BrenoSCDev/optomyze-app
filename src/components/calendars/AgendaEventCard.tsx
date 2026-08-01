/**
 * AGENDA EVENT CARD
 *
 * Pipeline-card-style representation of a task/event/appointment, used in
 * the right-side agenda panel, the expanded day dialog, and (in compact
 * form) the upcoming events summary. Consolidates what used to be three
 * near-duplicate inline blocks in OptomyzeCalendar.tsx.
 */

import React from 'react';
import { format } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import {
  CheckSquare, CalendarDays, Clock, User, MapPin, FileText, ExternalLink,
  Globe, AlertCircle, Edit2, Trash2, CheckCircle2, XCircle, UserX, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/services/appointmentApi';
import { CalendarItem, getAccentColor, formatTime, formatDuration } from './calendarUtils';
import { StatusBadge } from './StatusBadge';
import { MiniAvatar } from './MiniAvatar';

interface AgendaEventCardProps {
  item: CalendarItem;
  variant?: 'full' | 'compact';
  isUpdating?: boolean;
  dateLocale?: Locale;
  onEdit?: (item: CalendarItem) => void;
  onDelete?: (item: CalendarItem) => void;
  onStatusChange?: (item: CalendarItem, status: Appointment['status']) => void;
  onPreviewLead?: (leadId: string) => void;
  onClick?: (item: CalendarItem) => void;
}

export const AgendaEventCard: React.FC<AgendaEventCardProps> = ({
  item,
  variant = 'full',
  isUpdating = false,
  dateLocale,
  onEdit,
  onDelete,
  onStatusChange,
  onPreviewLead,
  onClick,
}) => {
  const { t } = useLanguage();
  const isCompact = variant === 'compact';
  const accentColor = getAccentColor(item);
  const duration = formatDuration(item.date, item.endDate);

  return (
    <div
      onClick={onClick ? () => onClick(item) : undefined}
      className={cn(
        'rounded-lg border border-border bg-card/60 p-3 sm:p-4 transition-colors duration-fast ease-standard',
        isCompact ? 'cursor-pointer hover:bg-surface-2' : 'hover:shadow-elevation-sm'
      )}
      style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.type === 'task' ? (
            <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : item.type === 'appointment' ? (
            <span className="rounded-full inline-block shrink-0" style={{ backgroundColor: accentColor, width: 10, height: 10 }} />
          ) : (
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <h4 className={cn('font-semibold text-foreground truncate', isCompact ? 'text-sm' : 'text-base')}>
            {item.title}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {item.type === 'appointment' ? (
            <StatusBadge kind="appointment-status" value={item.status} />
          ) : item.type === 'task' ? (
            <StatusBadge kind="task-status" value={item.status} />
          ) : (
            <StatusBadge kind="event-type" value={item.subType} />
          )}
          {!isCompact && item.type === 'event' && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(item);
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(item);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {formatTime(item.date, item.allDay)}
          {item.endDate && !item.allDay && ` – ${format(item.endDate, 'HH:mm')}`}
          {duration && <span className="text-muted-foreground/70"> · {duration}</span>}
        </span>
        {isCompact && dateLocale && <span>{format(item.date, 'MMM d', { locale: dateLocale })}</span>}
      </div>

      {(item.leadName || item.attendee) && (
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {item.leadName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (item.leadId) onPreviewLead?.(String(item.leadId));
              }}
              className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
            >
              <MiniAvatar name={item.leadName} id={item.leadId} />
              {item.leadName}
              {item.leadId && <ExternalLink className="h-3 w-3" />}
            </button>
          )}
          {item.attendee && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MiniAvatar name={item.attendee} />
              {item.attendee}
            </span>
          )}
        </div>
      )}

      {!isCompact && (
        <>
          {item.type === 'appointment' && (item.status === 'draft' || item.status === 'scheduled') && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {item.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[11px]"
                  disabled={isUpdating}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange?.(item, 'scheduled');
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" />{t('appointments.confirm-schedule')}
                </Button>
              )}
              {item.status === 'scheduled' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px]"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(item, 'completed');
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3" />{t('appointments.mark-completed')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px]"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(item, 'cancelled');
                    }}
                  >
                    <XCircle className="h-3 w-3" />{t('appointments.mark-cancelled')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[11px]"
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(item, 'no_show');
                    }}
                  >
                    <UserX className="h-3 w-3" />{t('appointments.mark-no-show')}
                  </Button>
                </>
              )}
              {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
          )}

          {item.description && (
            <div className="mt-2 flex items-start gap-2 text-sm text-foreground/80">
              <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <p className="line-clamp-2">{item.description}</p>
            </div>
          )}

          {item.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{item.location}</span>
            </div>
          )}

          {item.timezone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span>{item.timezone}</span>
            </div>
          )}

          {(item.priority || item.hasReminder) && (
            <div className="flex flex-wrap gap-1 mt-3">
              {item.priority && item.type === 'task' && (
                <StatusBadge kind="task-priority" value={item.priority} />
              )}
              {item.hasReminder && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Reminder
                </Badge>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AgendaEventCard;
