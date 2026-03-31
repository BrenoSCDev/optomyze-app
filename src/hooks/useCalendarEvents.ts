import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  CalendarEventsResponse,
  CreateEventPayload,
  UpdateEventPayload,
  CalendarEvent
} from '@/services/calendarApi';
import { toast } from '@/hooks/use-toast';

export const useCalendarEvents = () => {
  return useQuery<CalendarEventsResponse>({
    queryKey: ['calendarEvents'],
    queryFn: fetchCalendarEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createCalendarEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast({
        title: 'Event created',
        description: 'The event has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to create event.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: number; payload: UpdateEventPayload }) => 
      updateCalendarEvent(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast({
        title: 'Event updated',
        description: 'The event has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update event.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: number) => deleteCalendarEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete event.',
        variant: 'destructive',
      });
    },
  });
};
