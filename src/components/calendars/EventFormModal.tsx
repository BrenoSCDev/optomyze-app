/**
 * EVENT FORM MODAL
 * 
 * Reusable modal for creating and editing calendar events
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar, Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { CalendarEvent } from '@/services/calendarApi';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['meeting', 'call', 'deadline', 'reminder', 'other']),
  start_at: z.string().min(1, 'Start date is required'),
  end_at: z.string().optional(),
  all_day: z.boolean(),
  reminder: z.boolean(),
});

export type EventFormData = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  event?: CalendarEvent | null;
  isLoading?: boolean;
  defaultDate?: Date;
}

const eventTypes = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'other', label: 'Other' },
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  event,
  isLoading = false,
  defaultDate,
}) => {
  const { t } = useLanguage();
  const isEditing = !!event;

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'meeting',
      start_at: '',
      end_at: '',
      all_day: false,
      reminder: false,
    },
  });

  // Reset form when modal opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        // Editing: populate with event data
        form.reset({
          title: event.title,
          description: event.description || '',
          type: event.type,
          start_at: event.start_at ? format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm") : '',
          end_at: event.end_at ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm") : '',
          all_day: event.all_day,
          reminder: event.reminder === 1,
        });
      } else {
        // Creating: use default date or current time
        const startDate = defaultDate || new Date();
        form.reset({
          title: '',
          description: '',
          type: 'meeting',
          start_at: format(startDate, "yyyy-MM-dd'T'HH:mm"),
          end_at: '',
          all_day: false,
          reminder: false,
        });
      }
    }
  }, [open, event, defaultDate, form]);

  const handleSubmit = async (data: EventFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {isEditing ? t('calendar.edit-event') || 'Edit Event' : t('calendar.new-event') || 'New Event'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calendar.event-title') || 'Title'}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calendar.event-description') || 'Description'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter event description..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calendar.event-type') || 'Type'}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('calendar.start-time') || 'Start'}
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('calendar.end-time') || 'End'}
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="all_day"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      {t('calendar.all-day') || 'All day'}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">
                      {t('calendar.reminder') || 'Reminder'}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.cancel') || 'Cancel'}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing 
                  ? (t('common.save') || 'Save') 
                  : (t('calendar.create-event') || 'Create Event')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormModal;
