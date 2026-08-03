/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * A sophisticated collapsible sidebar with glassmorphism design that provides:
 * - Expandable dashboard submenu with 4 analytics sections
 * - Smooth animations for collapse/expand states
 * - Active state highlighting with white glow effects
 * - Company branding with logo
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  UsersRound,
  Settings, 
  Database, 
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Tag,
  Bot,
  Key,
  MessageCircle,
  Inbox,
  CalendarDays,
  CheckSquare,
  Package,
  FileText,
  Headphones,
  FileStack,
  ListTodo,
  TicketPlus,
  Building,
  Building2,
  PieChart,
  Globe,
  Contact,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CompanySwitcher from '@/components/layout/CompanySwitcher';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MENU_SECTION_ORDER } from '../lib/menuSections';
import { useQuickstart } from '@/contexts/QuickstartContext';
import { useTheme } from '../contexts/ThemeContext';
import optomyzeLogo from '@/assets/optomyze.png';
import optomyzeLogoLight from '@/assets/optomyze-light.png';
import OptoIcon from '@/assets/opto-icon.png';
import OptoIconLight from '@/assets/opto-icon-light.png';
import { IoFunnelOutline, IoLanguage } from "react-icons/io5";
import { FaMeta } from "react-icons/fa6";
import { SiGoogleads } from "react-icons/si";
import { RiAppsFill } from "react-icons/ri";
import { BsDatabaseFillGear } from "react-icons/bs";
import { VscSettings } from "react-icons/vsc";
import { MdBusinessCenter, MdCurrencyExchange } from "react-icons/md";
import { TiFlowMerge } from "react-icons/ti";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isCollapsed, onToggle, activeSection, onSectionChange, mobileOpen = false, onMobileClose }: SidebarProps) => {
  /**
   * Every section starts closed. This used to default to 'dashboard', which
   * meant a submenu the user had not asked for was pushed open on every load
   * and after every refresh, regardless of where they actually were.
   */
  const [expandedSection, setExpandedSection] = useState<string>('');
  /**
   * The sidebar has two modes. `main` is the normal three-group navigation;
   * `settings` replaces the whole nav with the settings destinations plus a
   * way back, rather than nesting them in a submenu.
   */
  const [menuMode, setMenuMode] = useState<'main' | 'settings'>('main');
  
  const toggleSection = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };
  
  const { funnels, user } = useAuth();
  const { t } = useLanguage();
  const { mode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar is always dark midnight-blue — always use the white logo variants
  const logo = optomyzeLogo;
  const icon = OptoIcon;

  const handleSectionNavigation = (sectionId: string) => {
    if (sectionId === 'leads') {
      navigate('/');
    } else {
      navigate(`/?section=${sectionId}`);
    }
  };

  // Dashboard submenu items
  const dashboardItems = [
    { id: 'optomyze-metrics', label: t('dashboard.optomyze-metrics'), icon: () => <img src={icon} alt="Optomyze" className="h-4 w-4" /> },
    { id: 'plan-usage', label: t('dashboard.plan-usage'), icon: () => <img src={icon} alt="Plan Usage" className="h-4 w-4" /> },
    { id: 'meta-ads', label: t('dashboard.meta-ads'), icon: () => <FaMeta size={18}/> },
    { id: 'google-ads', label: t('dashboard.google-ads'), icon: () => <SiGoogleads size={16}/> },
  ];

  /**
   * Leads and Deals used to be two sidebar sections; they're now one "Funnels"
   * menu listing every active funnel regardless of type. The two types still
   * route differently (/leads/:id vs /deals/:id) and keep distinct icons, so
   * they stay tellable apart in the list.
   *
   * Sale funnels are listed first, which also matches the direction this is
   * heading: sale funnels become "contact funnels" and deal funnels become the
   * primary funnel, at which point only the ordering and labels change here.
   */
  const funnelSectionItems = [
    ...funnels
      .filter(funnel => funnel.is_active && funnel.type === 'contact')
      .map(funnel => ({
        id: `sale-${funnel.id}`,
        label: funnel.name,
        count: funnel.nleads,
        path: `/leads/${funnel.id}`,
        icon: () => <IoFunnelOutline size={12} />,
      })),
    ...funnels
      .filter(funnel => funnel.is_active && funnel.type === 'deal')
      .map(funnel => ({
        id: `deal-${funnel.id}`,
        label: funnel.name,
        count: funnel.nleads,
        path: `/deals/${funnel.id}`,
        icon: () => <MdCurrencyExchange size={12} />,
      })),
  ];

  const settingsItems = [
    { id: 'crm-panel', label: t('nav.crm-panel'), icon: () => <img src={icon} alt="CRM" className="h-4 w-4" />, restrictedFor: [] },
    { id: 'business-profile', label: t('nav.business-profile'), icon: () => <Building2 size={16} />, restrictedFor: [] },
    { id: 'companies', label: t('nav.companies'), icon: () => <MdBusinessCenter size={16}/>, restrictedFor: ['agent'] },
    { id: 'preferences', label: t('nav.preferences'), icon: () => <VscSettings size={16} />, restrictedFor: [] },
  ].filter(item => !item.restrictedFor.includes(user?.role?.toLowerCase() || ''));

  const automationsItems = [
    { id: 'manage-agents', label: t('ai-agents.manage.menu-title'), icon: () => <Bot size={16} />, badge: 'Beta' },
  ];

  const apiItems = [
    { id: 'api-tokens', label: 'API Tokens', icon: () => <Key size={18}/> },
    { id: 'allowed-origins', label: t('api.allowed-origins.title'), icon: () => <Globe size={18}/> },
    { id: 'api-logs', label: t('api.logs.title'), icon: () => <FileText size={18}/> },
    { id: 'api-setup', label: 'API Setup', icon: () => <BsDatabaseFillGear size={18}/> },
  ];

  const organizationItems = [
    { id: 'manage-users', label: t('organization.users'), icon: () => <Users size={18}/> },
    { id: 'manage-teams', label: t('organization.teams'), icon: () => <UsersRound size={18}/> },
    { id: 'optomyze-inbox', label: t('nav.optomyze-teams'), icon: () => <img src={icon} alt="Optomyze" className="h-4 w-4" /> },
  ];

  const isErpModule = user?.company?.product_module === 'ERP';
  const erpFrontendUrl = import.meta.env.VITE_ERP_FRONTEND_URL;

  const productsItems = isErpModule
    ? [{ id: 'erp', label: 'ERP', icon: () => <Package size={16} />, isExternal: true, externalUrl: erpFrontendUrl }]
    : [
        { id: 'manage-products', label: t('products.manage'), icon: () => <Package size={16} />, isExternal: false },
      ];

  // Onboarding checklist: shown until the company dismisses it.
  const { visible: quickstartVisible } = useQuickstart();

  // Hovering no longer expands the rail; collapsed state is purely the toggle.
  const effectivelyCollapsed = isCollapsed;

  /**
   * Group 2 — destinations users reach constantly, so they get a top-level
   * link instead of being buried one expand deep.
   */
  const directLinks: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'contacts', label: t('nav.contacts'), icon: <Contact className="h-5 w-5" /> },
    { id: 'global-inbox', label: t('nav.inbox'), icon: <Inbox className="h-5 w-5" /> },
    { id: 'optomyze-calendar', label: t('nav.calendar'), icon: <CalendarDays className="h-5 w-5" /> },
    // Product name, deliberately untranslated — it reads the same in all four
    // languages, so t('nav.app-store') returns "App Store" everywhere.
    { id: 'integrations', label: t('nav.app-store'), icon: <RiAppsFill className="h-5 w-5" /> },
  ];

  /** Wraps a collapsed-rail control in a tooltip; a no-op when expanded. */
  const withRailTooltip = (label: string, node: React.ReactNode, key?: string) =>
    effectivelyCollapsed ? (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    ) : node;

  const renderDirectLink = ({ id, label, icon }: typeof directLinks[number]) => withRailTooltip(label, (
    <button
      key={id}
      type="button"
      onClick={() => {
        onSectionChange(id);
        onMobileClose?.();
      }}
      className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center px-0' : ''} ${
        activeSection === id ? 'active' : ''
      }`}
    >
      <div className="flex items-center gap-3 [&>svg]:shrink-0">
        {icon}
        <AnimatePresence>
          {!effectivelyCollapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </button>
  ), id);

  /**
   * COLLAPSED SIDEBAR BEHAVIOUR
   *
   * The rail no longer expands on hover — that made the layout jump every time
   * the pointer crossed it. Instead:
   *   - items without a submenu get a tooltip with their name
   *   - items with a submenu open a flyout beside the rail, so the children
   *     stay clickable without reopening the whole menu
   *
   * A short close delay lets the pointer travel from the icon into the flyout
   * without it vanishing on the way.
   *
   * Only a *trigger* may decide which section is showing. A flyout panel can
   * merely keep the current one alive (cancelClose). That distinction matters:
   * each section owns its own Popover, and a panel that is animating out is
   * still mounted and still receives mouse events — if it were allowed to set
   * the section, grazing it on the way to a neighbouring icon would snap the
   * menu back to the section you just left.
   */
  const [flyoutSection, setFlyoutSection] = useState<string | null>(null);
  const flyoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (flyoutTimer.current) {
      clearTimeout(flyoutTimer.current);
      flyoutTimer.current = null;
    }
  };

  /** Triggers only: switches which section is shown. */
  const openFlyout = (id: string) => {
    cancelClose();
    setFlyoutSection(id);
  };

  const scheduleClose = () => {
    cancelClose();
    flyoutTimer.current = setTimeout(() => setFlyoutSection(null), 160);
  };

  const closeFlyoutNow = () => {
    cancelClose();
    setFlyoutSection(null);
  };

  useEffect(() => cancelClose, []);

  // Leaving the window entirely never fires mouseleave on the rail, which
  // would otherwise strand an open flyout.
  useEffect(() => {
    if (!flyoutSection) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeFlyoutNow();
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', closeFlyoutNow);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', closeFlyoutNow);
    };
  }, [flyoutSection]);

  type SectionItem = {
    id: string; label: string; icon?: () => React.ReactNode;
    isExternal?: boolean; externalUrl?: string; path?: string; badge?: string;
  };

  /** One submenu entry. Shared by the expanded accordion and the flyout. */
  const renderSectionItem = (item: SectionItem, useNavLink?: boolean, onNavigate?: () => void) => {
    if (useNavLink && item.path) {
      return (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) => `nav-item-sub w-full ${isActive ? 'active' : ''}`}
        >
          {item.icon ? item.icon() : <IoFunnelOutline size={12} />}
          <span className="truncate">{item.label}</span>
        </NavLink>
      );
    }
    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.isExternal && item.externalUrl) {
            window.open(item.externalUrl, '_blank');
          } else {
            handleSectionNavigation(item.id);
          }
          onNavigate?.();
        }}
        className={`nav-item-sub w-full ${activeSection === item.id ? 'active' : ''}`}
      >
        {item.icon ? <item.icon /> : null}
        <span>{item.label}</span>
        {item.badge && (
          <span className="ml-1 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-blue-400">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // Renders a generic expandable section
  const renderExpandableSection = (
    sectionId: string,
    icon: React.ReactNode,
    label: string,
    items: SectionItem[],
    options?: { useNavLink?: boolean; roleGated?: boolean }
  ) => {
    if (options?.roleGated && user?.role === 'agent') return null;

    // --- Collapsed: icon + hover flyout carrying the submenu ---
    if (effectivelyCollapsed) {
      return (
        <Popover key={sectionId} open={flyoutSection === sectionId}>
          <PopoverTrigger asChild>
            <button
              onMouseEnter={() => openFlyout(sectionId)}
              onMouseLeave={scheduleClose}
              onFocus={() => openFlyout(sectionId)}
              onClick={() => onToggle()}
              aria-label={label}
              className="nav-item w-full justify-center px-0 [&>svg]:shrink-0"
            >
              {icon}
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            /* Radix hands focus back to the trigger when a popover closes.
               The trigger's onFocus opens the flyout, so without this the
               section that just closed immediately re-opens itself — which
               made the menu snap back to the previous item, and made it
               impossible to close by moving the pointer away. */
            onCloseAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={closeFlyoutNow}
            onPointerDownOutside={closeFlyoutNow}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="w-56 p-1"
            style={{
              background: 'hsl(var(--sidebar-bg))',
              borderColor: 'hsl(var(--sidebar-border))',
            }}
          >
            <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              {label}
            </p>
            <div className="space-y-0.5">
              {items.map(item => renderSectionItem(item, options?.useNavLink, () => setFlyoutSection(null)))}
              {items.length === 0 && (
                <p className="px-3 py-2 text-xs text-sidebar-foreground/60">
                  {t('nav.no-items')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // --- Expanded: the usual inline accordion ---
    return (
      <div key={sectionId}>
        <button
          onClick={() => toggleSection(sectionId)}
          className="nav-item w-full justify-between"
        >
          <div className="flex items-center gap-3 [&>svg]:shrink-0">
            {icon}
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {label}
            </motion.span>
          </div>
          {expandedSection === sectionId ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {expandedSection === sectionId && (
            <motion.div
              className="ml-4 space-y-1 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {items.map(item => renderSectionItem(item, options?.useNavLink))}
              {items.length === 0 && (
                <div className="ml-4 text-sm text-muted-foreground">
                  {t('nav.no-items')}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Build a map of section ID -> render function
  const sectionRenderers: Record<string, () => React.ReactNode> = useMemo(() => ({
    dashboard: () => renderExpandableSection('dashboard', <BarChart3 className="h-5 w-5" />, t('nav.dashboard'), dashboardItems),
    // Section id `funnels` is the expandable menu. Not to be confused with the
    // Settings > Funnels item, whose id lands in `activeSection` — different
    // state, no collision.
    funnels: () => renderExpandableSection('funnels', <IoFunnelOutline className="h-5 w-5" />, t('nav.funnels'), funnelSectionItems, { useNavLink: true }),
    // Labelled "Activity" (nav.reports). The section id stays `reports`
    // because it is persisted in the user's saved menu order — renaming it
    // would silently discard their arrangement.
    reports: () => renderExpandableSection('reports', <PieChart className="h-5 w-5" />, t('nav.reports'), [
      { id: 'record-logs', label: t('reports.record-logs'), icon: () => <FileStack size={14} /> },
      { id: 'tasks', label: t('nav.tasks'), icon: () => <CheckSquare size={14} /> },
    ]),
    automations: () => renderExpandableSection('automations', <TiFlowMerge className="h-5 w-5" />, t('nav.automations'), automationsItems),
    api: () => renderExpandableSection('api', <Database className="h-5 w-5" />, t('nav.api'), apiItems),
    organization: () => renderExpandableSection('organization', <Building className="h-5 w-5" />, t('nav.organization'), organizationItems),
    products: () => renderExpandableSection('products', <Package className="h-5 w-5" />, t('nav.products'), productsItems),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeSection, expandedSection, effectivelyCollapsed, flyoutSection, funnels, user, t]);

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-overlay z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

    <motion.div
      className={`fixed left-0 top-0 h-screen z-40 transition-colors duration-base ease-standard rounded-none
        md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${effectivelyCollapsed ? 'md:w-16' : 'md:w-64'}
        w-72
      `}
      style={{ background: 'hsl(var(--sidebar-bg))', borderRight: '1px solid hsl(var(--sidebar-border))' }}
      initial={false}
      animate={{ width: effectivelyCollapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <AnimatePresence>
          {!effectivelyCollapsed && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <img src={logo} alt="Optomyze" className="h-7" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Desktop toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:text-sidebar-foreground-hover hover:bg-sidebar-hover hidden md:flex"
        >
          {effectivelyCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>

        {/* Mobile close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 md:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/*
        Three groups, in reading order:
          1. Internal management — expandable sections, user-reorderable
          2. Direct links — Contacts / Inbox / Calendar, no submenus
          3. Settings & Support — pinned to the bottom
        Only group 1 is ordered; the other two are structural.
      */}
      <nav
        className="flex flex-col p-3 overflow-y-auto scrollbar-dark"
        // Safety net: covers the gaps between icons and the rail's edges, so
        // the flyout can't be stranded by an exit the triggers never see.
        onMouseLeave={scheduleClose}
        style={{ height: 'calc(100vh - 64px)' }}
      >
        {menuMode === 'settings' ? (
          <div className="space-y-1">
            {/* Way back out. Sits at the top so it reads as "up a level"
                rather than as another destination. */}
            <button
              type="button"
              onClick={() => setMenuMode('main')}
              title={effectivelyCollapsed ? t('nav.back-to-menu') : undefined}
              className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center px-0' : ''}`}
            >
              <div className="flex items-center gap-3 [&>svg]:shrink-0">
                <ChevronLeft className="h-5 w-5" />
                <AnimatePresence>
                  {!effectivelyCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {t('nav.back-to-menu')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>

            <div className="my-2 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }} />

            {!effectivelyCollapsed && (
              <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                {t('nav.settings')}
              </p>
            )}

            {/* Which company this session is in. Renders nothing unless the
                person holds accounts in more than one — see CompanySwitcher. */}
            <CompanySwitcher collapsed={effectivelyCollapsed} />

            {settingsItems.map((item) => withRailTooltip(item.label, (
              <button
                key={item.id}
                type="button"
                onClick={() => { onSectionChange(item.id); onMobileClose?.(); }}
                className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center px-0' : ''} ${
                  activeSection === item.id ? 'active' : ''
                }`}
              >
                <div className="flex items-center gap-3 [&>svg]:shrink-0">
                  <span className="flex h-5 w-5 items-center justify-center">{item.icon()}</span>
                  <AnimatePresence>
                    {!effectivelyCollapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            ), item.id))}
          </div>
        ) : (
        <>
        {/* 0 — Quickstart, pinned above everything while the company is still
            working through onboarding. Disappears for good once dismissed. */}
        {quickstartVisible && (
          <div className="space-y-1 pb-3 mb-3 border-b" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
            {renderDirectLink({
              id: 'quickstart',
              label: t('quickstart.title'),
              icon: <Rocket className="h-5 w-5" />,
            })}
          </div>
        )}

        {/* 1 — Internal management */}
        <div className="space-y-1">
          {MENU_SECTION_ORDER.map((sectionId) => {
            const renderer = sectionRenderers[sectionId];
            return renderer ? <React.Fragment key={sectionId}>{renderer()}</React.Fragment> : null;
          })}
        </div>

        {/* 2 — Direct links */}
        <div className="my-3 border-t" style={{ borderColor: 'hsl(var(--sidebar-border))' }} />
        <div className="space-y-1">
          {directLinks.map(renderDirectLink)}
        </div>

        {/* 3 — Settings & support, pushed to the bottom */}
        <div className="flex-1 min-h-3" />
        <div
          className="space-y-1 pt-3 border-t"
          style={{ borderColor: 'hsl(var(--sidebar-border))' }}
        >
          {/* Swaps the whole nav for the settings menu rather than nesting
              settings inside a submenu. */}
          {withRailTooltip(t('nav.settings'), (
          <button
            type="button"
            onClick={() => setMenuMode('settings')}
            className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center px-0' : ''}`}
          >
            <div className="flex items-center gap-3 [&>svg]:shrink-0">
              <Settings className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {t('nav.settings')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
          ), 'settings-entry')}

          {/* Support goes straight to ticket submission — it had one real
              destination, and Optus now lives in the floating bubble. */}
          {withRailTooltip(t('nav.support'), (
          <button
            type="button"
            onClick={() => { onSectionChange('open-ticket'); onMobileClose?.(); }}
            className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center px-0' : ''} ${
              activeSection === 'open-ticket' ? 'active' : ''
            }`}
          >
            <div className="flex items-center gap-3 [&>svg]:shrink-0">
              <Headphones className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {t('nav.support')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
          ), 'support-entry')}
        </div>
        </>
        )}
      </nav>
    </motion.div>
    </>
  );
};

export default Sidebar;
