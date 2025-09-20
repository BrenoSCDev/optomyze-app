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
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import optomyzeLogo from '@/assets/optomyze.png';
import metaLogo from '@/assets/meta-logo.png';
import googleLogo from '@/assets/google-logo.png';
import OptoIcon from '@/assets/opto-icon.png';
import { IoFunnelOutline, IoLanguage } from "react-icons/io5";
import { FaMeta } from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa";
import { SiGoogleanalytics, SiN8N } from "react-icons/si";
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
    { id: 'meta-ads', label: t('dashboard.meta-ads'), icon: () => <FaMeta size={18}/> }, // Facebook/Instagram ads performance
    { id: 'google-ads', label: t('dashboard.google-ads'), icon: () => <FaGoogle size={16}/> }, // Google Ads campaign analytics
    { id: 'google-analytics', label: t('dashboard.google-analytics'), icon: () => <SiGoogleanalytics size={16}/> }, // Website traffic data
  ];

  // Dynamic leads submenu items from API
  const leadsItems = funnels.map(funnel => ({
    id: funnel.id.toString(),
    label: funnel.name,
    count: funnel.nleads,
    path: `/leads/${funnel.id}`
  }));

  // Settings submenu items
  const settingsItems = [
    { id: 'funnels', label: t('nav.funnels'), icon: () => <IoFunnelOutline /> },
    { id: 'tags', label: t('nav.tags'), icon: () => <Tag size={18}/> },
    { id: 'languages', label: t('nav.languages'), icon: () => <IoLanguage /> },
  ];

  // Integrations submenu items
  const integrationsItems = [
    { id: 'integrations', label: 'Apps', icon: () => <RiAppsFill /> },
  ];

  // AI Agents submenu items
  const aiAgentsItems = [
    { id: 'n8n-agents', label: t('agents.n8n.title'), icon: () => <SiN8N /> },
  ];

  // API submenu items
  const apiItems = [
    { id: 'api-tokens', label: 'API Tokens', icon: () => <Key size={18}/> },
    { id: 'api-setup', label: 'API Setup', icon: () => <BsDatabaseFillGear size={18}/> },
  ];

  // Users submenu items
  const usersItems = [
    { id: 'manage-users', label: 'Manage Users', icon: () => <Users size={18}/> },
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                     {React.createElement(item.icon, { className: "h-4 w-4" })}
                    <span className="text-sm">{item.label}</span>
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
                        nav-item w-full justify-between ${
                          isActive ? 'active' : ''
                        }
                      `}
                    >
                      <span className="text-sm truncate">{item.label}</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {item.count}
                      </span>
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span className="text-sm">{item.label}</span>
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span className="text-sm">{item.label}</span>
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon />
                    <span className="text-sm">{item.label}</span>
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-4 w-4" })}
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Users Section */}
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
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    {React.createElement(item.icon, { className: "h-4 w-4" })}
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Navigation Items */}
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

        {/* Logout Section */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <button
            onClick={logout}
            className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${effectivelyCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            <AnimatePresence>
              {!effectivelyCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  >
                    {t('nav.logout')}
                  </motion.span>
              )}
            </AnimatePresence>
          </button>
          
          {/* User Info */}
          <AnimatePresence>
            {!effectivelyCollapsed && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-white/5 rounded-lg overflow-hidden"
              >
                <div className="text-xs text-muted-foreground">{t('user.loggedinas')}</div>
                <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                <div className="text-xs text-muted-foreground">{t('user.role')}: {user.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.div>
  );
};

export default Sidebar;