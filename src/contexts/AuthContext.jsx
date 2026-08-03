import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';
import api from '../services/api';
import { initEcho, disconnectEcho } from '../services/echo';

const AuthContext = createContext(undefined);

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        funnels: action.payload.funnels,
        companies: action.payload.companies ?? state.companies,
        pendingSelection: null,
        isAuthenticated: true,
        isLoading: false,
      };
    // Credentials accepted, but the person belongs to more than one company
    // and has not chosen yet. There is no session at this point.
    case 'COMPANY_SELECTION_REQUIRED':
      return {
        ...state,
        pendingSelection: action.payload,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        funnels: [],
        companies: [],
        pendingSelection: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_FUNNELS':
      return {
        ...state,
        funnels: action.payload,
      };
    case 'UPDATE_COMPANIES':
      return {
        ...state,
        companies: action.payload,
      };
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        funnels: action.payload.funnels,
        companies: action.payload.companies ?? [],
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  funnels: [],
  /** Every company this person can act in — drives the switcher. */
  companies: [],
  /** { selection_token, companies } while a login awaits a company choice. */
  pendingSelection: null,
  isAuthenticated: false,
  isLoading: true,
};

export const AuthProvider = ({ children }) => {
  const refreshFunnelsRef = React.useRef(null);
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Initialize auth state from localStorage
    const authData = authService.getAuthData();
    dispatch({
      type: 'INIT_AUTH',
      payload: authData,
    });
    
    // If user is already authenticated (page refresh), initialize Echo
    if (authData.token) {
      initEcho();
      console.log('🔌 Echo initialized on app load (existing session)');
      // The cached funnel list is a login-time snapshot; it goes stale when a
      // funnel is toggled or contact pipelines are switched in another session.
      refreshFunnelsRef.current?.();
    }
  }, []);

  /** Applies a freshly issued company session and brings the socket up. */
  const startSession = (data) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: data.user,
        token: data.access_token,
        funnels: data.funnels,
        companies: data.companies,
      },
    });

    // Echo is initialised only once the token is stored — it authenticates
    // its private channels with it, and those channels are company-scoped.
    initEcho();
    console.log('🔌 Echo initialized for company', data.user?.company_id);
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await authService.login(email, password);

      // Several companies: hold the choice, start no session yet.
      if (data.requires_company_selection) {
        dispatch({
          type: 'COMPANY_SELECTION_REQUIRED',
          payload: {
            selectionToken: data.selection_token,
            companies: data.companies ?? [],
          },
        });
        return data;
      }

      startSession(data);
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  /** Redeems the pending selection for a session in the chosen company. */
  const selectCompany = async (companyId) => {
    const token = state.pendingSelection?.selectionToken;

    if (!token) {
      throw new Error('No company selection in progress.');
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const data = await authService.selectCompany(token, companyId);
      startSession(data);
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  /**
   * Moves an active session to another company.
   *
   * A full teardown, not a state update: the socket is disconnected before the
   * swap so no subscription to the previous company's channels survives it,
   * and authService.switchCompany clears every cached key before writing the
   * new session. Callers should reload the route afterwards — in-memory React
   * state still holds the previous company's records.
   */
  const switchCompany = async (companyId) => {
    if (Number(companyId) === Number(state.user?.company_id)) {
      return null;
    }

    disconnectEcho();
    console.log('🔌 Echo disconnected for company switch');

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const data = await authService.switchCompany(companyId);
      startSession(data);
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    // Disconnect Echo BEFORE logout to clean up WebSocket connections
    disconnectEcho();
    console.log('🔌 Echo disconnected on logout');

    // Clears every cached key, not just the token — including the preferences
    // first-paint cache, which would otherwise show the previous person's
    // theme and language to whoever signs in next on this machine.
    await authService.logout();

    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Re-reads the navigable funnels from the server. The list depends on both
   * each funnel's is_active flag and the company's contact-pipeline switch, so
   * anything that changes either must call this to keep the menu honest —
   * otherwise the sidebar keeps showing the login-time snapshot.
   */
  const refreshFunnels = async () => {
    try {
      const { data } = await api.get('/api/funnels/navigation');
      const funnels = data?.data ?? [];
      localStorage.setItem('optomyze_funnels', JSON.stringify(funnels));
      dispatch({ type: 'UPDATE_FUNNELS', payload: funnels });
      return funnels;
    } catch {
      return null;   // keep the current menu rather than blanking it
    }
  };

  refreshFunnelsRef.current = refreshFunnels;

  const updateFunnels = (funnels) => {
    localStorage.setItem('optomyze_funnels', JSON.stringify(funnels));
    dispatch({ type: 'UPDATE_FUNNELS', payload: funnels });
  };

  const updateFunnel = (updatedFunnel) => {
    const updatedFunnels = state.funnels.map(funnel => 
      funnel.id === updatedFunnel.id ? updatedFunnel : funnel
    );
    localStorage.setItem('optomyze_funnels', JSON.stringify(updatedFunnels));
    dispatch({ type: 'UPDATE_FUNNELS', payload: updatedFunnels });
  };

  const updateUser = (updatedUser) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: updatedUser,
        token: state.token,
        funnels: state.funnels,
      },
    });
    localStorage.setItem('optomyze_user', JSON.stringify(updatedUser));
  };

  /** Re-reads the company list, e.g. after being added to another company. */
  const refreshCompanies = async () => {
    try {
      const { data } = await authService.companies();
      localStorage.setItem('optomyze_companies', JSON.stringify(data ?? []));
      dispatch({ type: 'UPDATE_COMPANIES', payload: data ?? [] });
      return data;
    } catch {
      return null;
    }
  };

  const value = {
    ...state,
    activeCompanyId: state.user?.company_id ?? null,
    login,
    selectCompany,
    switchCompany,
    refreshCompanies,
    refreshFunnels,
    logout,
    updateFunnels,
    updateFunnel,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};