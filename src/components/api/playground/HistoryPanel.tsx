/**
 * History Panel Component
 * Shows request history
 */

import React from 'react';
import { Clock, Play, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiRequest, METHOD_COLORS } from './types';

interface HistoryPanelProps {
  history: ApiRequest[];
  onSelectRequest: (request: ApiRequest) => void;
  onDuplicateRequest: (request: ApiRequest) => void;
  onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectRequest,
  onDuplicateRequest,
  onClearHistory,
}) => {
  const { t, language } = useLanguage();

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(language === 'pt-BR' ? 'pt-BR' : language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-card/50 border-l border-border/50">
      <div className="p-3 border-b border-border/50">
        <h3 className="text-sm font-medium">{t('api.playground.panel.history')}</h3>
      </div>
      <div className="p-2 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-destructive"
          onClick={onClearHistory}
          disabled={history.length === 0}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {t('api.playground.history.clear')}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {t('api.playground.history.empty')}
            </div>
          ) : (
            history.map((request) => (
              <div
                key={request.id}
                className="group p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onSelectRequest(request)}
              >
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${METHOD_COLORS[request.method]}`}>
                    {request.method}
                  </span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {request.url || t('api.playground.no-url')}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                    {formatTimestamp(request.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRequest(request);
                    }}
                  >
                    <Play className="h-2.5 w-2.5 mr-0.5" />
                    {t('api.playground.actions.run')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateRequest(request);
                    }}
                  >
                    <Copy className="h-2.5 w-2.5 mr-0.5" />
                    {t('api.playground.actions.duplicate')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
