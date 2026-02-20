import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import { useMenuOrder } from '@/contexts/MenuOrderContext';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import PlanUsage from '@/components/dashboards/PlanUsage';
import MetaAds from '@/components/dashboards/MetaAds';
import GoogleAds from '@/components/dashboards/GoogleAds';
import GoogleAnalytics from '@/components/dashboards/GoogleAnalytics';
import TagsDashboard from '@/components/dashboards/TagsDashboard';
import PreferencesPanel from '@/components/settings/PreferencesPanel';
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
import DealActivityDashboard from '@/components/reports/DealActivityDashboard';
import TasksDashboard from '@/components/reports/TasksDashboard';
import SupportPlaceholder from '@/components/placeholders/SupportPlaceholder';
import OptusChat from '@/components/support/OptusChat';
import OpenTicket from '@/components/support/OpenTicket';
import { ManageLeadCompanies } from '@/components/companies';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { navLayout } = useMenuOrder();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [activeSection, setActiveSection] = useState('optomyze-metrics');
  
  const location = useLocation();
  const { funnelId } = useParams();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [location.search]);

  useEffect(() => {
    if (funnelId) {
      setActiveSection('leads');
    }
  }, [funnelId]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // On desktop, use header layout if selected; on mobile always use sidebar (drawer)
  const useHeaderLayout = navLayout === 'header' && !isMobile;

  const renderDashboard = () => {
    switch (activeSection) {
      case 'optomyze-metrics': return <OptomyzeMetrics />;
      case 'plan-usage': return <PlanUsage />;
      case 'meta-ads': return <MetaAds />;
      case 'google-ads': return <GoogleAds />;
      case 'google-analytics': return <GoogleAnalytics />;
      case 'crm-panel': return <CrmPanel />;
      case 'preferences': return <PreferencesPanel />;
      case 'funnels': return <FunnelsDashboard />;
      case 'tags': return <TagsDashboard />;
      case 'companies': return <ManageLeadCompanies />;
      case 'lead-activity': return <LeadActivityDashboard />;
      case 'deal-activity': return <DealActivityDashboard />;
      case 'report-tasks': return <TasksDashboard />;
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
      case 'integrations': return <IntegrationsApps />;
      case 'integration-panel': return <IntegrationPanel />;
      case 'n8n-agents': return <N8nAgents />;
      case 'optomyze-agents': return <OptomyzeAgents />;
      case 'leads': return <LeadsManagement funnelId={funnelId} />;
      case 'api-tokens': return <ApiTokens />;
      case 'api-setup': return <ApiSetup />;
      case 'api-playground': return <ApiPlayground />;
      case 'manage-users': return <ManageUsers />;
      case 'manage-teams': return <ManageTeams />;
      case 'manage-roles': return <ManageRoles />;
      case 'whatsapp-inbox': return <WhatsAppInbox />;
      case 'optomyze-inbox': return <OptomyzeInbox />;
      case 'optomyze-calendar': return <OptomyzeCalendar />;
      case 'manage-products': return <ManageProducts />;
      case 'model-contracts':
      case 'list-contracts': return <ContractsPlaceholder />;
      case 'open-ticket': return <OpenTicket />;
      case 'talk-to-optus': return <OptusChat />;
      default:
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
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <TopHeader
        sidebarCollapsed={useHeaderLayout ? true : sidebarCollapsed}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        activeSection={activeSection}
        onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
        headerNavMode={useHeaderLayout}
      />

      <div className="relative z-10 flex pt-16">
        {/* Sidebar: hidden on desktop when using header layout, always available on mobile */}
        {!useHeaderLayout && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            activeSection={activeSection}
            onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* On mobile with header layout, still need mobile sidebar */}
        {useHeaderLayout && isMobile && (
          <Sidebar
            isCollapsed={false}
            onToggle={toggleSidebar}
            activeSection={activeSection}
            onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        <motion.main
          className="flex-1 transition-all duration-300"
          initial={false}
          animate={{
            marginLeft: useHeaderLayout
              ? 0
              : (isMobile ? 0 : (sidebarCollapsed ? 64 : 256))
          }}
        >
          <div className="p-4 sm:p-8">
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
