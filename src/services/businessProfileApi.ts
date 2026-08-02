/**
 * BUSINESS PROFILE API
 *
 * The signed-in user's own company. The backend only ever returns the
 * editable fields — plan, product module and the settings JSON are not part
 * of this contract by design.
 */

import api from './api';

export interface BusinessProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  timezone: string | null;
  currency: string | null;
  language: string | null;
  /** Opt-in contact cadence in front of deals; off by default. */
  contact_pipeline_enabled: boolean;
  /** Private disk path; render through usePrivateFile, not as a URL. */
  logo_path: string | null;
}

export type BusinessProfilePayload = Partial<
  Pick<BusinessProfile, 'name' | 'email' | 'phone' | 'website' | 'timezone' | 'currency' | 'language' | 'contact_pipeline_enabled'>
>;

export const fetchBusinessProfile = async (): Promise<BusinessProfile> => {
  const res = await api.get('/api/business-profile');
  return res.data.data;
};

export const updateBusinessProfile = async (payload: BusinessProfilePayload): Promise<BusinessProfile> => {
  const res = await api.put('/api/business-profile', payload);
  return res.data.data;
};

export const uploadBusinessLogo = async (file: File): Promise<BusinessProfile> => {
  const form = new FormData();
  form.append('logo', file);
  const res = await api.post('/api/business-profile/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const deleteBusinessLogo = async (): Promise<BusinessProfile> => {
  const res = await api.delete('/api/business-profile/logo');
  return res.data.data;
};
