import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import MetaAds from '@/components/dashboards/MetaAds';
import GoogleAds from '@/components/dashboards/GoogleAds';
import GoogleAnalytics from '@/components/dashboards/GoogleAnalytics';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('optomyze-metrics');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderDashboard = () => {
    switch (activeSection) {
      case 'optomyze-metrics':
        return <OptomyzeMetrics />;
      case 'meta-ads':
        return <MetaAds />;
      case 'google-ads':
        return <GoogleAds />;
      case 'google-analytics':
        return <GoogleAnalytics />;
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
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      {/* Layout */}
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <motion.main
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
          initial={false}
          animate={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
        >
          <div className="p-8">
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
