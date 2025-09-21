import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';

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
      
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const updateFunnels = (funnels) => {
    localStorage.setItem('optomyze_funnels', JSON.stringify(funnels));
    dispatch({ type: 'UPDATE_FUNNELS', payload: funnels });
  };

  const value = {
    ...state,
    login,
    logout,
    updateFunnels,
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