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
    'nav.general': 'General',
    'nav.funnels': 'Funnels',
    'nav.apiKeys': 'API Keys',
    
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
    'common.create': 'Create',
    'common.creating': 'Creating...',
    'common.delete': 'Delete',
    'common.retry': 'Retry',
    
    // Dashboard Common
    'dashboard.title.optomyze': 'Optomyze Metrics Dashboard',
    'dashboard.title.meta': 'Meta Ads Dashboard',
    'dashboard.title.google-ads': 'Google Ads Dashboard',
    'dashboard.title.google-analytics': 'Google Analytics Dashboard',
    'dashboard.subtitle.optomyze': 'Real-time insights into your lead generation and conversion performance',
    'dashboard.subtitle.meta': 'Track your Facebook and Instagram advertising performance',
    'dashboard.subtitle.google-ads': 'Monitor your Google Ads campaigns and keyword performance',
    'dashboard.subtitle.google-analytics': 'Comprehensive website performance and user behavior insights',
    
    // Optomyze Metrics
    'metrics.total-leads': 'Total Leads',
    'metrics.leads-in-service': 'Leads in Service',
    'metrics.lost-leads': 'Lost Leads',
    'metrics.converted-sales': 'Converted Sales',
    'metrics.conversion-rate': 'Conversion Rate',
    'metrics.avg-conversion-time': 'Avg Conversion Time',
    'metrics.avg-sale-value': 'Avg Sale Value',
    'metrics.monthly-roi': 'Monthly ROI',
    'metrics.sales-funnel': 'Sales Funnel',
    'metrics.lead-sources': 'Lead Sources',
    'metrics.monthly-lead-flow': 'Monthly Lead Flow',
    'metrics.funnel.leads': 'Leads',
    'metrics.funnel.qualified': 'Qualified',
    'metrics.funnel.opportunities': 'Opportunities',
    'metrics.funnel.sales': 'Sales',
    
    // Meta Ads
    'meta.total-spend': 'Total Spend',
    'meta.impressions': 'Impressions',
    'meta.clicks': 'Clicks',
    'meta.ctr': 'CTR',
    'meta.cpc': 'CPC',
    'meta.conversions': 'Conversions',
    'meta.cpa': 'CPA',
    'meta.roas': 'ROAS',
    'meta.campaign-performance': 'Campaign Performance',
    'meta.audience-demographics': 'Audience Demographics',
    'meta.daily-spend-trend': 'Daily Spend Trend (30 Days)',
    'meta.device-performance': 'Device Performance',
    'meta.this-month': 'This month',
    
    // Google Ads
    'google-ads.total-spend': 'Total Spend',
    'google-ads.impressions': 'Impressions',
    'google-ads.clicks': 'Clicks',
    'google-ads.ctr': 'CTR',
    'google-ads.avg-cpc': 'Avg CPC',
    'google-ads.conversions': 'Conversions',
    'google-ads.cpa': 'CPA',
    'google-ads.quality-score': 'Quality Score Avg',
    'google-ads.campaign-roi': 'Campaign ROI',
    'google-ads.conversion-rate-by-hour': 'Conversion Rate by Hour',
    'google-ads.top-keywords': 'Top Performing Keywords',
    'google-ads.geographic-performance': 'Geographic Performance',
    'google-ads.keyword': 'Keyword',
    'google-ads.sessions': 'Sessions',
    'google-ads.rate': 'Rate',
    'google-ads.this-month': 'This month',
    
    // Google Analytics
    'analytics.sessions': 'Sessions',
    'analytics.users': 'Users',
    'analytics.page-views': 'Page Views',
    'analytics.avg-session-duration': 'Avg Session Duration',
    'analytics.bounce-rate': 'Bounce Rate',
    'analytics.goal-completions': 'Goal Completions',
    'analytics.conversion-rate': 'Conversion Rate',
    'analytics.pages-per-session': 'Pages per Session',
    'analytics.traffic-sources': 'Traffic Sources',
    'analytics.user-flow': 'User Flow',
    'analytics.monthly-sessions-users': 'Monthly Sessions & Users',
    'analytics.top-landing-pages': 'Top Landing Pages',
    'analytics.flow.landing-page': 'Landing Page',
    'analytics.flow.product-view': 'Product View',
    'analytics.flow.pricing-page': 'Pricing Page',
    'analytics.flow.contact-form': 'Contact Form',
    'analytics.flow.conversion': 'Conversion',
    
    // Funnels
    'funnels.title': 'Sales Funnels',
    'funnels.breadcrumb': 'Settings / Funnels',
    'funnels.new-funnel': 'New Funnel',
    'funnels.no-funnels': 'No funnels created yet',
    'funnels.no-funnels-subtitle': 'Create your first funnel to start managing your sales process',
    'funnels.create-funnel': 'Create Funnel',
    'funnels.name': 'Funnel Name',
    'funnels.name-placeholder': 'Enter funnel name...',
    'funnels.description': 'Description',
    'funnels.description-placeholder': 'Describe the purpose of this funnel...',
    'funnels.name-required': 'Funnel name is required',
    'funnels.description-required': 'Description is required',
    'funnels.leads': 'leads',
    'funnels.active': 'Active',
    'funnels.settings': 'Funnel Settings',
    'funnels.delete': 'Delete Funnel',
    'funnels.delete-confirm': 'Are you sure you want to delete',
    'funnels.delete-warning': 'This action cannot be undone.',
    'funnels.cancel': 'Cancel',
    'funnels.create-new': 'Create New Funnel',
    'funnels.success-create': 'Funnel created successfully',
    'funnels.config-coming-soon': 'Funnel configuration page is under development.',
    'funnels.success-delete': 'Funnel deleted successfully.',
    'funnels.error-delete': 'Failed to delete funnel. Please try again.',
    'funnels.error-load': 'Failed to load funnels. Please try again.',
    'funnels.network-error': 'Network error. Please check your connection and try again.',
    'funnels.server-error': 'Server error. Please contact support if the problem persists.',
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
    'nav.general': 'Geral',
    'nav.funnels': 'Funis',
    'nav.apiKeys': 'Chaves API',
    
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
    'common.create': 'Criar',
    'common.creating': 'Criando...',
    'common.delete': 'Excluir',
    'common.retry': 'Tentar Novamente',
    
    // Dashboard Common
    'dashboard.title.optomyze': 'Painel de Métricas Optomyze',
    'dashboard.title.meta': 'Painel Meta Ads',
    'dashboard.title.google-ads': 'Painel Google Ads',
    'dashboard.title.google-analytics': 'Painel Google Analytics',
    'dashboard.subtitle.optomyze': 'Insights em tempo real sobre geração de leads e performance de conversão',
    'dashboard.subtitle.meta': 'Acompanhe o desempenho da sua publicidade no Facebook e Instagram',
    'dashboard.subtitle.google-ads': 'Monitore suas campanhas do Google Ads e performance de palavras-chave',
    'dashboard.subtitle.google-analytics': 'Insights abrangentes de performance do site e comportamento do usuário',
    
    // Optomyze Metrics
    'metrics.total-leads': 'Total de Leads',
    'metrics.leads-in-service': 'Leads em Atendimento',
    'metrics.lost-leads': 'Leads Perdidos',
    'metrics.converted-sales': 'Vendas Convertidas',
    'metrics.conversion-rate': 'Taxa de Conversão',
    'metrics.avg-conversion-time': 'Tempo Médio de Conversão',
    'metrics.avg-sale-value': 'Valor Médio de Venda',
    'metrics.monthly-roi': 'ROI Mensal',
    'metrics.sales-funnel': 'Funil de Vendas',
    'metrics.lead-sources': 'Fontes de Leads',
    'metrics.monthly-lead-flow': 'Fluxo Mensal de Leads',
    'metrics.funnel.leads': 'Leads',
    'metrics.funnel.qualified': 'Qualificados',
    'metrics.funnel.opportunities': 'Oportunidades',
    'metrics.funnel.sales': 'Vendas',
    
    // Meta Ads
    'meta.total-spend': 'Gasto Total',
    'meta.impressions': 'Impressões',
    'meta.clicks': 'Cliques',
    'meta.ctr': 'CTR',
    'meta.cpc': 'CPC',
    'meta.conversions': 'Conversões',
    'meta.cpa': 'CPA',
    'meta.roas': 'ROAS',
    'meta.campaign-performance': 'Performance das Campanhas',
    'meta.audience-demographics': 'Demografia da Audiência',
    'meta.daily-spend-trend': 'Tendência de Gasto Diário (30 Dias)',
    'meta.device-performance': 'Performance por Dispositivo',
    'meta.this-month': 'Este mês',
    
    // Google Ads
    'google-ads.total-spend': 'Gasto Total',
    'google-ads.impressions': 'Impressões',
    'google-ads.clicks': 'Cliques',
    'google-ads.ctr': 'CTR',
    'google-ads.avg-cpc': 'CPC Médio',
    'google-ads.conversions': 'Conversões',
    'google-ads.cpa': 'CPA',
    'google-ads.quality-score': 'Nota de Qualidade Média',
    'google-ads.campaign-roi': 'ROI das Campanhas',
    'google-ads.conversion-rate-by-hour': 'Taxa de Conversão por Hora',
    'google-ads.top-keywords': 'Palavras-chave de Melhor Performance',
    'google-ads.geographic-performance': 'Performance Geográfica',
    'google-ads.keyword': 'Palavra-chave',
    'google-ads.sessions': 'Sessões',
    'google-ads.rate': 'Taxa',
    'google-ads.this-month': 'Este mês',
    
    // Google Analytics
    'analytics.sessions': 'Sessões',
    'analytics.users': 'Usuários',
    'analytics.page-views': 'Visualizações de Página',
    'analytics.avg-session-duration': 'Duração Média da Sessão',
    'analytics.bounce-rate': 'Taxa de Rejeição',
    'analytics.goal-completions': 'Conclusões de Meta',
    'analytics.conversion-rate': 'Taxa de Conversão',
    'analytics.pages-per-session': 'Páginas por Sessão',
    'analytics.traffic-sources': 'Fontes de Tráfego',
    'analytics.user-flow': 'Fluxo do Usuário',
    'analytics.monthly-sessions-users': 'Sessões e Usuários Mensais',
    'analytics.top-landing-pages': 'Principais Páginas de Entrada',
    'analytics.flow.landing-page': 'Página de Entrada',
    'analytics.flow.product-view': 'Visualização do Produto',
    'analytics.flow.pricing-page': 'Página de Preços',
    'analytics.flow.contact-form': 'Formulário de Contato',
    'analytics.flow.conversion': 'Conversão',
    
    // Funnels
    'funnels.title': 'Funis de Vendas',
    'funnels.breadcrumb': 'Configurações / Funis',
    'funnels.new-funnel': 'Novo Funil',
    'funnels.no-funnels': 'Nenhum funil criado ainda',
    'funnels.no-funnels-subtitle': 'Crie seu primeiro funil para começar a gerenciar seu processo de vendas',
    'funnels.create-funnel': 'Criar Funil',
    'funnels.name': 'Nome do Funil',
    'funnels.name-placeholder': 'Digite o nome do funil...',
    'funnels.description': 'Descrição',
    'funnels.description-placeholder': 'Descreva o propósito deste funil...',
    'funnels.name-required': 'Nome do funil é obrigatório',
    'funnels.description-required': 'Descrição é obrigatória',
    'funnels.leads': 'leads',
    'funnels.active': 'Ativo',
    'funnels.settings': 'Configurações do Funil',
    'funnels.delete': 'Excluir Funil',
    'funnels.delete-confirm': 'Tem certeza de que deseja excluir',
    'funnels.delete-warning': 'Esta ação não pode ser desfeita.',
    'funnels.cancel': 'Cancelar',
    'funnels.create-new': 'Criar Novo Funil',
    'funnels.success-create': 'Funil criado com sucesso',
    'funnels.config-coming-soon': 'Página de configuração do funil está em desenvolvimento.',
    'funnels.success-delete': 'Funil excluído com sucesso.',
    'funnels.error-delete': 'Falha ao excluir funil. Tente novamente.',
    'funnels.error-load': 'Falha ao carregar funis. Tente novamente.',
    'funnels.network-error': 'Erro de rede. Verifique sua conexão e tente novamente.',
    'funnels.server-error': 'Erro do servidor. Entre em contato com o suporte se o problema persistir.',
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
    'nav.general': 'Allgemein',
    'nav.funnels': 'Verkaufstrichter',
    'nav.apiKeys': 'API-Schlüssel',
    
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
    'common.create': 'Erstellen',
    'common.creating': 'Erstelle...',
    'common.delete': 'Löschen',
    'common.retry': 'Wiederholen',
    
    // Dashboard Common
    'dashboard.title.optomyze': 'Optomyze Metriken Dashboard',
    'dashboard.title.meta': 'Meta Ads Dashboard',
    'dashboard.title.google-ads': 'Google Ads Dashboard',
    'dashboard.title.google-analytics': 'Google Analytics Dashboard',
    'dashboard.subtitle.optomyze': 'Echtzeiteinblicke in Ihre Lead-Generierung und Conversion-Performance',
    'dashboard.subtitle.meta': 'Verfolgen Sie Ihre Facebook- und Instagram-Werbeleistung',
    'dashboard.subtitle.google-ads': 'Überwachen Sie Ihre Google Ads-Kampagnen und Keyword-Performance',
    'dashboard.subtitle.google-analytics': 'Umfassende Website-Performance und Nutzerverhalten-Insights',
    
    // Optomyze Metrics
    'metrics.total-leads': 'Gesamt Leads',
    'metrics.leads-in-service': 'Leads in Bearbeitung',
    'metrics.lost-leads': 'Verlorene Leads',
    'metrics.converted-sales': 'Konvertierte Verkäufe',
    'metrics.conversion-rate': 'Conversion-Rate',
    'metrics.avg-conversion-time': 'Durchschn. Conversion-Zeit',
    'metrics.avg-sale-value': 'Durchschn. Verkaufswert',
    'metrics.monthly-roi': 'Monatlicher ROI',
    'metrics.sales-funnel': 'Verkaufstrichter',
    'metrics.lead-sources': 'Lead-Quellen',
    'metrics.monthly-lead-flow': 'Monatlicher Lead-Fluss',
    'metrics.funnel.leads': 'Leads',
    'metrics.funnel.qualified': 'Qualifiziert',
    'metrics.funnel.opportunities': 'Möglichkeiten',
    'metrics.funnel.sales': 'Verkäufe',
    
    // Meta Ads
    'meta.total-spend': 'Gesamtausgaben',
    'meta.impressions': 'Impressionen',
    'meta.clicks': 'Klicks',
    'meta.ctr': 'CTR',
    'meta.cpc': 'CPC',
    'meta.conversions': 'Conversions',
    'meta.cpa': 'CPA',
    'meta.roas': 'ROAS',
    'meta.campaign-performance': 'Kampagnen-Performance',
    'meta.audience-demographics': 'Zielgruppen-Demografie',
    'meta.daily-spend-trend': 'Täglicher Ausgaben-Trend (30 Tage)',
    'meta.device-performance': 'Geräte-Performance',
    'meta.this-month': 'Diesen Monat',
    
    // Google Ads
    'google-ads.total-spend': 'Gesamtausgaben',
    'google-ads.impressions': 'Impressionen',
    'google-ads.clicks': 'Klicks',
    'google-ads.ctr': 'CTR',
    'google-ads.avg-cpc': 'Durchschn. CPC',
    'google-ads.conversions': 'Conversions',
    'google-ads.cpa': 'CPA',
    'google-ads.quality-score': 'Durchschn. Qualitätsfaktor',
    'google-ads.campaign-roi': 'Kampagnen-ROI',
    'google-ads.conversion-rate-by-hour': 'Conversion-Rate nach Stunde',
    'google-ads.top-keywords': 'Top-Performance Keywords',
    'google-ads.geographic-performance': 'Geografische Performance',
    'google-ads.keyword': 'Keyword',
    'google-ads.sessions': 'Sitzungen',
    'google-ads.rate': 'Rate',
    'google-ads.this-month': 'Diesen Monat',
    
    // Google Analytics
    'analytics.sessions': 'Sitzungen',
    'analytics.users': 'Nutzer',
    'analytics.page-views': 'Seitenaufrufe',
    'analytics.avg-session-duration': 'Durchschn. Sitzungsdauer',
    'analytics.bounce-rate': 'Absprungrate',
    'analytics.goal-completions': 'Zielabschlüsse',
    'analytics.conversion-rate': 'Conversion-Rate',
    'analytics.pages-per-session': 'Seiten pro Sitzung',
    'analytics.traffic-sources': 'Traffic-Quellen',
    'analytics.user-flow': 'Nutzer-Flow',
    'analytics.monthly-sessions-users': 'Monatliche Sitzungen & Nutzer',
    'analytics.top-landing-pages': 'Top Landing Pages',
    'analytics.flow.landing-page': 'Landing Page',
    'analytics.flow.product-view': 'Produktansicht',
    'analytics.flow.pricing-page': 'Preisseite',
    'analytics.flow.contact-form': 'Kontaktformular',
    'analytics.flow.conversion': 'Conversion',
    
    // Funnels
    'funnels.title': 'Verkaufstrichter',
    'funnels.breadcrumb': 'Einstellungen / Verkaufstrichter',
    'funnels.new-funnel': 'Neuer Trichter',
    'funnels.no-funnels': 'Noch keine Trichter erstellt',
    'funnels.no-funnels-subtitle': 'Erstellen Sie Ihren ersten Trichter, um Ihren Verkaufsprozess zu verwalten',
    'funnels.create-funnel': 'Trichter Erstellen',
    'funnels.name': 'Trichter Name',
    'funnels.name-placeholder': 'Trichter Name eingeben...',
    'funnels.description': 'Beschreibung',
    'funnels.description-placeholder': 'Beschreiben Sie den Zweck dieses Trichters...',
    'funnels.name-required': 'Trichter Name ist erforderlich',
    'funnels.description-required': 'Beschreibung ist erforderlich',
    'funnels.leads': 'Leads',
    'funnels.active': 'Aktiv',
    'funnels.settings': 'Trichter Einstellungen',
    'funnels.delete': 'Trichter Löschen',
    'funnels.delete-confirm': 'Sind Sie sicher, dass Sie löschen möchten',
    'funnels.delete-warning': 'Diese Aktion kann nicht rückgängig gemacht werden.',
    'funnels.cancel': 'Abbrechen',
    'funnels.create-new': 'Neuen Trichter Erstellen',
    'funnels.success-create': 'Trichter erfolgreich erstellt',
    'funnels.config-coming-soon': 'Trichter-Konfigurationsseite ist in Entwicklung.',
    'funnels.success-delete': 'Trichter erfolgreich gelöscht.',
    'funnels.error-delete': 'Fehler beim Löschen des Trichters. Bitte versuchen Sie es erneut.',
    'funnels.error-load': 'Fehler beim Laden der Trichter. Bitte versuchen Sie es erneut.',
    'funnels.network-error': 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    'funnels.server-error': 'Serverfehler. Bitte kontaktieren Sie den Support, wenn das Problem weiterhin besteht.',
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
    'nav.general': 'General',
    'nav.funnels': 'Embudos',
    'nav.apiKeys': 'Claves API',
    
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
    'common.create': 'Crear',
    'common.creating': 'Creando...',
    'common.delete': 'Eliminar',
    'common.retry': 'Reintentar',
    
    // Dashboard Common
    'dashboard.title.optomyze': 'Panel de Métricas Optomyze',
    'dashboard.title.meta': 'Panel Meta Ads',
    'dashboard.title.google-ads': 'Panel Google Ads',
    'dashboard.title.google-analytics': 'Panel Google Analytics',
    'dashboard.subtitle.optomyze': 'Insights en tiempo real sobre generación de leads y rendimiento de conversión',
    'dashboard.subtitle.meta': 'Rastrea el rendimiento de tu publicidad en Facebook e Instagram',
    'dashboard.subtitle.google-ads': 'Monitorea tus campañas de Google Ads y rendimiento de palabras clave',
    'dashboard.subtitle.google-analytics': 'Insights completos de rendimiento del sitio web y comportamiento del usuario',
    
    // Optomyze Metrics
    'metrics.total-leads': 'Total de Leads',
    'metrics.leads-in-service': 'Leads en Servicio',
    'metrics.lost-leads': 'Leads Perdidos',
    'metrics.converted-sales': 'Ventas Convertidas',
    'metrics.conversion-rate': 'Tasa de Conversión',
    'metrics.avg-conversion-time': 'Tiempo Promedio de Conversión',
    'metrics.avg-sale-value': 'Valor Promedio de Venta',
    'metrics.monthly-roi': 'ROI Mensual',
    'metrics.sales-funnel': 'Embudo de Ventas',
    'metrics.lead-sources': 'Fuentes de Leads',
    'metrics.monthly-lead-flow': 'Flujo Mensual de Leads',
    'metrics.funnel.leads': 'Leads',
    'metrics.funnel.qualified': 'Calificados',
    'metrics.funnel.opportunities': 'Oportunidades',
    'metrics.funnel.sales': 'Ventas',
    
    // Meta Ads
    'meta.total-spend': 'Gasto Total',
    'meta.impressions': 'Impresiones',
    'meta.clicks': 'Clics',
    'meta.ctr': 'CTR',
    'meta.cpc': 'CPC',
    'meta.conversions': 'Conversiones',
    'meta.cpa': 'CPA',
    'meta.roas': 'ROAS',
    'meta.campaign-performance': 'Rendimiento de Campañas',
    'meta.audience-demographics': 'Demografía de Audiencia',
    'meta.daily-spend-trend': 'Tendencia de Gasto Diario (30 Días)',
    'meta.device-performance': 'Rendimiento por Dispositivo',
    'meta.this-month': 'Este mes',
    
    // Google Ads
    'google-ads.total-spend': 'Gasto Total',
    'google-ads.impressions': 'Impresiones',
    'google-ads.clicks': 'Clics',
    'google-ads.ctr': 'CTR',
    'google-ads.avg-cpc': 'CPC Promedio',
    'google-ads.conversions': 'Conversiones',
    'google-ads.cpa': 'CPA',
    'google-ads.quality-score': 'Promedio de Puntuación de Calidad',
    'google-ads.campaign-roi': 'ROI de Campañas',
    'google-ads.conversion-rate-by-hour': 'Tasa de Conversión por Hora',
    'google-ads.top-keywords': 'Palabras Clave de Mejor Rendimiento',
    'google-ads.geographic-performance': 'Rendimiento Geográfico',
    'google-ads.keyword': 'Palabra Clave',
    'google-ads.sessions': 'Sesiones',
    'google-ads.rate': 'Tasa',
    'google-ads.this-month': 'Este mes',
    
    // Google Analytics
    'analytics.sessions': 'Sesiones',
    'analytics.users': 'Usuarios',
    'analytics.page-views': 'Vistas de Página',
    'analytics.avg-session-duration': 'Duración Promedio de Sesión',
    'analytics.bounce-rate': 'Tasa de Rebote',
    'analytics.goal-completions': 'Completaciones de Objetivo',
    'analytics.conversion-rate': 'Tasa de Conversión',
    'analytics.pages-per-session': 'Páginas por Sesión',
    'analytics.traffic-sources': 'Fuentes de Tráfico',
    'analytics.user-flow': 'Flujo de Usuario',
    'analytics.monthly-sessions-users': 'Sesiones y Usuarios Mensuales',
    'analytics.top-landing-pages': 'Principales Páginas de Aterrizaje',
    'analytics.flow.landing-page': 'Página de Aterrizaje',
    'analytics.flow.product-view': 'Vista del Producto',
    'analytics.flow.pricing-page': 'Página de Precios',
    'analytics.flow.contact-form': 'Formulario de Contacto',
    'analytics.flow.conversion': 'Conversión',
    
    // Funnels
    'funnels.title': 'Embudos de Ventas',
    'funnels.breadcrumb': 'Configuración / Embudos',
    'funnels.new-funnel': 'Nuevo Embudo',
    'funnels.no-funnels': 'Aún no se han creado embudos',
    'funnels.no-funnels-subtitle': 'Crea tu primer embudo para comenzar a gestionar tu proceso de ventas',
    'funnels.create-funnel': 'Crear Embudo',
    'funnels.name': 'Nombre del Embudo',
    'funnels.name-placeholder': 'Ingresa el nombre del embudo...',
    'funnels.description': 'Descripción',
    'funnels.description-placeholder': 'Describe el propósito de este embudo...',
    'funnels.name-required': 'El nombre del embudo es requerido',
    'funnels.description-required': 'La descripción es requerida',
    'funnels.leads': 'leads',
    'funnels.active': 'Activo',
    'funnels.settings': 'Configuración del Embudo',
    'funnels.delete': 'Eliminar Embudo',
    'funnels.delete-confirm': '¿Estás seguro de que quieres eliminar',
    'funnels.delete-warning': 'Esta acción no se puede deshacer.',
    'funnels.cancel': 'Cancelar',
    'funnels.create-new': 'Crear Nuevo Embudo',
    'funnels.success-create': 'Embudo creado exitosamente',
    'funnels.config-coming-soon': 'La página de configuración del embudo está en desarrollo.',
    'funnels.success-delete': 'Embudo eliminado exitosamente.',
    'funnels.error-delete': 'Error al eliminar embudo. Inténtalo de nuevo.',
    'funnels.error-load': 'Error al cargar embudos. Inténtalo de nuevo.',
    'funnels.network-error': 'Error de red. Verifica tu conexión e inténtalo de nuevo.',
    'funnels.server-error': 'Error del servidor. Contacta soporte si el problema persiste.',
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