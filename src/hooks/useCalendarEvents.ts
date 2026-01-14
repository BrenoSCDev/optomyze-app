import { useQuery } from '@tanstack/react-query';
import { fetchCalendarEvents, CalendarEventsResponse } from '@/services/calendarApi';

export const useCalendarEvents = () => {
  return useQuery<CalendarEventsResponse>({
    queryKey: ['calendarEvents'],
    queryFn: fetchCalendarEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
