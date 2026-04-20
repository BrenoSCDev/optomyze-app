/**
 * TOP HEADER COMPONENT
 * 
 * A fixed top header with:
 * - Left: Logo/App name
 * - Center: Global search bar with lead quick search (+ nav items in header mode)
 * - Right: Notification bell + User menu
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, LogOut, UserCircle, ChevronDown, Loader2, Check, Menu,
  BarChart3, Users, Settings, Database, Plug, MessageCircle, CalendarDays, Package,
  Headphones, PieChart, Building, ClipboardList, Handshake, ListTodo, Tag, Key, Shield, UsersRound, Bot, TicketPlus
} from 'lucide-react';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import DealPreviewModal from '@/components/deals/DealPreviewModal';
import ProductFormModal from '@/components/products/ProductFormModal';
import { getProduct, type Product } from '@/services/productApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMenuOrder } from '@/contexts/MenuOrderContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { getStorageUrl } from '@/lib/constants';
import { usePrivateFile } from '@/hooks/usePrivateFile';
import SEARCH_TARGETS, { globalSearch, UnifiedSearchResult, SearchTargetId, getDefaultSearchTarget } from '@/lib/searchConfig';
import optomyzeLogo from '@/assets/optomyze.png';
import optomyzeLogoLight from '@/assets/optomyze-light.png';
import OptoIcon from '@/assets/opto-icon.png';
import OptoIconLight from '@/assets/opto-icon-light.png';
import { getEcho } from '@/services/echo';
import { IoFunnelOutline } from 'react-icons/io5';
import { FaWhatsapp } from 'react-icons/fa6';
import { SiGoogleanalytics, SiGoogleads } from 'react-icons/si';
import { FaMeta } from 'react-icons/fa6';
import { RiAppsFill } from 'react-icons/ri';
import { BsDatabaseFillGear } from 'react-icons/bs';
import { VscSettings } from 'react-icons/vsc';
import { MdBusinessCenter, MdCurrencyExchange } from 'react-icons/md';

interface TopHeaderProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle?: () => void;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  headerNavMode?: boolean;
}

const TopHeader = ({ sidebarCollapsed, onMobileMenuToggle, activeSection, onSectionChange, headerNavMode = false }: TopHeaderProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTarget, setSearchTarget] = useState<SearchTargetId>(getDefaultSearchTarget);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user, funnels, logout } = useAuth();
  const { t } = useLanguage();
  const userProfilePicUrl = usePrivateFile(user?.profile_pic);
  const { menuOrder } = useMenuOrder();
  const { mode } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  // Logo swaps with header background:
  // - Header nav mode → midnight-blue bg → white logo
  // - Sidebar mode (light theme) → card bg → dark logo
  // - Sidebar mode (dark theme) → dark bg → white logo
  const headerLogo = headerNavMode || mode === 'dark' ? optomyzeLogo : optomyzeLogoLight;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-read search target whenever the window regains focus (user may have changed it in Preferences)
  useEffect(() => {
    const sync = () => setSearchTarget(getDefaultSearchTarget());
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    // Also poll periodically for same-tab changes
    const interval = setInterval(sync, 2000);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      clearInterval(interval);
    };
  }, []);

  const currentSearchConfig = SEARCH_TARGETS[searchTarget];

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await globalSearch(searchTarget, query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchTarget]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(() => performSearch(value), 400);
  };

  const handleResultSelect = (result: UnifiedSearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);

    switch (searchTarget) {
      case 'leads':
        setSelectedLeadId(String(result.id));
        setIsLeadModalOpen(true);
        break;
      case 'deals':
        setSelectedDealId(String(result.id));
        setIsDealModalOpen(true);
        break;
      case 'products':
        // Fetch full product and open edit modal
        getProduct(result.id).then((product) => {
          setSelectedProduct(product);
          setIsProductModalOpen(true);
        }).catch(() => {
          navigate(`/?section=manage-products`);
        });
        break;
      case 'tasks':
        console.log('Task selected:', result);
        break;
      case 'users':
        console.log('User selected:', result);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;
    const connector = echo.connector as { pusher?: { connection?: { bind: (event: string, callback: () => void) => void; unbind: (event: string, callback: () => void) => void } } };
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    connector.pusher?.connection?.bind('connected', handleConnected);
    connector.pusher?.connection?.bind('disconnected', handleDisconnected);
    return () => {
      connector.pusher?.connection?.unbind('connected', handleConnected);
      connector.pusher?.connection?.unbind('disconnected', handleDisconnected);
    };
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setNotificationDropdownOpen(false);
    if (notif.type === 'lead_created') {
      setSelectedLeadId(String(notif.lead.id));
      setIsLeadModalOpen(true);
    } else if (notif.type === 'private_message') {
      navigate('/?section=optomyze-inbox');
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t('header.time.just-now');
    if (diffMins < 60) return t('header.time.minutes-ago').replace('{count}', String(diffMins));
    if (diffHours < 24) return t('header.time.hours-ago').replace('{count}', String(diffHours));
    if (diffDays < 7) return t('header.time.days-ago').replace('{count}', String(diffDays));
    return date.toLocaleDateString();
  };

  const handleNavClick = (sectionId: string) => {
    if (onSectionChange) {
      onSectionChange(sectionId);
    } else {
      navigate(`/?section=${sectionId}`);
    }
  };

  // Build header nav items with submenus
  const leadsItems = funnels?.filter(f => f.is_active && f.type === 'sale').map(f => ({
    id: f.id.toString(), label: f.name, path: `/leads/${f.id}`
  })) || [];

  const dealsItems = funnels?.filter(f => f.is_active && f.type === 'deal').map(f => ({
    id: f.id.toString(), label: f.name, path: `/deals/${f.id}`
  })) || [];

  // Section config for header nav dropdowns
  const sectionConfig: Record<string, {
    icon: React.ReactNode;
    labelKey: string;
    children: { id: string; label: string; path?: string }[];
  }> = useMemo(() => ({
    dashboard: {
      icon: <BarChart3 className="h-3.5 w-3.5" />,
      labelKey: 'nav.dashboard',
      children: [
        { id: 'optomyze-metrics', label: t('dashboard.optomyze-metrics') },
        { id: 'plan-usage', label: t('dashboard.plan-usage') },
        { id: 'meta-ads', label: t('dashboard.meta-ads') },
        { id: 'google-ads', label: t('dashboard.google-ads') },
        { id: 'google-analytics', label: t('dashboard.google-analytics') },
      ],
    },
    leads: {
      icon: <Users className="h-3.5 w-3.5" />,
      labelKey: 'nav.leads',
      children: leadsItems,
    },
    deals: {
      icon: <MdCurrencyExchange className="h-3.5 w-3.5" />,
      labelKey: 'nav.deals',
      children: dealsItems,
    },
    settings: {
      icon: <Settings className="h-3.5 w-3.5" />,
      labelKey: 'nav.settings',
      children: [
        { id: 'crm-panel', label: t('nav.crm-panel') },
        { id: 'funnels', label: t('nav.funnels') },
        { id: 'companies', label: t('nav.companies') },
        { id: 'tags', label: t('nav.tags') },
        { id: 'preferences', label: t('nav.preferences') },
      ],
    },
    reports: {
      icon: <PieChart className="h-3.5 w-3.5" />,
      labelKey: 'nav.reports',
      children: [
        { id: 'lead-activity', label: t('reports.lead-activity') },
        { id: 'deal-activity', label: t('reports.deal-activity') },
        { id: 'report-tasks', label: t('reports.tasks') },
      ],
    },
    integrations: {
      icon: <Plug className="h-3.5 w-3.5" />,
      labelKey: 'nav.integrations',
      children: [
        { id: 'integrations', label: 'Apps' },
        { id: 'integration-panel', label: t('integrations.panel.menu-title') },
      ],
    },
    api: {
      icon: <Database className="h-3.5 w-3.5" />,
      labelKey: 'nav.api',
      children: [
        { id: 'api-tokens', label: 'API Tokens' },
        { id: 'api-setup', label: 'API Setup' },
        { id: 'api-playground', label: t('api.playground.title') },
      ],
    },
    organization: {
      icon: <Building className="h-3.5 w-3.5" />,
      labelKey: 'nav.organization',
      children: [
        { id: 'manage-users', label: t('organization.users') },
        { id: 'manage-teams', label: t('organization.teams') },
      ],
    },
    chat: {
      icon: <MessageCircle className="h-3.5 w-3.5" />,
      labelKey: 'nav.chat',
      children: [
        { id: 'whatsapp-inbox', label: 'WhatsApp Inbox' },
        { id: 'optomyze-inbox', label: 'Optomyze Inbox' },
      ],
    },
    calendars: {
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      labelKey: 'nav.calendars',
      children: [
        { id: 'optomyze-calendar', label: t('calendar.optomyze.title') },
      ],
    },
    products: {
      icon: <Package className="h-3.5 w-3.5" />,
      labelKey: 'nav.products',
      children: [
        { id: 'manage-products', label: t('products.manage') },
        { id: 'product-categories', label: 'Product Categories' },
      ],
    },
    support: {
      icon: <Headphones className="h-3.5 w-3.5" />,
      labelKey: 'nav.support',
      children: [
        { id: 'open-ticket', label: t('support.open-ticket') },
        { id: 'talk-to-optus', label: t('support.talk-to-optus') },
      ],
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [t, funnels]);

  // Check if a section contains the active item
  const sectionContainsActive = (sectionId: string) => {
    const config = sectionConfig[sectionId];
    if (!config) return false;
    return config.children.some(c => c.id === activeSection);
  };

  return (
    <>
    <motion.header
      className="fixed top-0 left-0 w-full z-50 h-16 backdrop-blur-md flex items-center px-4 sm:px-6 rounded-none"
      style={{
        background: headerNavMode ? 'hsl(var(--sidebar-bg))' : 'hsl(var(--card))',
        borderBottom: headerNavMode
          ? '1px solid hsl(var(--sidebar-border))'
          : '1px solid hsl(var(--border))',
        color: headerNavMode
          ? 'hsl(var(--sidebar-text-active))'
          : 'hsl(var(--card-foreground))',
        transition: 'background 0.4s ease, border-color 0.4s ease, color 0.4s ease',
      }}
      initial={false}
      animate={{ 
        left: headerNavMode ? 0 : (isMobile ? 0 : (sidebarCollapsed ? 64 : 256)),
        width: headerNavMode ? '100%' : (isMobile ? '100%' : (sidebarCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 256px)'))
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo: always show in header mode, only show when sidebar collapsed otherwise */}
        {headerNavMode ? (
          <img src={headerLogo} alt="Optomyze" className="h-6 hidden md:block" />
        ) : (
          <AnimatePresence>
            {sidebarCollapsed && (
              <motion.img
                src={headerLogo}
                alt="Optomyze"
                className="h-6 hidden md:block"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Header Navigation Bar (only in header mode on desktop) */}
      {headerNavMode && !isMobile && (
        <nav className="hidden md:flex items-center gap-0.5 ml-4 overflow-x-auto scrollbar-thin flex-1 min-w-0">
          {menuOrder.map((sectionId) => {
            const config = sectionConfig[sectionId];
            if (!config) return null;
            // Role gating
            if (sectionId === 'organization' && user?.role === 'agent') return null;

            const isActive = sectionContainsActive(sectionId);
            const hasChildren = config.children.length > 0;

            if (hasChildren) {
              return (
                <DropdownMenu key={sectionId}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        isActive
                          ? 'text-foreground bg-white/[0.08]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                      }`}
                    >
                      {config.icon}
                      <span>{t(config.labelKey)}</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="min-w-[160px] bg-background/95 backdrop-blur-md border border-white/20"
                  >
                    {config.children.map((child) => (
                      <DropdownMenuItem
                        key={child.id}
                        className={`cursor-pointer text-xs ${
                          activeSection === child.id ? 'bg-white/[0.08] text-foreground' : ''
                        }`}
                        onClick={() => {
                          if (child.path) {
                            navigate(child.path);
                          } else {
                            handleNavClick(child.id);
                          }
                        }}
                      >
                        {child.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            return null;
          })}
        </nav>
      )}

      {/* Center Section - Search Bar (only when NOT in header mode, or on smaller screens) */}
      {!headerNavMode && (
        <div className="flex-1 flex justify-center max-w-xl mx-4">
          <div ref={searchContainerRef} className="hidden md:flex relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            <Input
              type="text"
              placeholder={`Search ${currentSearchConfig.labelKey}...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 3 && searchResults.length > 0 && setShowResults(true)}
              className="w-full pl-10 pr-10 bg-background border-border focus:border-primary/50 focus:ring-primary/20"
            />
            
            <AnimatePresence>
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                >
                  {searchResults.map((result) => {
                    const TargetIcon = currentSearchConfig.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <TargetIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground truncate block">{result.subtitle}</span>}
                        </div>
                        {result.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            result.badge.variant === 'success' ? 'bg-green-500/20 text-green-400' :
                            result.badge.variant === 'destructive' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>{result.badge.label}</span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showResults && searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-white/20 rounded-lg shadow-xl z-50 p-4"
                >
                  <p className="text-sm text-muted-foreground text-center">
                    {t('header.no-results')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* In header mode, add a compact search */}
      {headerNavMode && (
        <div className="hidden md:flex items-center ml-auto mr-2">
          <div ref={searchContainerRef} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
            )}
            <Input
              type="text"
              placeholder={`Search ${currentSearchConfig.labelKey}...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length >= 3 && searchResults.length > 0 && setShowResults(true)}
              className="w-48 h-8 pl-8 pr-8 text-xs bg-background/20 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
            />
            <AnimatePresence>
              {showResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-background border border-white/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
                >
                  {searchResults.map((result) => {
                    const TargetIcon = currentSearchConfig.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <TargetIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{result.title}</span>
                          {result.subtitle && <span className="text-xs text-muted-foreground truncate block">{result.subtitle}</span>}
                        </div>
                        {result.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            result.badge.variant === 'success' ? 'bg-green-500/20 text-green-400' :
                            result.badge.variant === 'destructive' ? 'bg-destructive/20 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>{result.badge.label}</span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-1 shrink-0 ml-auto" ref={!headerNavMode ? searchContainerRef : undefined}>

        {/* Mobile Search */}
        <div className="md:hidden relative">
          <AnimatePresence>
            {searchExpanded ? (
              <motion.div
                className="fixed inset-x-0 top-0 h-16 bg-background/95 backdrop-blur-md border-b border-white/10 flex items-center px-4 gap-2 z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  type="text"
                  placeholder={`Search ${currentSearchConfig.labelKey}...`}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  autoFocus
                />
                {isSearching && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0" />}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground flex-shrink-0"
                  onClick={() => { setSearchExpanded(false); setSearchQuery(''); setShowResults(false); }}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-0 bg-background border-b border-white/20 shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                    {searchResults.map((result) => {
                      const TargetIcon = currentSearchConfig.icon;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultSelect(result)}
                          className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <TargetIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate block">{result.title}</span>
                            {result.subtitle && <span className="text-xs text-muted-foreground truncate block">{result.subtitle}</span>}
                          </div>
                          {result.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              result.badge.variant === 'success' ? 'bg-green-500/20 text-green-400' :
                              result.badge.variant === 'destructive' ? 'bg-destructive/20 text-destructive' :
                              'bg-muted text-muted-foreground'
                            }`}>{result.badge.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchExpanded(true)}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </AnimatePresence>
        </div>

        {/* Notification Bell */}
        <DropdownMenu open={notificationDropdownOpen} onOpenChange={setNotificationDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/10">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-96 glass-card backdrop-blur-md bg-background/95 border border-white/20 max-h-96 overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">
                {t('header.notifications') || 'Notifications'}
              </DropdownMenuLabel>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive/80"
                    onClick={(e) => { e.preventDefault(); clearNotifications(); }}
                  >
                    {t('header.clear')}
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:text-primary/80"
                    onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {t('header.mark-all-read') || 'Mark all read'}
                  </Button>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-72 overflow-y-auto scrollbar-dark">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">{t('header.no-notifications') || 'No notifications yet'}</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`px-3 py-3 cursor-pointer focus:bg-primary/10 ${!notif.read ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                      <NotificationAvatar notif={notif} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${notif.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatNotificationTime(notif.timestamp)}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setNotificationDropdownOpen(false)}
                  >
                    {t('header.view-all-notifications') || 'View all notifications'}
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        {user && (
          <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-primary/10">
                <div className="flex-shrink-0">
                  {userProfilePicUrl ? (
                    <img src={userProfilePicUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-white/20">
                      <span className="text-primary font-semibold text-sm">{user.name ? user.name.charAt(0).toUpperCase() : '?'}</span>
                    </div>
                  )}
                </div>
                {!headerNavMode && <span className="hidden lg:block text-sm font-medium text-foreground max-w-24 truncate">{user.name}</span>}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 hidden sm:block ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-card backdrop-blur-md bg-background/95 border border-white/20" sideOffset={8}>
              <DropdownMenuItem className="cursor-pointer hover:bg-white hover:text-black">
                <Link to="/profile" className="flex items-center w-full">
                  <UserCircle className="h-4 w-4 mr-2" />
                  {t('header.my-profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer hover:bg-white hover:text-black" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.header>

    <LeadPreviewModal
      isOpen={isLeadModalOpen}
      onClose={() => { setIsLeadModalOpen(false); setSelectedLeadId(null); }}
      leadId={selectedLeadId}
    />

    <DealPreviewModal
      isOpen={isDealModalOpen}
      onClose={() => { setIsDealModalOpen(false); setSelectedDealId(null); }}
      dealId={selectedDealId}
    />

    <ProductFormModal
      isOpen={isProductModalOpen}
      onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
      product={selectedProduct}
      onSuccess={() => {}}
    />
    </>
  );
};

const NotificationAvatar = ({ notif }: { notif: AppNotification }) => {
  const pic =
    notif.type === 'lead_created' ? notif.creator.profile_pic
    : notif.type === 'group_created' ? notif.creatorPic
    : notif.type === 'private_message' ? notif.senderPic
    : null;
  const name =
    notif.type === 'lead_created' ? notif.creator.name
    : notif.type === 'group_created' ? notif.creatorName
    : notif.type === 'private_message' ? notif.senderName
    : '';
  const url = usePrivateFile(pic);
  return (
    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-primary font-semibold text-xs">{name?.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};

export default TopHeader;
