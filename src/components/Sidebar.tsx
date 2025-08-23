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

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  Plug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import optomyzeLogo from '@/assets/optomyze.png';
import metaLogo from '@/assets/meta-logo.png';
import googleLogo from '@/assets/google-logo.png';
import OptoIcon from '@/assets/opto-icon.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ isCollapsed, onToggle, activeSection, onSectionChange }: SidebarProps) => {
  // Controls whether the Dashboard submenu is expanded or collapsed
  const [dashboardExpanded, setDashboardExpanded] = useState(true);

  // Dashboard submenu items - each represents a different analytics platform
  const dashboardItems = [
    { id: 'optomyze-metrics', label: 'Optomyze Metrics', icon: () => <img src={OptoIcon} alt="Meta" className="h-4 w-4" /> }, // Main company KPIs and lead data
    { id: 'meta-ads', label: 'Meta Ads', icon: () => <img src={metaLogo} alt="Meta" className="h-4 w-4" /> }, // Facebook/Instagram ads performance
    { id: 'google-ads', label: 'Google Ads', icon: () => <img src={googleLogo} alt="Google" className="h-4 w-4" /> }, // Google Ads campaign analytics
    { id: 'google-analytics', label: 'Google Analytics', icon: BarChart }, // Website traffic data
  ];

  // Main navigation items - currently placeholder items for future CRM features
  const mainItems = [
    { id: 'leads', label: 'Leads', icon: Users }, // Future: Lead management interface
    { id: 'integrations', label: 'Integrations', icon: Plug }, // Future: Third-party integrations
    { id: 'settings', label: 'Settings', icon: Settings }, // Future: App configuration
    { id: 'api', label: 'API', icon: Database }, // Future: API management & documentation
    { id: 'users', label: 'Users', icon: Users }, // Future: User management system
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
                    Dashboard
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
                    onClick={() => onSectionChange(item.id)}
                    className={`nav-item w-full ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
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
            onClick={() => onSectionChange(item.id)}
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
      </nav>
    </motion.div>
  );
};

export default Sidebar;