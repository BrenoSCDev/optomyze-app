/**
 * DEAL FUNNEL PAGE
 * 
 * Dedicated page for viewing deal funnels.
 * Uses the same layout as Index but renders DealsManagement.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/layout/TopHeader';
import DealsManagement from '@/components/deals/DealsManagement';

const DealFunnel = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('deals');
  const { funnelId } = useParams();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <TopHeader sidebarCollapsed={sidebarCollapsed} />

      <div className="relative z-10 flex pt-16">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <motion.main
          className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
          initial={false}
          animate={{ marginLeft: sidebarCollapsed ? 64 : 256 }}
        >
          <div className="p-8">
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
