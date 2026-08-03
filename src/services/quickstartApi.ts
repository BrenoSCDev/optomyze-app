/**
 * QUICKSTART API
 *
 * The onboarding checklist, one per company. The server owns which steps
 * exist and their order — `steps` comes back with every response, so the
 * client never hardcodes the sequence, only how each key is labelled and
 * where it points.
 */

import api from './api';

/** Step keys, mirroring CompanyQuickstart::STEPS on the API. */
export type QuickstartStep =
  | 'create_funnel'
  | 'connect_messaging'
  | 'welcome_message'
  | 'add_team_member'
  | 'first_appointment'
  | 'chat_widget';

export interface Quickstart {
  id: number;
  company_id: number;
  steps: QuickstartStep[];
  completed_steps: QuickstartStep[];
  completed_count: number;
  total_steps: number;
  is_complete: boolean;
  dismissed: boolean;
  dismissed_at: string | null;
}

export const quickstartService = {
  async get(): Promise<Quickstart> {
    const response = await api.get('/api/quickstart');
    return response.data.data;
  },

  async setStepCompleted(step: QuickstartStep, completed: boolean): Promise<Quickstart> {
    const response = await api.patch(`/api/quickstart/steps/${step}`, { completed });
    return response.data.data;
  },

  /** Dismissing hides the checklist; passing false brings it back. */
  async setDismissed(dismissed: boolean): Promise<Quickstart> {
    const response = await api.post('/api/quickstart/dismiss', { dismissed });
    return response.data.data;
  },
};
