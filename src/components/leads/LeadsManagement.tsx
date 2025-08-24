/**
 * LEADS MANAGEMENT COMPONENT
 * 
 * Main component that renders the appropriate Kanban board based on the selected funnel
 */

import { useState } from 'react';
import { salesFunnels } from '@/data/mockLeadsData';
import KanbanBoard from './KanbanBoard';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface LeadsManagementProps {
  funnelId: string;
}

const LeadsManagement = ({ funnelId }: LeadsManagementProps) => {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const funnel = salesFunnels[funnelId as keyof typeof salesFunnels];

  if (!funnel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Funnel Not Found</h2>
          <p className="text-muted-foreground">The requested sales funnel could not be found.</p>
        </div>
      </div>
    );
  }

  const handleCreateLead = () => {
    toast.success('Create Lead feature coming soon!', {
      description: 'This will open a comprehensive lead creation form.'
    });
  };

  const handleCreateTag = () => {
    toast.success('Create Tag feature coming soon!', {
      description: 'This will open a tag creation modal with color selection.'
    });
  };

  const handleOpenFilters = () => {
    toast.success('Filters feature coming soon!', {
      description: 'This will open an advanced filtering panel.'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <KanbanBoard
        funnel={funnel}
        onCreateLead={handleCreateLead}
        onCreateTag={handleCreateTag}
        onOpenFilters={handleOpenFilters}
      />
    </motion.div>
  );
};

export default LeadsManagement;