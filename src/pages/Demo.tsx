import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import { mockPeriodicData, mockMonthlyChartsData } from '@/data/mockMetricsData';
import { useMenuOrder } from '@/contexts/MenuOrderContext';

const Demo = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { navLayout } = useMenuOrder();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const useHeaderLayout = navLayout === 'header' && !isMobile;

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
        activeSection="optomyze-metrics"
        onSectionChange={() => {}}
        headerNavMode={useHeaderLayout}
      />

      <div className="relative z-10 flex pt-16">
        {!useHeaderLayout && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeSection="optomyze-metrics"
            onSectionChange={() => {}}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {useHeaderLayout && isMobile && (
          <Sidebar
            isCollapsed={false}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeSection="optomyze-metrics"
            onSectionChange={() => {}}
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
                key="demo-metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <OptomyzeMetrics
                  demoMode
                  demoPeriodicData={mockPeriodicData}
                  demoMonthlyData={mockMonthlyChartsData}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default Demo;
