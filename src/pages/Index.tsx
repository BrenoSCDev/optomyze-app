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
import TopHeader from '@/components/layout/TopHeader';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import PlanUsage from '@/components/dashboards/PlanUsage';
import MetaAds from '@/components/dashboards/MetaAds';
import GoogleAds from '@/components/dashboards/GoogleAds';
import GoogleAnalytics from '@/components/dashboards/GoogleAnalytics';
import TagsDashboard from '@/components/dashboards/TagsDashboard';
import LanguagesDashboard from '@/components/dashboards/LanguagesDashboard';
import FunnelsDashboard from '@/components/dashboards/FunnelsDashboard';
import LeadsManagement from '@/components/leads/LeadsManagement';
import IntegrationsApps from '@/components/integrations/IntegrationsApps';
import IntegrationPanel from '@/components/integrations/IntegrationPanel';
import N8nAgents from '@/components/agents/N8nAgents';
import OptomyzeAgents from '@/components/agents/OptomyzeAgents';
import ApiTokens from '@/components/api/ApiTokens';
import ApiSetup from '@/components/api/ApiSetup';
import { ApiPlayground } from '@/components/api/playground';
import ManageUsers from '@/components/users/ManageUsers';
import { ManageTeams } from '@/components/teams';
import { ManageRoles } from '@/components/roles';
import WhatsAppInbox from '@/components/chat/WhatsAppInbox';
import OptomyzeInbox from '@/components/inbox/OptomyzeInbox';
import OptomyzeCalendar from '@/components/calendars/OptomyzeCalendar';
import ManageProducts from '@/components/products/ManageProducts';
import CrmPanel from '@/components/settings/CrmPanel';
import ContractsPlaceholder from '@/components/placeholders/ContractsPlaceholder';
import LeadActivityDashboard from '@/components/reports/LeadActivityDashboard';
import TasksDashboard from '@/components/reports/TasksDashboard';
import SupportPlaceholder from '@/components/placeholders/SupportPlaceholder';
import OptusChat from '@/components/support/OptusChat';
import OpenTicket from '@/components/support/OpenTicket';
import { ManageLeadCompanies } from '@/components/companies';

const Index = () => {
  // Sidebar collapse state - controls whether sidebar is minimized or expanded
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Mobile sidebar open state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Track mobile breakpoint
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
      case 'plan-usage':
        return <PlanUsage />; // Plan usage and limits dashboard
      case 'meta-ads':
        return <MetaAds />; // Facebook/Instagram advertising analytics
      case 'google-ads':
        return <GoogleAds />; // Google Ads campaign performance data
      case 'google-analytics':
        return <GoogleAnalytics />; // Website traffic and user behavior metrics
      
      // Settings sections
      case 'crm-panel':
        return <CrmPanel />;
      case 'languages':
        return <LanguagesDashboard />; // Language selection interface
      case 'funnels':
        return <FunnelsDashboard />; // Funnels management interface
      case 'tags':
        return <TagsDashboard />; // Tags management interface
      case 'companies':
        return <ManageLeadCompanies />; // Lead company management
      case 'lead-activity':
        return <LeadActivityDashboard />;
      case 'report-tasks':
        return <TasksDashboard />;
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
      case 'integration-panel':
        return <IntegrationPanel />;
      
      // AI Agents sections
      case 'n8n-agents':
        return <N8nAgents />;
      case 'optomyze-agents':
        return <OptomyzeAgents />;
      
      // Leads Management - Dynamic funnel routing
      case 'leads':
        return <LeadsManagement funnelId={funnelId} />;
      
      // API sections
      case 'api-tokens':
        return <ApiTokens />;
      case 'api-setup':
        return <ApiSetup />;
      case 'api-playground':
        return <ApiPlayground />;
      
      // Organization sections (renamed from Users)
      case 'manage-users':
        return <ManageUsers />;
      case 'manage-teams':
        return <ManageTeams />;
      case 'manage-roles':
        return <ManageRoles />;
      
      // Chat sections
      case 'whatsapp-inbox':
        return <WhatsAppInbox />;
      case 'optomyze-inbox':
        return <OptomyzeInbox />;
      
      // Calendars sections
      case 'optomyze-calendar':
        return <OptomyzeCalendar />;
      
      // Products sections
      case 'manage-products':
        return <ManageProducts />;
      
      // Contracts section
      case 'model-contracts':
      case 'list-contracts':
        return <ContractsPlaceholder />;
      
      // Support section
      case 'open-ticket':
        return <OpenTicket />;
      case 'talk-to-optus':
        return <OptusChat />;
      
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

        {/* FIXED TOP HEADER */}
        <TopHeader sidebarCollapsed={sidebarCollapsed} onMobileMenuToggle={() => setMobileSidebarOpen(true)} />

        {/* MAIN LAYOUT CONTAINER */}
        <div className="relative z-10 flex pt-16">
          {/* COLLAPSIBLE SIDEBAR NAVIGATION */}
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            activeSection={activeSection}
            onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* MAIN CONTENT AREA - no left margin on mobile, sidebar-aware on desktop */}
        <motion.main
          className="flex-1 transition-all duration-300"
          initial={false}
          animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256) }}
        >
          <div className="p-4 sm:p-8">
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
