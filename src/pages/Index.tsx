import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import { useMenuOrder } from '@/contexts/MenuOrderContext';

// Lazy-loaded feature components — each becomes a separate Rollup chunk,
// dramatically reducing the monolithic bundle that was causing 400 s builds.
const OptomyzeMetrics        = lazy(() => import('@/components/dashboards/OptomyzeMetrics'));
const PlanUsage              = lazy(() => import('@/components/dashboards/PlanUsage'));
const MetaAds                = lazy(() => import('@/components/dashboards/MetaAds'));
const GoogleAds              = lazy(() => import('@/components/dashboards/GoogleAds'));
const GoogleAnalytics        = lazy(() => import('@/components/dashboards/GoogleAnalytics'));
const TagsDashboard          = lazy(() => import('@/components/dashboards/TagsDashboard'));
const FunnelsDashboard       = lazy(() => import('@/components/dashboards/FunnelsDashboard'));
const LeadActivityDashboard  = lazy(() => import('@/components/reports/LeadActivityDashboard'));
const DealActivityDashboard  = lazy(() => import('@/components/reports/DealActivityDashboard'));
const TasksDashboard         = lazy(() => import('@/components/reports/TasksDashboard'));
const PreferencesPanel       = lazy(() => import('@/components/settings/PreferencesPanel'));
const CrmPanel               = lazy(() => import('@/components/settings/CrmPanel'));
const LeadsManagement        = lazy(() => import('@/components/leads/LeadsManagement'));
const ManageLeadCompanies    = lazy(() => import('@/components/companies/ManageLeadCompanies').then(m => ({ default: m.ManageLeadCompanies })));
const IntegrationsApps       = lazy(() => import('@/components/integrations/IntegrationsApps'));
const IntegrationPanel       = lazy(() => import('@/components/integrations/IntegrationPanel'));
const N8nAgents              = lazy(() => import('@/components/agents/N8nAgents'));
const OptomyzeAgents         = lazy(() => import('@/components/agents/OptomyzeAgents'));
const ApiTokens              = lazy(() => import('@/components/api/ApiTokens'));
const ApiSetup               = lazy(() => import('@/components/api/ApiSetup'));
const ApiPlayground          = lazy(() => import('@/components/api/playground/ApiPlayground'));
const ManageUsers            = lazy(() => import('@/components/users/ManageUsers'));
const ManageTeams            = lazy(() => import('@/components/teams/ManageTeams'));
const ManageRoles            = lazy(() => import('@/components/roles/ManageRoles'));
const WhatsAppInbox          = lazy(() => import('@/components/chat/WhatsAppInbox'));
const OptomyzeInbox          = lazy(() => import('@/components/inbox/OptomyzeInbox'));
const OptomyzeCalendar       = lazy(() => import('@/components/calendars/OptomyzeCalendar'));
const ManageProducts         = lazy(() => import('@/components/products/ManageProducts'));
const ManageProductCategories = lazy(() => import('@/components/products/ManageProductCategories'));
const ContractsPlaceholder   = lazy(() => import('@/components/placeholders/ContractsPlaceholder'));
const OptusChat              = lazy(() => import('@/components/support/OptusChat'));
const OpenTicket             = lazy(() => import('@/components/support/OpenTicket'));

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
      case 'product-categories': return <ManageProductCategories />;
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
                <Suspense fallback={
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                }>
                  {renderDashboard()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Index;
