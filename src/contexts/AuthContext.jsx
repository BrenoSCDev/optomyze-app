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
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        funnels: [],
        isAuthenticated: false,
        isLoading: false,
      };
    case 'UPDATE_FUNNELS':
      return {
        ...state,
        funnels: action.payload,
      };
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        funnels: action.payload.funnels,
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

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await authService.login(email, password);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data.user,
          token: data.access_token,
          funnels: data.funnels,
        },
      });
      
      // Initialize Echo AFTER login succeeds and token is stored
      initEcho();
      console.log('🔌 Echo initialized after login');
      
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
    
    await authService.logout();

    // Clear the preferences first-paint cache. Without this, the next person to
    // sign in on this machine briefly sees the previous user's theme and
    // language before their own preferences arrive from the server.
    try {
      localStorage.removeItem('optomyze_preferences_cache');
      // Also drop any pre-sign-in changes, or they would be applied to
      // whoever signs in next on this machine.
      localStorage.removeItem('optomyze_preferences_pending');
    } catch { /* private mode */ }

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

  const value = {
    ...state,
    login,
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