/**
 * DAY DETAILS DIALOG
 *
 * Expanded day view triggered by the "+N more" overflow control in the
 * month/week grid. Shows every item for that day as a full agenda card
 * without losing the surrounding month context.
 */

import React from 'react';
import { format } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import type { Appointment } from '@/services/appointmentApi';
import { CalendarItem } from './calendarUtils';
import { AgendaEventCard } from './AgendaEventCard';

interface DayDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  items: CalendarItem[];
  dateLocale: Locale;
  updatingItemId?: number | null;
  onEdit: (item: CalendarItem) => void;
  onDelete: (item: CalendarItem) => void;
  onStatusChange: (item: CalendarItem, status: Appointment['status']) => void;
  onPreviewLead: (leadId: string) => void;
}

export const DayDetailsDialog: React.FC<DayDetailsDialogProps> = ({
  open,
  onOpenChange,
  date,
  items,
  dateLocale,
  updatingItemId,
  onEdit,
  onDelete,
  onStatusChange,
  onPreviewLead,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{date ? format(date, 'EEEE, MMMM d, yyyy', { locale: dateLocale }) : ''}</DialogTitle>
          <DialogDescription>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 overflow-y-auto pr-1 -mr-1">
          {items.map((item) => (
            <AgendaEventCard
              key={item.id}
              item={item}
              variant="full"
              isUpdating={updatingItemId === item.originalId}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onPreviewLead={onPreviewLead}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayDetailsDialog;
