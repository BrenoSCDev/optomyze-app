/**
 * DEAL FUNNEL PAGE
 * 
 * Dedicated page for viewing deal funnels.
 * Uses the same layout as Index but renders DealsManagement.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import DealsManagement from '@/components/deals/DealsManagement';

const DealFunnel = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeSection, setActiveSection] = useState('deals');
  const { funnelId } = useParams();
  const navigate = useNavigate();

  const handleSectionChange = useCallback((section: string) => {
    setMobileSidebarOpen(false);
    // If navigating away from deals, go to Index
    if (section !== 'deals') {
      navigate(`/?section=${section}`);
      return;
    }
    setActiveSection(section);
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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
        onSectionChange={handleSectionChange}
      />

      <div className="relative z-10 flex pt-16">
                  <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
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
          <div className="p-4 sm:p-8">
            <motion.div
              key={funnelId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {funnelId && <DealsManagement funnelId={funnelId} />}
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DealFunnel;
