/**
 * OPTOMYZE CRM DASHBOARD - MAIN INDEX PAGE
 * 
 * This is the main dashboard layout that orchestrates the entire CRM interface.
 * Features:
 * - Collapsible sidebar navigation with glassmorphism design
 * - Dynamic dashboard switching between different analytics sections
 * - Smooth animations and transitions using Framer Motion
 * - Responsive layout that adapts to sidebar state
 * - Animated background with floating particles
 */

import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import MetaAds from '@/components/dashboards/MetaAds';
import GoogleAds from '@/components/dashboards/GoogleAds';
import GoogleAnalytics from '@/components/dashboards/GoogleAnalytics';
import TagsDashboard from '@/components/dashboards/TagsDashboard';
import LanguagesDashboard from '@/components/dashboards/LanguagesDashboard';
import FunnelsDashboard from '@/components/dashboards/FunnelsDashboard';
import LeadsManagement from '@/components/leads/LeadsManagement';
import IntegrationsApps from '@/components/integrations/IntegrationsApps';
import N8nAgents from '@/components/agents/N8nAgents';
import ApiTokens from '@/components/api/ApiTokens';
import ApiSetup from '@/components/api/ApiSetup';
import ManageUsers from '@/components/users/ManageUsers';

const Index = () => {
  // Sidebar collapse state - controls whether sidebar is minimized or expanded
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Active dashboard section state - determines which analytics dashboard to display
  const [activeSection, setActiveSection] = useState('optomyze-metrics');
  
  const location = useLocation();
  const { funnelId } = useParams();

  // Check for section parameter in URL and update active section
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [location.search]);

  // Set active section to leads management if we have a funnelId
  useEffect(() => {
    if (funnelId) {
      setActiveSection('leads');
    }
  }, [funnelId]);

  // Toggle sidebar collapse/expand functionality
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  /**
   * Dashboard Component Router
   * Renders the appropriate dashboard component based on the active section
   * Each dashboard contains specific KPIs and charts for different analytics platforms
   */
  const renderDashboard = () => {
    switch (activeSection) {
      case 'optomyze-metrics':
        return <OptomyzeMetrics />; // Main company metrics and lead generation data
      case 'meta-ads':
        return <MetaAds />; // Facebook/Instagram advertising analytics
      case 'google-ads':
        return <GoogleAds />; // Google Ads campaign performance data
      case 'google-analytics':
        return <GoogleAnalytics />; // Website traffic and user behavior metrics
      
      // Settings sections
      case 'languages':
        return <LanguagesDashboard />; // Language selection interface
      case 'funnels':
        return <FunnelsDashboard />; // Funnels management interface
      case 'tags':
        return <TagsDashboard />; // Tags management interface
      case 'general':
      case 'users':
      case 'api-keys':
        return (
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-primary/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">This feature is under development.</p>
          </div>
        );
      case 'integrations':
        return <IntegrationsApps />;
      
      // AI Agents sections
      case 'n8n-agents':
        return <N8nAgents />;
      
      // Leads Management - Dynamic funnel routing
      case 'leads':
        return <LeadsManagement funnelId={funnelId} />;
      
      // API sections
      case 'api-tokens':
        return <ApiTokens />;
      case 'api-setup':
        return <ApiSetup />;
      
      // Users sections
      case 'manage-users':
        return <ManageUsers />;
      
      default:
        // Fallback placeholder for future CRM sections (Settings, API, Users, Integrations)
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">This section is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ANIMATED BACKGROUND ELEMENTS
          Creates subtle floating orbs with pulse animations for visual depth
          Uses design system tokens for consistent theming */}
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      {/* MAIN LAYOUT CONTAINER */}
      <div className="relative z-10 flex">
        {/* COLLAPSIBLE SIDEBAR NAVIGATION
            Features glassmorphism design with smooth collapse/expand animations
            Handles routing between different dashboard sections */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* MAIN CONTENT AREA
            Responsive container that adjusts margin based on sidebar state
            Uses Framer Motion for smooth transitions when sidebar collapses/expands */}
        <motion.main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
          initial={false}
          animate={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
        >
          <div className="p-8">
            {/* DASHBOARD CONTENT WITH PAGE TRANSITIONS
                AnimatePresence enables smooth transitions between different dashboard views
                Each dashboard change triggers a fade + slide animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderDashboard()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Index;
