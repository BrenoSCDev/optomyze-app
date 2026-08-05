/**
 * MANAGE AI AGENTS PAGE
 *
 * List of the company's native AI Agents with status toggles, channel
 * binding chips and create/edit/delete actions. Agents require the OpenAI
 * integration to be installed and connected.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MessageSquare,
  Zap,
  FlaskConical,
  Plug,
} from 'lucide-react';
import { SiWhatsapp, SiInstagram, SiOpenai } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import api from '@/services/api';
import {
  AiAgent,
  getAiAgents,
  updateAiAgentStatus,
  deleteAiAgent,
} from '@/services/aiAgentApi';
import AiAgentStudio from './AiAgentStudio';

const ManageAiAgents: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAiAvailable, setOpenAiAvailable] = useState<boolean | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<AiAgent | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const [agentsData, availability] = await Promise.all([
        getAiAgents(),
        api.get('/api/integrations/available'),
      ]);
      setAgents(agentsData);
      setOpenAiAvailable(!!availability.data.openai_available);
    } catch (error) {
      console.error('Error fetching AI agents:', error);
      toast({
        title: t('ai-agents.fetch-failed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleToggleStatus = async (agent: AiAgent) => {
    const newStatus = agent.status === 'enabled' ? 'disabled' : 'enabled';

    setTogglingIds(prev => new Set(prev).add(agent.id));
    try {
      const updated = await updateAiAgentStatus(agent.id, newStatus);
      setAgents(prev => prev.map(a => (a.id === agent.id ? updated : a)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: t('ai-agents.status-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(agent.id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingAgent) return;

    try {
      await deleteAiAgent(deletingAgent.id);
      setAgents(prev => prev.filter(a => a.id !== deletingAgent.id));
      toast({ title: t('ai-agents.deleted') });
    } catch (error) {
      console.error('Error deleting AI agent:', error);
      toast({ title: t('ai-agents.delete-failed'), variant: 'destructive' });
    } finally {
      setDeletingAgent(null);
    }
  };

  const openCreate = () => {
    setEditingAgent(null);
    setShowFormModal(true);
  };

  const openEdit = (agent: AiAgent) => {
    setEditingAgent(agent);
    setShowFormModal(true);
  };

  const channelIcon = (channel: string) =>
    channel === 'whatsapp'
      ? <SiWhatsapp className="w-3 h-3 text-[#25D366]" />
      : <SiInstagram className="w-3 h-3 text-[#E1306C]" />;

  return (
    <div className="bg-background">
      <div className="px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{t('ai-agents.manage.title')}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium leading-none text-blue-600 dark:text-blue-400">
                  <FlaskConical className="w-3 h-3" />
                  Beta
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('ai-agents.manage.description')}
              </p>
            </div>
          </div>

          <Button onClick={openCreate} disabled={openAiAvailable === false}>
            <Plus className="w-4 h-4" />
            {t('ai-agents.create')}
          </Button>
        </div>

        <div className="border-b border-border mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : openAiAvailable === false ? (
          /* OpenAI integration missing */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <SiOpenai className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t('ai-agents.no-integration-title')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-4">
              {t('ai-agents.no-integration-description')}
            </p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/?section=integrations')}
            >
              <Plug className="w-4 h-4" />
              {t('ai-agents.go-to-integrations')}
            </Button>
          </div>
        ) : agents.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {t('ai-agents.empty-title')}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mb-4">
              {t('ai-agents.empty-description')}
            </p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              {t('ai-agents.create')}
            </Button>
          </div>
        ) : (
          /* Agent cards */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div
                key={agent.id}
                className="group relative flex flex-col bg-card border border-border/60 rounded-2xl p-4 transition-colors duration-base ease-standard hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.model}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {togglingIds.has(agent.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={agent.status === 'enabled'}
                        onCheckedChange={() => handleToggleStatus(agent)}
                      />
                    )}
                  </div>
                </div>

                {agent.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
                )}

                {/* Channel bindings */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {agent.channel_bindings.length === 0 ? (
                    <Badge variant="secondary" className="text-[11px]">
                      {t('ai-agents.no-channels')}
                    </Badge>
                  ) : (
                    agent.channel_bindings.map(binding => (
                      <Badge
                        key={`${binding.channelable_type}-${binding.channelable_id}`}
                        variant="outline"
                        className="gap-1 text-[11px]"
                      >
                        {channelIcon(binding.channel)}
                        {binding.label}
                      </Badge>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {agent.execution_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {agent.response_delay_seconds}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(agent)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingAgent(agent)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit studio (slide-up panel with live chat preview) */}
        <AiAgentStudio
          open={showFormModal}
          onOpenChange={setShowFormModal}
          agent={editingAgent}
          onSaved={fetchAgents}
        />

        {/* Delete confirmation */}
        <AlertDialog open={!!deletingAgent} onOpenChange={(open) => !open && setDeletingAgent(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('ai-agents.delete-confirm-title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('ai-agents.delete-confirm-description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('ai-agents.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ManageAiAgents;
