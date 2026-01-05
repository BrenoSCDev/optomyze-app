/**
 * BUDGET SECTION
 * 
 * Displays budget creation option for ERP module companies
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface BudgetSectionProps {
  onCreateBudget?: () => void;
}

const BudgetSection = ({ onCreateBudget }: BudgetSectionProps) => {
  const { t } = useLanguage();
  const erpUrl = import.meta.env.VITE_ERP_URL;

  const handleCreateBudget = () => {
    if (onCreateBudget) {
      onCreateBudget();
    } else if (erpUrl) {
      window.open(erpUrl, '_blank');
    }
  };

  return (
    <motion.div 
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          {t('lead-details.budget')}
        </h3>
        <Button 
          onClick={handleCreateBudget} 
          size="sm"
          className="bg-primary hover:bg-primary/80"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('lead-details.create-budget')}
        </Button>
      </div>

      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">{t('lead-details.no-budgets')}</p>
      </div>
    </motion.div>
  );
};

export default BudgetSection;
