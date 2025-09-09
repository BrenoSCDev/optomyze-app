/**
 * LANGUAGE CONTEXT
 * 
 * Provides internationalization support for the CRM application
 * Manages language selection and translations
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'pt-BR' | 'de' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionaries
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.leads': 'Leads',
    'nav.integrations': 'Integrations',
    'nav.settings': 'Settings',
    'nav.api': 'API',
    'nav.users': 'Users',
    'nav.logout': 'Logout',
    'nav.languages': 'Languages',
    
    // Dashboard Items
    'dashboard.optomyze-metrics': 'Optomyze Metrics',
    'dashboard.meta-ads': 'Meta Ads',
    'dashboard.google-ads': 'Google Ads',
    'dashboard.google-analytics': 'Google Analytics',
    
    // Settings
    'settings.title': 'Settings',
    'settings.languages.title': 'Languages',
    'settings.languages.description': 'Select your preferred language for the CRM interface',
    'settings.languages.current': 'Current Language',
    'settings.languages.select': 'Select Language',
    
    // Language Names
    'language.english': 'English',
    'language.portuguese': 'Brazilian Portuguese',
    'language.german': 'German',
    'language.spanish': 'Spanish',
    
    // Auth
    'auth.welcome': 'Welcome Back',
    'auth.subtitle': 'Sign in to access your dashboard',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signin': 'Sign In',
    'auth.signingin': 'Signing In...',
    
    // User Info
    'user.loggedinas': 'Logged in as',
    'user.role': 'Role',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.success': 'Success',
    'common.error': 'Error',
  },
  'pt-BR': {
    // Navigation
    'nav.dashboard': 'Painel',
    'nav.leads': 'Leads',
    'nav.integrations': 'Integrações',
    'nav.settings': 'Configurações',
    'nav.api': 'API',
    'nav.users': 'Usuários',
    'nav.logout': 'Sair',
    'nav.languages': 'Idiomas',
    
    // Dashboard Items
    'dashboard.optomyze-metrics': 'Métricas Optomyze',
    'dashboard.meta-ads': 'Meta Ads',
    'dashboard.google-ads': 'Google Ads',
    'dashboard.google-analytics': 'Google Analytics',
    
    // Settings
    'settings.title': 'Configurações',
    'settings.languages.title': 'Idiomas',
    'settings.languages.description': 'Selecione seu idioma preferido para a interface do CRM',
    'settings.languages.current': 'Idioma Atual',
    'settings.languages.select': 'Selecionar Idioma',
    
    // Language Names
    'language.english': 'Inglês',
    'language.portuguese': 'Português Brasileiro',
    'language.german': 'Alemão',
    'language.spanish': 'Espanhol',
    
    // Auth
    'auth.welcome': 'Bem-vindo de Volta',
    'auth.subtitle': 'Faça login para acessar seu painel',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.signin': 'Entrar',
    'auth.signingin': 'Entrando...',
    
    // User Info
    'user.loggedinas': 'Logado como',
    'user.role': 'Função',
    
    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.success': 'Sucesso',
    'common.error': 'Erro',
  },
  de: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.leads': 'Leads',
    'nav.integrations': 'Integrationen',
    'nav.settings': 'Einstellungen',
    'nav.api': 'API',
    'nav.users': 'Benutzer',
    'nav.logout': 'Abmelden',
    'nav.languages': 'Sprachen',
    
    // Dashboard Items
    'dashboard.optomyze-metrics': 'Optomyze Metriken',
    'dashboard.meta-ads': 'Meta Ads',
    'dashboard.google-ads': 'Google Ads',
    'dashboard.google-analytics': 'Google Analytics',
    
    // Settings
    'settings.title': 'Einstellungen',
    'settings.languages.title': 'Sprachen',
    'settings.languages.description': 'Wählen Sie Ihre bevorzugte Sprache für die CRM-Oberfläche',
    'settings.languages.current': 'Aktuelle Sprache',
    'settings.languages.select': 'Sprache auswählen',
    
    // Language Names
    'language.english': 'Englisch',
    'language.portuguese': 'Brasilianisches Portugiesisch',
    'language.german': 'Deutsch',
    'language.spanish': 'Spanisch',
    
    // Auth
    'auth.welcome': 'Willkommen zurück',
    'auth.subtitle': 'Melden Sie sich an, um auf Ihr Dashboard zuzugreifen',
    'auth.email': 'E-Mail',
    'auth.password': 'Passwort',
    'auth.signin': 'Anmelden',
    'auth.signingin': 'Anmelden...',
    
    // User Info
    'user.loggedinas': 'Angemeldet als',
    'user.role': 'Rolle',
    
    // Common
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.success': 'Erfolg',
    'common.error': 'Fehler',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.leads': 'Leads',
    'nav.integrations': 'Integraciones',
    'nav.settings': 'Configuración',
    'nav.api': 'API',
    'nav.users': 'Usuarios',
    'nav.logout': 'Cerrar Sesión',
    'nav.languages': 'Idiomas',
    
    // Dashboard Items
    'dashboard.optomyze-metrics': 'Métricas Optomyze',
    'dashboard.meta-ads': 'Meta Ads',
    'dashboard.google-ads': 'Google Ads',
    'dashboard.google-analytics': 'Google Analytics',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.languages.title': 'Idiomas',
    'settings.languages.description': 'Selecciona tu idioma preferido para la interfaz del CRM',
    'settings.languages.current': 'Idioma Actual',
    'settings.languages.select': 'Seleccionar Idioma',
    
    // Language Names
    'language.english': 'Inglés',
    'language.portuguese': 'Portugués Brasileño',
    'language.german': 'Alemán',
    'language.spanish': 'Español',
    
    // Auth
    'auth.welcome': 'Bienvenido de Nuevo',
    'auth.subtitle': 'Inicia sesión para acceder a tu panel',
    'auth.email': 'Correo',
    'auth.password': 'Contraseña',
    'auth.signin': 'Iniciar Sesión',
    'auth.signingin': 'Iniciando Sesión...',
    
    // User Info
    'user.loggedinas': 'Conectado como',
    'user.role': 'Rol',
    
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.success': 'Éxito',
    'common.error': 'Error',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('crm-language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('crm-language', newLanguage);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};