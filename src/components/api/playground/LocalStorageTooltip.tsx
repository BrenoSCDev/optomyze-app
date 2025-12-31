/**
 * Local Storage Info Tooltip
 * Explains how data persistence works in the API Playground
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

export const LocalStorageTooltip: React.FC = () => {
  const { t } = useLanguage();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted/50 transition-colors">
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="end" 
          className="max-w-xs p-4 bg-popover border border-border"
        >
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">
              {t('api.playground.storage.title')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t('api.playground.storage.description')}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {t('api.playground.storage.includes')}
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>{t('api.playground.storage.includes.history')}</li>
                <li>{t('api.playground.storage.includes.variables')}</li>
                <li>{t('api.playground.storage.includes.settings')}</li>
                <li>{t('api.playground.storage.includes.templates')}</li>
              </ul>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground font-medium">
                {t('api.playground.storage.your-data')}
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>{t('api.playground.storage.persists')}</li>
                <li>{t('api.playground.storage.not-sent')}</li>
                <li>{t('api.playground.storage.local-only')}</li>
              </ul>
            </div>
            <p className="text-[10px] text-muted-foreground/70 pt-1">
              {t('api.playground.storage.clear-warning')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LocalStorageTooltip;
