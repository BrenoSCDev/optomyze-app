import api from './api';

export interface ObservationUser {
  id: number;
  name: string;
  email: string;
  profile_pic?: string | null;
}

/** What a note can be attached to. Short keys, matching the API. */
/** Records that carry threaded notes. Mirrors ObservationController::NOTABLE_TYPES. */
export type NotableType = 'lead' | 'deal' | 'appointment';

export interface Observation {
  id: number;
  lead_id: number | null;
  notable_type?: string | null;
  notable_id?: number | null;
  parent_id?: number | null;
  user_id: number;
  note: string;
  /** Ids of teammates mentioned with @[id] markup in the body. */
  mentions?: number[] | null;
  /** Set once the note has been changed after posting. */
  edited_at?: string | null;
  created_at: string;
  updated_at: string;
  user: ObservationUser;
  /** Only present on top-level notes. One level deep by design. */
  replies?: Observation[];
}

export const observationService = {
  /** Every thread on a record, newest first, replies nested. */
  async listFor(type: NotableType, id: number): Promise<Observation[]> {
    const response = await api.get(`/api/notes/${type}/${id}`);
    return response.data?.data ?? [];
  },

  /**
   * Post a note.
   *
   * Give a `parentId` to reply: the reply inherits whatever its parent is
   * attached to, so the caller never has to repeat the target.
   */
  async createNote(
    target: { type: NotableType; id: number } | { parentId: number },
    note: string
  ): Promise<Observation> {
    const payload = 'parentId' in target
      ? { parent_id: target.parentId, note }
      : { notable_type: target.type, notable_id: target.id, note };

    const response = await api.post('/api/observations', payload);
    return response.data.data;
  },

  /** Legacy shape, kept so existing lead callers need no change. */
  async createObservation(leadId: number, note: string): Promise<Observation> {
    const response = await api.post('/api/observations', { lead_id: leadId, note });
    return response.data.data;
  },

  async updateObservation(observationId: number, note: string): Promise<Observation> {
    const response = await api.put(`/api/observations/${observationId}`, { note });
    return response.data.data;
  },

  async deleteObservation(observationId: number): Promise<void> {
    await api.delete(`/api/observations/${observationId}`);
  }
};
