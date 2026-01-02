/**
 * SIDEBAR NAVIGATION COMPONENT
 * 
 * A sophisticated collapsible sidebar with glassmorphism design that provides:
 * - Expandable dashboard submenu with 4 analytics sections
 * - Smooth animations for collapse/expand states
 * - Active state highlighting with white glow effects
 * - Company branding with logo
 * - Future navigation items (leads, settings, etc.)
 * 
 * Design Features:
 * - Glass morphism effect with backdrop blur
 * - Neon border effects on hover
 * - Smooth width transitions with Framer Motion
 * - Icon-only mode when collapsed
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Database, 
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  BarChart,
  Plug,
  LogOut,
  Tag,
  Bot,
  Key,
  MessageCircle,
  UserCircle,
  CalendarDays,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import optomyzeLogo from '@/assets/optomyze.png';
import { getStorageUrl } from '@/lib/constants';
import OptoIcon from '@/assets/opto-icon.png';
import { IoFunnelOutline, IoLanguage } from "react-icons/io5";
import { FaMeta } from "react-icons/fa6";
import { SiGoogleanalytics, SiN8N, SiGoogleads } from "react-icons/si";
import { RiAppsFill } from "react-icons/ri";
import { BsDatabaseFillGear } from "react-icons/bs";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ isCollapsed, onToggle, activeSection, onSectionChange }: SidebarProps) => {
  // Controls which menu section is currently expanded (only one at a time)
  const [expandedSection, setExpandedSection] = useState<string>('dashboard');
  // Controls hover state for collapsed sidebar
  const [isHovered, setIsHovered] = useState<boolean>(false);
  // Controls user dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  
  // Helper function to toggle section and close others
  const toggleSection = (sectionName: string) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };
  
  const { funnels, logout, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation for dashboard and settings sections
  const handleSectionNavigation = (sectionId: string) => {
    if (sectionId === 'leads') {
      // If clicking leads without specific funnel, go to default dashboard
      navigate('/');
    } else {
      // For dashboard and settings sections, navigate to home with section parameter
      navigate(`/?section=${sectionId}`);
    }
  };

  // Dashboard submenu items - each represents a different analytics platform
  const dashboardItems = [
    { id: 'optomyze-metrics', label: t('dashboard.optomyze-metrics'), icon: () => <img src={OptoIcon} alt="Meta" className="h-4 w-4" /> }, // Main company KPIs and lead data
    { id: 'plan-usage', label: t('dashboard.plan-usage'), icon: () => <img src={OptoIcon} alt="Plan Usage" className="h-4 w-4" /> }, // Plan usage metrics
    { id: 'meta-ads', label: t('dashboard.meta-ads'), icon: () => <FaMeta size={18}/> }, // Facebook/Instagram ads performance
    { id: 'google-ads', label: t('dashboard.google-ads'), icon: () => <SiGoogleads size={16}/> }, // Google Ads campaign analytics
    { id: 'google-analytics', label: t('dashboard.google-analytics'), icon: () => <SiGoogleanalytics size={16}/> }, // Website traffic data
  ];

  // Dynamic leads submenu items from API - only show active funnels
  const leadsItems = funnels
    .filter(funnel => funnel.is_active)
    .map(funnel => ({
      id: funnel.id.toString(),
      label: funnel.name,
      count: funnel.nleads,
      path: `/leads/${funnel.id}`
    }));

  // Settings submenu items - Filter based on user role
  const settingsItems = [
    { id: 'crm-panel', label: t('nav.crm-panel'), icon: () => <img src={OptoIcon} alt="CRM" className="h-4 w-4" />, restrictedFor: [] },
    { id: 'funnels', label: t('nav.funnels'), icon: () => <IoFunnelOutline />, restrictedFor: ['agent'] },
    { id: 'tags', label: t('nav.tags'), icon: () => <Tag size={13}/>, restrictedFor: ['agent'] },
    { id: 'languages', label: t('nav.languages'), icon: () => <IoLanguage />, restrictedFor: [] },
  ].filter(item => !item.restrictedFor.includes(user?.role?.toLowerCase() || ''));

  // Integrations submenu items
  const integrationsItems = [
    { id: 'integrations', label: 'Apps', icon: () => <RiAppsFill /> },
    { id: 'integration-panel', label: t('integrations.panel.menu-title'), icon: () => <Plug size={16} /> },
  ];

  // AI Agents submenu items
  const aiAgentsItems = [
    { id: 'n8n-agents', label: t('agents.n8n.title'), icon: () => <SiN8N /> },
  ];

  // API submenu items
  const apiItems = [
    { id: 'api-tokens', label: 'API Tokens', icon: () => <Key size={18}/> },
    { id: 'api-setup', label: 'API Setup', icon: () => <BsDatabaseFillGear size={18}/> },
    { id: 'api-playground', label: t('api.playground.title'), icon: () => <Key size={18}/> },
  ];

  // Users submenu items
  const usersItems = [
    { id: 'manage-users', label: 'Manage Users', icon: () => <Users size={18}/> },
  ];

  // Chat submenu items
  const chatItems = [
    { id: 'whatsapp-inbox', label: 'WhatsApp Inbox', icon: () => <MessageCircle size={18}/> },
  ];

  // Calendars submenu items
  const calendarsItems = [
    { id: 'optomyze-calendar', label: t('calendar.optomyze.title'), icon: () => <img src={OptoIcon} alt="Optomyze" className="h-4 w-4" /> },
  ];

  // Products submenu items
  const productsItems = [
    { id: 'manage-products', label: t('products.manage'), icon: () => <Package size={16} /> },
  ];

  // Main navigation items - currently placeholder items for future CRM features
  const mainItems = [
    { id: 'integrations', label: t('nav.integrations'), icon: Plug }, // Future: Third-party integrations
  ];

  // Calculate effective collapsed state (considering hover)
  const effectivelyCollapsed = isCollapsed && !isHovered;

  return (
    <motion.div
      className={`fixed left-0 top-0 h-full glass-card z-50 transition-all duration-300 ${
        effectivelyCollapsed ? 'w-16' : 'w-64'
      }`}
      initial={false}
      animate={{ width: effectivelyCollapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <AnimatePresence>
          {!effectivelyCollapsed && (
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <img src={optomyzeLogo} alt="Optomyze" className="h-8 " />
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 neon-border"
        >
          {effectivelyCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2" onMouseEnter={() => isCollapsed && setIsHovered(true)} onMouseLeave={() => isCollapsed && setIsHovered(false)}>
        {/* Dashboard Section */}
        <div>
          <button
            onClick={() => toggleSection('dashboard')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.dashboard')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'dashboard' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'dashboard' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {dashboardItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                     {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Leads Section */}
        <div>
          <button
            onClick={() => toggleSection('leads')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.leads')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'leads' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'leads' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {leadsItems.length > 0 ? (
                  leadsItems.map((item) => (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) => `
                        nav-item-sub w-full ${
                          isActive ? 'active' : ''
                        }
                      `}
                    >
                      <IoFunnelOutline size={12} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))
                ) : (
                  <div className="ml-4 text-sm text-muted-foreground">
                    No funnels available
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings Section */}
        <div>
          <button
            onClick={() => toggleSection('settings')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.settings')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'settings' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'settings' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {settingsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Integrations Section */}
        <div>
          <button
            onClick={() => toggleSection('integrations')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Plug className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.integrations')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'integrations' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'integrations' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {integrationsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Agents Section */}
        <div>
          <button
            onClick={() => toggleSection('aiAgents')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.ai-agents')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'aiAgents' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'aiAgents' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {aiAgentsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* API Section */}
        <div>
          <button
            onClick={() => toggleSection('api')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.api')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'api' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'api' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {apiItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Users Section - Hidden for Agent role */}
        {user?.role !== 'agent' && (
          <div>
            <button
              onClick={() => toggleSection('users')}
              className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                <AnimatePresence>
                  {!effectivelyCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {t('nav.users')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {expandedSection === 'users' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <AnimatePresence>
              {expandedSection === 'users' && !effectivelyCollapsed && (
                <motion.div
                  className="ml-4 space-y-1 mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {usersItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSectionNavigation(item.id)}
                      className={`nav-item-sub w-full ${
                        activeSection === item.id ? 'active' : ''
                      }`}
                    >
                      {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chat Section */}
        <div>
          <button
            onClick={() => toggleSection('chat')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.chat')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'chat' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'chat' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {chatItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Calendars Section */}
        <div>
          <button
            onClick={() => toggleSection('calendars')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.calendars')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'calendars' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'calendars' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {calendarsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products Section */}
        <div>
          <button
            onClick={() => toggleSection('products')}
            className={`nav-item w-full ${!effectivelyCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              <AnimatePresence>
                {!effectivelyCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {t('nav.products')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {expandedSection === 'products' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {expandedSection === 'products' && !effectivelyCollapsed && (
              <motion.div
                className="ml-4 space-y-1 mt-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {productsItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionNavigation(item.id)}
                    className={`nav-item-sub w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-3.5 w-3.5" })}
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {mainItems.filter(item => item.id !== 'integrations').map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionNavigation(item.id)}
            className={`nav-item w-full ${effectivelyCollapsed ? 'justify-center' : ''} ${
              activeSection === item.id ? 'active' : ''
            }`}
          >
            <item.icon className="h-5 w-5" />
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}

        {/* User Info with Dropdown */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <AnimatePresence>
            {!effectivelyCollapsed && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full p-3 glass-card backdrop-blur-md bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-xl shadow-lg overflow-hidden hover:from-white/15 hover:to-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        {/* Profile Picture or Initial */}
                        <div className="flex-shrink-0">
                          {user.profile_pic ? (
                            <img 
                              src={getStorageUrl(user.profile_pic)} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20">
                              <span className="text-white font-semibold text-lg">
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          {user.company_name && (
                            <div className="text-xs text-muted-foreground/80 truncate mt-0.5">{user.company_name}</div>
                          )}
                        </div>

                        {/* Dropdown indicator */}
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-48 glass-card backdrop-blur-md bg-background/95 border border-white/20"
                    sideOffset={8}
                  >
                    <DropdownMenuItem className="cursor-pointer hover:bg-white hover:text-black">
                      <Link to="/profile" className="flex items-center w-full">
                        <UserCircle className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-white hover:text-black"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.div>
  );
};

export default Sidebar;