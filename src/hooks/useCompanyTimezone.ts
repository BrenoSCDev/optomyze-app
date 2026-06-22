import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

/**
 * The company's configured timezone, used to default new appointments'
 * timezone field. Cached indefinitely for the session via react-query so
 * every component that needs it (lead detail tabs, calendar, etc.) shares
 * a single fetch instead of re-hitting the settings-panel endpoint.
 */
export const useCompanyTimezone = () => {
  const { data } = useQuery<string | null>({
    queryKey: ['companyTimezone'],
    queryFn: async () => {
      const { data } = await api.get('/api/settings-panel');
      return data.companyTimezone ?? null;
    },
    staleTime: Infinity,
  });

  return data ?? null;
};
