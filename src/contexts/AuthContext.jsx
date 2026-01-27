import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';
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
    dispatch({ type: 'LOGOUT' });
  };

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