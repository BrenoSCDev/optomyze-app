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

import React, { useState, useEffect } from 'react';
import { RefreshCw, Bot, Workflow, Clock, Loader2, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../hooks/use-toast';
import { SiN8N, SiWhatsapp, SiInstagram, SiTelegram } from "react-icons/si";
import { BiLogoGmail } from "react-icons/bi";
import api from '../../services/api';
import ExecutionsModal from './ExecutionsModal';

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
  created_at?: string;
  updated_at?: string;
}

const N8nAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [executionsModalOpen, setExecutionsModalOpen] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  // Function to get platform icon
  const getPlatformIcon = (platform: string) => {
    const iconProps = { className: "w-6 h-6 text-primary" };
    
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <SiWhatsapp {...iconProps} />;
      case 'instagram':
        return <SiInstagram {...iconProps} />;
      case 'telegram':
        return <SiTelegram {...iconProps} />;
      case 'gmail':
        return <BiLogoGmail {...iconProps} />;
      case 'sms':
        return <MessageSquare {...iconProps} />;
      case 'google calendar':
      case 'calendar':
        return <Calendar {...iconProps} />;
      default:
        return <Workflow {...iconProps} />;
    }
  };

  // Fetch agents when component mounts
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      
      try {
        const response = await api.get('/api/integrations/agents/n8n');
        
        if (response.data && response.data.data) {
          setAgents(response.data.data);
        }
      } catch (error) {
        toast({
          title: t('common.error'),
          description: "Failed to load agents",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [t, toast]);

  const handleViewExecutions = async (agent: Agent) => {
    setSelectedAgent(agent);
    setExecutionsModalOpen(true);
    setExecutionsLoading(true);
    
    try {
      const response = await api.get(`/api/integrations/agents/n8n/executions/${agent.id}`);
      
      if (response.data && response.data.executions) {
        setExecutions(response.data.executions);
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to load executions",
        variant: "destructive",
      });
    } finally {
      setExecutionsLoading(false);
    }
  };

  const handleSynchronize = async () => {
    setIsSyncing(true);
    
    try {
      const response = await api.get('/api/integrations/n8n/workflows');
      
      if (response.data && response.data.agents_created) {
        // Update agents with the newly created/synchronized agents
        setAgents(response.data.agents_created);
        
        toast({
          title: t('common.success'),
          description: `${response.data.message || 'Workflows synchronized successfully'}`,
        });
      } else {
        toast({
          title: t('common.success'),
          description: "Workflows synchronized successfully",
        });
      }
      
      setLastSync(new Date());
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to synchronize workflows",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
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
            disabled={isSyncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('agents.n8n.synchronizing') : t('agents.n8n.synchronize')}
          </Button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          /* Loading State */
          <div className="glass-card p-12 text-center">
            <div className="w-24 h-24 bg-muted/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
            </div>
            
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Loading AI Agents...
            </h3>
            
            <p className="text-muted-foreground">
              Please wait while we fetch your n8n agents
            </p>
          </div>
        ) : agents.length === 0 ? (
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
              disabled={isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('agents.n8n.synchronizing') : t('agents.n8n.synchronize')}
            </Button>
          </div>
        ) : (
          /* Enhanced Agents Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="glass-card p-6 hover:border-primary/50 transition-all duration-300 group">
                {/* Main Content - Horizontal Layout */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Platform Icon */}
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    {getPlatformIcon(agent.platform)}
                  </div>
                  
                  {/* Agent Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate text-lg">
                        {agent.agent_name}
                      </h3>
                      
                      {/* Enhanced Status Indicator */}
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.status === 'active' 
                            ? 'bg-emerald-500 animate-pulse' 
                            : 'bg-slate-400'
                        }`} />
                        <span className={`text-xs font-medium ${
                          agent.status === 'active' 
                            ? 'text-emerald-500' 
                            : 'text-slate-400'
                        }`}>
                          {agent.status === 'active' ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Platform Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium capitalize">
                        {agent.platform}
                      </span>
                      
                      {agent.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {agent.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats Row */}
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/20 rounded-lg">
                  {/* <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{agent.execution_count}</div>
                      <div className="text-xs text-muted-foreground">Executions</div>
                    </div>
                    
                    <div className="w-px h-8 bg-border" />
                    
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">
                        {agent.last_execution_at ? 'Active' : 'Never'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {agent.last_execution_at 
                          ? formatLastSync(new Date(agent.last_execution_at)).split(',')[0]
                          : 'Last run'
                        }
                      </div>
                    </div>
                  </div> */}
                  <span className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    Created {new Date(agent.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Footer with additional info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>ID: {agent.workflow_id || 'N/A'}</span>
                                    <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleViewExecutions(agent)}
                  >
                    <Clock className="w-3 h-3" />
                    View Executions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Executions Modal */}
        <ExecutionsModal
          isOpen={executionsModalOpen}
          onClose={() => {
            setExecutionsModalOpen(false);
            setSelectedAgent(null);
            setExecutions([]);
          }}
          executions={executions}
          agentName={selectedAgent?.agent_name || ''}
          isLoading={executionsLoading}
        />
      </div>
    </div>
  );
};

export default N8nAgents;