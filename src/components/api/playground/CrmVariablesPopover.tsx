/**
 * CRM Variables Popover Component
 * Quick insert for CRM-specific variables
 */

import React from 'react';
import { Variable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { CRM_VARIABLES, CrmVariable } from './types';

interface CrmVariablesPopoverProps {
  onInsert: (variable: string) => void;
}

export const CrmVariablesPopover: React.FC<CrmVariablesPopoverProps> = ({ onInsert }) => {
  const { t } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Variable className="h-3.5 w-3.5 mr-1" />
          {t('api.playground.variables')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b border-border/50">
          <h4 className="text-sm font-medium">{t('api.playground.variables.title')}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t('api.playground.variables.description')}
          </p>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto">
          {CRM_VARIABLES.map((variable) => (
            <button
              key={variable.key}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              onClick={() => onInsert(variable.key)}
            >
              <div>
                <span className="text-sm font-mono text-primary">{variable.key}</span>
                <p className="text-xs text-muted-foreground">{variable.label}</p>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {variable.example}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
