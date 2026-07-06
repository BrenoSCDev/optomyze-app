/**
 * AI AGENT FORM MODAL
 *
 * Create/edit dialog for a native AI Agent, organized in tabs:
 * General (model/temperature/delay), Behavior (system prompt),
 * Tools (native CRM actions), Channels (account bindings), Handover.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Bot } from 'lucide-react';
import { SiWhatsapp, SiInstagram } from 'react-icons/si';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AiAgent,
  AiAgentPayload,
  AiAgentTool,
  ChannelAccount,
  createAiAgent,
  updateAiAgent,
  syncAiAgentChannels,
  getAiAgentTools,
  getChannelAccounts,
  getOpenAiModels,
} from '@/services/aiAgentApi';

interface AiAgentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AiAgent | null;
  onSaved: () => void;
}

const FALLBACK_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini'];
const MIN_DELAY = 10;

const defaultFormData = {
  name: '',
  description: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 1024,
  system_prompt: '',
  enabled_tools: [] as string[],
  response_delay_seconds: 15,
  handover_message: '',
};

const AiAgentFormModal: React.FC<AiAgentFormModalProps> = ({
  open,
  onOpenChange,
  agent,
  onSaved,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEdit = !!agent;

  const [formData, setFormData] = useState(defaultFormData);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [tools, setTools] = useState<AiAgentTool[]>([]);
  const [channelAccounts, setChannelAccounts] = useState<ChannelAccount[]>([]);
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [saving, setSaving] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const channelKey = (type: string, id: number) => `${type}:${id}`;

  const fetchMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const [toolsData, accountsData] = await Promise.all([
        getAiAgentTools(),
        getChannelAccounts(),
      ]);
      setTools(toolsData);
      setChannelAccounts(accountsData);

      try {
        const modelsData = await getOpenAiModels();
        if (modelsData.length > 0) setModels(modelsData);
      } catch {
        // Integration not configured yet — keep the fallback list.
      }
    } catch (error) {
      console.error('Error loading AI agent form data:', error);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    fetchMeta();

    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description || '',
        model: agent.model,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        system_prompt: agent.system_prompt || '',
        enabled_tools: agent.enabled_tools || [],
        response_delay_seconds: agent.response_delay_seconds,
        handover_message: agent.handover_message || '',
      });
      setSelectedChannels(new Set(
        agent.channel_bindings.map(b => channelKey(b.channelable_type, b.channelable_id))
      ));
    } else {
      setFormData(defaultFormData);
      setSelectedChannels(new Set());
    }
  }, [open, agent, fetchMeta]);

  const toggleTool = (key: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_tools: prev.enabled_tools.includes(key)
        ? prev.enabled_tools.filter(k => k !== key)
        : [...prev.enabled_tools, key],
    }));
  };

  const toggleChannel = (account: ChannelAccount) => {
    const key = channelKey(account.channelable_type, account.channelable_id);
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: t('ai-agents.form.name-required'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: AiAgentPayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        provider: 'openai',
        model: formData.model,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        system_prompt: formData.system_prompt || null,
        enabled_tools: formData.enabled_tools,
        response_delay_seconds: Math.max(MIN_DELAY, formData.response_delay_seconds),
        handover_message: formData.handover_message.trim() || null,
      };

      const saved = isEdit
        ? await updateAiAgent(agent!.id, payload)
        : await createAiAgent(payload);

      const bindings = Array.from(selectedChannels).map(key => {
        const [channelable_type, id] = key.split(':');
        return { channelable_type, channelable_id: parseInt(id, 10) };
      });

      await syncAiAgentChannels(saved.id, bindings);

      toast({ title: isEdit ? t('ai-agents.updated') : t('ai-agents.created') });
      onOpenChange(false);
      onSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving AI agent:', error);
      toast({
        title: t('ai-agents.save-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            {isEdit ? t('ai-agents.form.edit-title') : t('ai-agents.form.create-title')}
          </DialogTitle>
          <DialogDescription>{t('ai-agents.form.description')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t('ai-agents.form.tab-general')}</TabsTrigger>
            <TabsTrigger value="behavior">{t('ai-agents.form.tab-behavior')}</TabsTrigger>
            <TabsTrigger value="tools">{t('ai-agents.form.tab-tools')}</TabsTrigger>
            <TabsTrigger value="channels">{t('ai-agents.form.tab-channels')}</TabsTrigger>
            <TabsTrigger value="handover">{t('ai-agents.form.tab-handover')}</TabsTrigger>
          </TabsList>

          {/* GENERAL */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">{t('ai-agents.form.name')}</Label>
              <Input
                id="agent-name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('ai-agents.form.name-placeholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="agent-description">{t('ai-agents.form.description-label')}</Label>
              <Textarea
                id="agent-description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('ai-agents.form.model')}</Label>
                <Select
                  value={formData.model}
                  onValueChange={value => setFormData(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-max-tokens">{t('ai-agents.form.max-tokens')}</Label>
                <Input
                  id="agent-max-tokens"
                  type="number"
                  min={64}
                  max={16000}
                  value={formData.max_tokens}
                  onChange={e => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value, 10) || 1024 }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('ai-agents.form.temperature')}</Label>
                <span className="text-sm text-muted-foreground font-mono">{formData.temperature.toFixed(2)}</span>
              </div>
              <Slider
                value={[formData.temperature]}
                min={0}
                max={2}
                step={0.05}
                onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
              />
              <p className="text-xs text-muted-foreground">{t('ai-agents.form.temperature-help')}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="agent-delay">{t('ai-agents.form.delay')}</Label>
              <Input
                id="agent-delay"
                type="number"
                min={MIN_DELAY}
                max={600}
                value={formData.response_delay_seconds}
                onChange={e => setFormData(prev => ({ ...prev, response_delay_seconds: parseInt(e.target.value, 10) || MIN_DELAY }))}
              />
              <p className="text-xs text-muted-foreground">{t('ai-agents.form.delay-help')}</p>
            </div>
          </TabsContent>

          {/* BEHAVIOR */}
          <TabsContent value="behavior" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="agent-system-prompt">{t('ai-agents.form.system-prompt')}</Label>
              <Textarea
                id="agent-system-prompt"
                value={formData.system_prompt}
                onChange={e => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder={t('ai-agents.form.system-prompt-placeholder')}
                className="min-h-[320px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t('ai-agents.form.system-prompt-help')}
              </p>
            </div>
          </TabsContent>

          {/* TOOLS */}
          <TabsContent value="tools" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">{t('ai-agents.form.tools-help')}</p>
            {loadingMeta ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {tools.map(tool => (
                  <label
                    key={tool.key}
                    className={`flex items-start gap-3 rounded-lg border border-border p-3 transition-colors ${
                      tool.always_enabled ? 'opacity-70' : 'cursor-pointer hover:border-primary/40'
                    }`}
                  >
                    <Checkbox
                      checked={tool.always_enabled || formData.enabled_tools.includes(tool.key)}
                      disabled={tool.always_enabled}
                      onCheckedChange={() => toggleTool(tool.key)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{tool.label}</span>
                        {tool.always_enabled && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t('ai-agents.form.always-enabled')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CHANNELS */}
          <TabsContent value="channels" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">{t('ai-agents.form.channels-help')}</p>
            {loadingMeta ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : channelAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                {t('ai-agents.form.no-channel-accounts')}
              </p>
            ) : (
              <div className="space-y-2">
                {channelAccounts.map(account => {
                  const key = channelKey(account.channelable_type, account.channelable_id);
                  const claimedByOther = !!account.bound_agent && account.bound_agent.id !== agent?.id;

                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 rounded-lg border border-border p-3 transition-colors ${
                        claimedByOther ? 'opacity-60' : 'cursor-pointer hover:border-primary/40'
                      }`}
                    >
                      <Checkbox
                        checked={selectedChannels.has(key)}
                        disabled={claimedByOther}
                        onCheckedChange={() => toggleChannel(account)}
                      />
                      {account.channel === 'whatsapp'
                        ? <SiWhatsapp className="w-4 h-4 text-[#25D366]" />
                        : <SiInstagram className="w-4 h-4 text-[#E1306C]" />}
                      <span className="text-sm font-medium text-foreground flex-1 truncate">
                        {account.label}
                      </span>
                      {claimedByOther && (
                        <Badge variant="secondary" className="text-[10px]">
                          {t('ai-agents.form.claimed-by').replace('{agent}', account.bound_agent!.name)}
                        </Badge>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* HANDOVER */}
          <TabsContent value="handover" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="agent-handover-message">{t('ai-agents.form.handover-message')}</Label>
              <Textarea
                id="agent-handover-message"
                value={formData.handover_message}
                onChange={e => setFormData(prev => ({ ...prev, handover_message: e.target.value }))}
                placeholder={t('ai-agents.form.handover-message-placeholder')}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t('ai-agents.form.handover-message-help')}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? t('ai-agents.form.save') : t('ai-agents.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiAgentFormModal;
