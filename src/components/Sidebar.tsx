/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * A sophisticated collapsible sidebar with glassmorphism design that provides:
 * - Expandable dashboard submenu with 4 analytics sections
 * - Smooth animations for collapse/expand states
 * - Active state highlighting with white glow effects
 * - Company branding with logo
 * - Reorderable sections via MenuOrderContext
 */

import React, { useState, useMemo } from 'react';
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
  Menu,
  X,
  Plug,
  Tag,
  Bot,
  Key,
  MessageCircle,
  Inbox,
  CalendarDays,
  Package,
  FileText,
  Headphones,
  FileStack,
  ClipboardList,
  ListTodo,
  TicketPlus,
  MessageSquareText,
  Building,
  PieChart,
  Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMenuOrder } from '../contexts/MenuOrderContext';
import { useTheme } from '../contexts/ThemeContext';
import optomyzeLogo from '@/assets/optomyze.png';
import optomyzeLogoLight from '@/assets/optomyze-light.png';
import OptoIcon from '@/assets/opto-icon.png';
import OptoIconLight from '@/assets/opto-icon-light.png';
import { IoFunnelOutline, IoLanguage } from "react-icons/io5";
import { FaMeta } from "react-icons/fa6";
import { SiGoogleanalytics, SiN8N, SiGoogleads } from "react-icons/si";
import { RiAppsFill } from "react-icons/ri";
import { BsDatabaseFillGear } from "react-icons/bs";
import { VscSettings } from "react-icons/vsc";
import { MdBusinessCenter, MdCurrencyExchange } from "react-icons/md";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ isCollapsed, onToggle, activeSection, onSectionChange, mobileOpen = false, onMobileClose }: SidebarProps) => {
  const [expandedSection, setExpandedSection] = useState<string>('dashboard');
  const [isHovered, setIsHovered] = useState<boolean>(false);
  
  const toggleSection = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };
  
  const { funnels, user } = useAuth();
  const { t } = useLanguage();
  const { menuOrder } = useMenuOrder();
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
    { id: 'google-analytics', label: t('dashboard.google-analytics'), icon: () => <SiGoogleanalytics size={16}/> },
  ];

  const leadsItems = funnels
    .filter(funnel => funnel.is_active && funnel.type === 'sale')
    .map(funnel => ({
      id: funnel.id.toString(),
      label: funnel.name,
      count: funnel.nleads,
      path: `/leads/${funnel.id}`
    }));

  const dealsItems = funnels
    .filter(funnel => funnel.is_active && funnel.type === 'deal')
    .map(funnel => ({
      id: funnel.id.toString(),
      label: funnel.name,
      count: funnel.nleads,
      path: `/deals/${funnel.id}`
    }));

  const settingsItems = [
    { id: 'crm-panel', label: t('nav.crm-panel'), icon: () => <img src={icon} alt="CRM" className="h-4 w-4" />, restrictedFor: [] },
    { id: 'funnels', label: t('nav.funnels'), icon: () => <IoFunnelOutline />, restrictedFor: ['agent'] },
    { id: 'companies', label: t('nav.companies'), icon: () => <MdBusinessCenter size={16}/>, restrictedFor: ['agent'] },
    { id: 'tags', label: t('nav.tags'), icon: () => <Tag size={13}/>, restrictedFor: ['agent'] },
    { id: 'preferences', label: t('nav.preferences'), icon: () => <VscSettings size={16} />, restrictedFor: [] },
  ].filter(item => !item.restrictedFor.includes(user?.role?.toLowerCase() || ''));

  const integrationsItems = [
    { id: 'integrations', label: 'Apps', icon: () => <RiAppsFill /> },
    { id: 'integration-panel', label: t('integrations.panel.menu-title'), icon: () => <VscSettings size={16} /> },
  ];

  const aiAgentsItems = [
    { id: 'n8n-agents', label: t('agents.n8n.title'), icon: () => <SiN8N /> },
    { id: 'optomyze-agents', label: t('agents.optomyze.menu-title'), icon: () => <img src={icon} alt="Optomyze" className="h-4 w-4" /> },
  ];

  const apiItems = [
    { id: 'api-tokens', label: 'API Tokens', icon: () => <Key size={18}/> },
    { id: 'api-setup', label: 'API Setup', icon: () => <BsDatabaseFillGear size={18}/> },
  ];

  const organizationItems = [
    { id: 'manage-users', label: t('organization.users'), icon: () => <Users size={18}/> },
    { id: 'manage-teams', label: t('organization.teams'), icon: () => <UsersRound size={18}/> },
  ];

  const chatItems = [
    { id: 'global-inbox',      label: t('nav.global-inbox'), icon: () => <MessageCircle size={18}/> },
    { id: 'optomyze-inbox',    label: t('nav.optomyze-teams'),    icon: () => <img src={icon} alt="Optomyze" className="h-4 w-4" /> },
  ];

  const calendarsItems = [
    { id: 'optomyze-calendar', label: t('calendar.optomyze.title'), icon: () => <img src={icon} alt="Optomyze" className="h-4 w-4" /> },
  ];

  const isErpModule = user?.company?.product_module === 'ERP';
  const erpFrontendUrl = import.meta.env.VITE_ERP_FRONTEND_URL;

  const productsItems = isErpModule
    ? [{ id: 'erp', label: 'ERP', icon: () => <Package size={16} />, isExternal: true, externalUrl: erpFrontendUrl }]
    : [
        { id: 'manage-products', label: t('products.manage'), icon: () => <Package size={16} />, isExternal: false },
        { id: 'product-categories', label: 'Product Categories', icon: () => <Tag size={16} />, isExternal: false },
      ];

  const supportItems = [
    { id: 'open-ticket', label: t('support.open-ticket'), icon: () => <TicketPlus size={16} /> },
    { id: 'talk-to-optus', label: t('support.talk-to-optus'), icon: () => <Bot size={16} /> },
  ];

  const mainItems = [
    { id: 'integrations', label: t('nav.integrations'), icon: Plug },
  ];

  const effectivelyCollapsed = isCollapsed && !isHovered;

  // Renders a generic expandable section
  const renderExpandableSection = (
    sectionId: string,
    icon: React.ReactNode,
    label: string,
    items: { id: string; label: string; icon?: () => React.ReactNode; isExternal?: boolean; externalUrl?: string; path?: string }[],
    options?: { useNavLink?: boolean; roleGated?: boolean }
  ) => {
    if (options?.roleGated && user?.role === 'agent') return null;
    
    return (
      <div key={sectionId}>
        <button
          onClick={() => toggleSection(sectionId)}
          className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {!effectivelyCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {expandedSection === sectionId ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {expandedSection === sectionId && !effectivelyCollapsed && (
            <motion.div
              className="ml-4 space-y-1 mt-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {items.map((item) => {
                if (options?.useNavLink && item.path) {
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) => `nav-item-sub w-full ${isActive ? 'active' : ''}`}
                    >
                      <IoFunnelOutline size={12} />
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
                    }}
                    className={`nav-item-sub w-full ${activeSection === item.id ? 'active' : ''}`}
                  >
                    {item.icon ? <item.icon /> : null}
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {items.length === 0 && (
                <div className="ml-4 text-sm text-muted-foreground">
                  No items available
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
    leads: () => renderExpandableSection('leads', <Users className="h-5 w-5" />, t('nav.leads'), leadsItems.length > 0 ? leadsItems : [], { useNavLink: true }),
    deals: () => renderExpandableSection('deals', <MdCurrencyExchange className="h-4 w-4" />, t('nav.deals'), dealsItems.length > 0 ? dealsItems : [], { useNavLink: true }),
    settings: () => renderExpandableSection('settings', <Settings className="h-5 w-5" />, t('nav.settings'), settingsItems),
    reports: () => renderExpandableSection('reports', <PieChart className="h-5 w-5" />, t('nav.reports'), [
      { id: 'lead-activity', label: t('reports.lead-activity'), icon: () => <ClipboardList size={14} /> },
      { id: 'deal-activity', label: t('reports.deal-activity'), icon: () => <Handshake size={14} /> },
      { id: 'report-tasks', label: t('reports.tasks'), icon: () => <ListTodo size={14} /> },
    ]),
    integrations: () => renderExpandableSection('integrations', <Plug className="h-5 w-5" />, t('nav.integrations'), integrationsItems),
    api: () => renderExpandableSection('api', <Database className="h-5 w-5" />, t('nav.api'), apiItems),
    organization: () => renderExpandableSection('organization', <Building className="h-5 w-5" />, t('nav.organization'), organizationItems, { roleGated: true }),
    chat: () => renderExpandableSection('chat', <Inbox className="h-5 w-5" />, t('nav.chat'), chatItems),
    calendars: () => renderExpandableSection('calendars', <CalendarDays className="h-5 w-5" />, t('nav.calendars'), calendarsItems),
    products: () => renderExpandableSection('products', <Package className="h-5 w-5" />, t('nav.products'), productsItems),
    support: () => renderExpandableSection('support', <Headphones className="h-5 w-5" />, t('nav.support'), supportItems),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeSection, expandedSection, effectivelyCollapsed, funnels, user, t, menuOrder]);

  return (
    <>
      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

    <motion.div
      className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 rounded-none
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
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 hidden md:flex"
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

      {/* Navigation - rendered in menuOrder */}
      <nav className="p-3 space-y-1 overflow-y-auto flex-1 pb-8 scrollbar-dark" style={{ maxHeight: 'calc(100vh - 64px)' }} onMouseEnter={() => isCollapsed && setIsHovered(true)} onMouseLeave={() => isCollapsed && setIsHovered(false)}>
        {menuOrder.map((sectionId) => {
          const renderer = sectionRenderers[sectionId];
          return renderer ? <React.Fragment key={sectionId}>{renderer()}</React.Fragment> : null;
        })}
      </nav>
    </motion.div>
    </>
  );
};

export default Sidebar;
