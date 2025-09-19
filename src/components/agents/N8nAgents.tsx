/**
 * N8N AGENTS PAGE
 * 
 * Displays and manages n8n workflow agents with synchronization functionality.
 * Features:
 * - Empty state with synchronization button
 * - Agent list view (when agents are loaded)
 * - Synchronization status and loading states
 * - Beautiful glassmorphism design
 */

import React, { useState } from 'react';
import { RefreshCw, Bot, Workflow, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/use-toast';
import { SiN8N } from "react-icons/si";
import api from '../../services/api';

interface Agent {
  id: number;
  workflow_id: string;
  workflow_name: string;
  platform: string;
  agent_name: string;
  description: string | null;
  status: string;
  last_execution_at: string | null;
  execution_count: number;
}

const N8nAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleSynchronize = async () => {
    setIsLoading(true);
    
    try {
      const response = await api.get('/api/integrations/agents/n8n');
      
      if (response.data && response.data.data) {
        setAgents(response.data.data);
      }
      
      toast({
        title: t('common.success'),
        description: "Agents synchronized successfully",
      });
      
      setLastSync(new Date());
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to synchronize agents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastSync = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <SiN8N className="w-8 h-8 text-primary" />
              </div>
              {t('agents.n8n.title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('agents.n8n.description')}
            </p>
            
            {/* Sync Status */}
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {lastSync ? (
                <span>{t('agents.n8n.last-sync')}: {formatLastSync(lastSync)}</span>
              ) : (
                <span>{t('agents.n8n.never-synced')}</span>
              )}
            </div>
          </div>

          {/* Synchronize Button */}
          <Button
            onClick={handleSynchronize}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('agents.n8n.synchronizing') : t('agents.n8n.synchronize')}
          </Button>
        </div>

        {/* Content Area */}
        {agents.length === 0 ? (
          /* Empty State */
          <div className="glass-card p-12 text-center">
            <div className="w-24 h-24 bg-muted/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Bot className="w-12 h-12 text-muted-foreground" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('agents.n8n.no-agents')}
            </h3>
            
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t('agents.n8n.no-agents-description')}
            </p>

            <Button
              onClick={handleSynchronize}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? t('agents.n8n.synchronizing') : t('agents.n8n.synchronize')}
            </Button>
          </div>
        ) : (
          /* Agents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="glass-card p-6 hover:border-primary/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Workflow className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {agent.agent_name}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {agent.workflow_name}
                    </p>
                    
                    {agent.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {agent.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${agent.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : agent.status === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-muted/20 text-muted-foreground border border-muted/30'
                          }
                        `}>
                          {agent.status}
                        </span>
                        
                        <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full">
                          {agent.platform}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                      <span>Executions: {agent.execution_count}</span>
                      {agent.last_execution_at && (
                        <span>
                          Last: {formatLastSync(new Date(agent.last_execution_at))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default N8nAgents;