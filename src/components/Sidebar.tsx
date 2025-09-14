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
  LogOut
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
import { SiGoogleanalytics } from "react-icons/si";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ isCollapsed, onToggle, activeSection, onSectionChange }: SidebarProps) => {
  // Controls whether the Dashboard submenu is expanded or collapsed
  const [dashboardExpanded, setDashboardExpanded] = useState(true);
  // Controls whether the Leads submenu is expanded or collapsed
  const [leadsExpanded, setLeadsExpanded] = useState(false);
  // Controls whether the Settings submenu is expanded or collapsed
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
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
    { id: 'languages', label: t('nav.languages'), icon: () => <IoLanguage /> },
  ];

  // Main navigation items - currently placeholder items for future CRM features
  const mainItems = [
    { id: 'integrations', label: t('nav.integrations'), icon: Plug }, // Future: Third-party integrations
    { id: 'api', label: t('nav.api'), icon: Database }, // Future: API management & documentation
    { id: 'users', label: t('nav.users'), icon: Users }, // Future: User management system
  ];

  return (
    <motion.div
      className={`fixed left-0 top-0 h-full glass-card z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <AnimatePresence>
          {!isCollapsed && (
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
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {/* Dashboard Section */}
        <div>
          <button
            onClick={() => setDashboardExpanded(!dashboardExpanded)}
            className={`nav-item w-full ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5" />
              <AnimatePresence>
                {!isCollapsed && (
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
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {dashboardExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {dashboardExpanded && !isCollapsed && (
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
            onClick={() => setLeadsExpanded(!leadsExpanded)}
            className={`nav-item w-full ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <AnimatePresence>
                {!isCollapsed && (
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
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {leadsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {leadsExpanded && !isCollapsed && (
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
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className={`nav-item w-full ${!isCollapsed ? 'justify-between' : 'justify-center'}`}
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5" />
              <AnimatePresence>
                {!isCollapsed && (
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
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {settingsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {settingsExpanded && !isCollapsed && (
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

        {/* Main Navigation Items */}
        {mainItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSectionNavigation(item.id)}
            className={`nav-item w-full ${isCollapsed ? 'justify-center' : ''} ${
              activeSection === item.id ? 'active' : ''
            }`}
            disabled
          >
            <item.icon className="h-5 w-5" />
            <AnimatePresence>
              {!isCollapsed && (
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
            className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            <AnimatePresence>
              {!isCollapsed && (
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
            {!isCollapsed && user && (
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