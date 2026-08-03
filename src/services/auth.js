import api from './api';
import { DEVICE_PREFERENCE_KEY_LIST } from '@/lib/devicePreferences';

/**
 * Storage keys that survive a session reset.
 *
 * Deliberately an allow-list rather than a list of things to delete. A session
 * reset happens when the active company changes, and anything cached from the
 * previous company — stage ids, funnel lists, preferences, chat history — is
 * that company's data. Defaulting to "clear it" means a cache key added later
 * is safe without anyone remembering to come back here; defaulting to "keep
 * it" means the next new key silently leaks across the tenant boundary.
 *
 * The exceptions describe the machine rather than the account — see
 * lib/devicePreferences for what qualifies.
 */
const KEYS_KEPT_ACROSS_SESSIONS = new Set(DEVICE_PREFERENCE_KEY_LIST);

/** Everything cached for the signed-in company. Used by logout and by switch. */
export const resetSession = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => !KEYS_KEPT_ACROSS_SESSIONS.has(key))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
  } catch {
    /* private mode — nothing was stored to begin with */
  }
};

/** Writes a company session to storage. The token is bound to one company. */
const persistSession = (data) => {
  localStorage.setItem('optomyze_auth_token', data.access_token);
  localStorage.setItem('optomyze_user', JSON.stringify(data.user));
  localStorage.setItem('optomyze_funnels', JSON.stringify(data.funnels ?? []));
  localStorage.setItem('optomyze_companies', JSON.stringify(data.companies ?? []));
  return data;
};

export const authService = {
  /**
   * Step one of signing in.
   *
   * Resolves to either a session (the person belongs to one company) or a
   * choice (they belong to several). Nothing is stored in the second case —
   * there is no session until a company has been picked.
   */
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });

    if (data.requires_company_selection) {
      return data;
    }

    return persistSession(data);
  },

  /** Step two: redeem the selection token for a session in one company. */
  async selectCompany(selectionToken, companyId) {
    const { data } = await api.post('/api/auth/select-company', {
      selection_token: selectionToken,
      company_id: companyId,
    });

    return persistSession(data);
  },

  /**
   * Move an existing session to another company.
   *
   * The cache is cleared before the new session is written, so there is no
   * window in which the previous company's data sits alongside the new
   * company's token.
   */
  async switchCompany(companyId) {
    const { data } = await api.post('/api/auth/switch-company', { company_id: companyId });

    resetSession();

    return persistSession(data);
  },

  /** The companies this person may switch to. */
  async companies() {
    const { data } = await api.get('/api/auth/companies');
    return data;
  },

  // Logout function
  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      resetSession();
    }
  },

  // Get stored auth data
  getAuthData() {
    const token = localStorage.getItem('optomyze_auth_token');
    const user = localStorage.getItem('optomyze_user');
    const funnels = localStorage.getItem('optomyze_funnels');
    const companies = localStorage.getItem('optomyze_companies');

    return {
      token,
      user: user ? JSON.parse(user) : null,
      funnels: funnels ? JSON.parse(funnels) : [],
      companies: companies ? JSON.parse(companies) : [],
    };
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('optomyze_auth_token');
    return !!token;
  },
};
