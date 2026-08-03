import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEVICE_PREFERENCE_KEYS } from '@/lib/devicePreferences';
import TopHeader from '@/components/layout/TopHeader';

// Lazy-loaded feature components — each becomes a separate Rollup chunk,
// dramatically reducing the monolithic bundle that was causing 400 s builds.
const OptomyzeMetrics        = lazy(() => import('@/components/dashboards/OptomyzeMetrics'));
const PlanUsage              = lazy(() => import('@/components/dashboards/PlanUsage'));
const MetaAds                = lazy(() => import('@/components/dashboards/MetaAds'));
const GoogleAds              = lazy(() => import('@/components/dashboards/GoogleAds'));
const RecordLogsDashboard    = lazy(() => import('@/components/reports/RecordLogsDashboard'));
const PreferencesPanel       = lazy(() => import('@/components/settings/PreferencesPanel'));
const BusinessProfilePanel   = lazy(() => import('@/components/settings/BusinessProfilePanel'));
const ManageContacts         = lazy(() => import('@/components/contacts/ManageContacts'));
const CrmPanel               = lazy(() => import('@/components/settings/CrmPanel'));
const LeadsManagement        = lazy(() => import('@/components/leads/LeadsManagement'));
const ManageLeadCompanies    = lazy(() => import('@/components/companies/ManageLeadCompanies').then(m => ({ default: m.ManageLeadCompanies })));
const IntegrationsApps       = lazy(() => import('@/components/integrations/IntegrationsApps'));
const N8nAgents              = lazy(() => import('@/components/agents/N8nAgents'));
const ManageAiAgents         = lazy(() => import('@/components/ai-agents/ManageAiAgents'));
const OptomyzeAgents         = lazy(() => import('@/components/agents/OptomyzeAgents'));
const ApiTokens              = lazy(() => import('@/components/api/ApiTokens'));
const AllowedOrigins         = lazy(() => import('@/components/api/AllowedOrigins'));
const ApiRequestLogs         = lazy(() => import('@/components/api/ApiRequestLogs'));
const ApiSetup               = lazy(() => import('@/components/api/ApiSetup'));
const ManageUsers            = lazy(() => import('@/components/users/ManageUsers'));
const ManageTeams            = lazy(() => import('@/components/teams/ManageTeams'));
const GlobalInbox            = lazy(() => import('@/components/inbox/global/GlobalInbox'));
const OptomyzeInbox          = lazy(() => import('@/components/inbox/OptomyzeInbox'));
const OptomyzeCalendar       = lazy(() => import('@/components/calendars/OptomyzeCalendar'));
const TaskWorkspace          = lazy(() => import('@/components/tasks/TaskWorkspace'));
const ManageProducts         = lazy(() => import('@/components/products/ManageProducts'));
const ContractsPlaceholder   = lazy(() => import('@/components/placeholders/ContractsPlaceholder'));
const OpenTicket             = lazy(() => import('@/components/support/OpenTicket'));

/**
 * Whether the sidebar was left collapsed.
 *
 * Read synchronously in useState's initialiser rather than applied by an
 * effect: the sidebar and the content margin both animate off this value, so
 * restoring it a render late would show the menu snapping shut on every load.
 *
 * localStorage rather than the server-side user preferences on purpose — how
 * much screen the menu should take is a property of the machine you are on,
 * not of the account. The same person wants it collapsed on a laptop and open
 * on a wide monitor. Being listed in DEVICE_PREFERENCE_KEYS is also what stops
 * a logout or a company switch from wiping it.
 */
const SIDEBAR_COLLAPSED_KEY = DEVICE_PREFERENCE_KEYS.sidebarCollapsed;

const readSidebarCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;   // private mode
  }
};

const Index = () => {
  const { t } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;

      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch { /* private mode — the choice just won't outlive the tab */ }

      return next;
    });
  };

  // On desktop, use header layout if selected; on mobile always use sidebar (drawer)

  const renderDashboard = () => {
    switch (activeSection) {
      case 'optomyze-metrics': return <OptomyzeMetrics />;
      case 'plan-usage': return <PlanUsage />;
      case 'meta-ads': return <MetaAds />;
      case 'google-ads': return <GoogleAds />;
      case 'crm-panel': return <CrmPanel />;
      case 'business-profile': return <BusinessProfilePanel />;
      case 'contacts': return <ManageContacts />;
      case 'preferences': return <PreferencesPanel />;
      case 'companies': return <ManageLeadCompanies />;
      case 'record-logs': return <RecordLogsDashboard />;
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
      case 'manage-agents': return <ManageAiAgents />;
      case 'n8n-agents': return <N8nAgents />;
      case 'optomyze-agents': return <OptomyzeAgents />;
      case 'leads': return <LeadsManagement funnelId={funnelId} />;
      case 'api-tokens': return <ApiTokens />;
      case 'allowed-origins': return <AllowedOrigins />;
      case 'api-logs': return <ApiRequestLogs />;
      case 'api-setup': return <ApiSetup />;
      case 'manage-users': return <ManageUsers />;
      case 'manage-teams': return <ManageTeams />;
      case 'global-inbox': return <GlobalInbox />;
      case 'optomyze-inbox': return <OptomyzeInbox />;
      case 'optomyze-calendar': return <OptomyzeCalendar />;
      case 'tasks': return <TaskWorkspace />;
      case 'manage-products': return <ManageProducts />;
      case 'model-contracts':
      case 'list-contracts': return <ContractsPlaceholder />;
      case 'open-ticket': return <OpenTicket />;
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
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileSidebarOpen(true)}
        activeSection={activeSection}
        onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
      />

      <div className="relative z-10 flex pt-16">
        {/* Sidebar: hidden on desktop when using header layout, always available on mobile */}
                  <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
            activeSection={activeSection}
            onSectionChange={(section) => { setActiveSection(section); setMobileSidebarOpen(false); }}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

        <motion.main
          className="flex-1 min-w-0 overflow-x-hidden transition-colors duration-base ease-standard"
          initial={false}
          animate={{
            marginLeft: isMobile ? 0 : (sidebarCollapsed ? 64 : 256)
          }}
        >
          {(() => {
            // Sections that own their own chrome and manage scrolling
            // internally: they get the full content box with no page padding.
            const isInboxSection = activeSection === 'global-inbox'
              || activeSection === 'optomyze-inbox'
              || activeSection === 'tasks';
            return (
              <div className={isInboxSection ? 'p-0 h-[calc(100vh-4rem)]' : 'p-4 sm:p-8'}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: isInboxSection ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: isInboxSection ? 0 : -20 }}
                    transition={{ duration: 0.3 }}
                    className={isInboxSection ? 'h-full' : ''}
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
            );
          })()}
        </motion.main>
      </div>
    </div>
  );
};

export default Index;
