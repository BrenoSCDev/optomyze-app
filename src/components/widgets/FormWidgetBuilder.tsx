/**
 * FORM WIDGET BUILDER
 *
 * Configuration surface for a Website Form Widget: branding, the visual form
 * structure, where leads land in the CRM, and the embed snippet — with a live
 * preview of exactly what visitors will see.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Save, Globe, Plus, X, Palette, ListChecks, Settings, Code2, Tag, Eye, EyeOff, PanelBottom, SquareStack, Layout } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Widget, WidgetOptions, FormWidgetConfig, WidgetIcon, WIDGET_ICONS,
  WidgetDisplayMode, WidgetPosition,
  createWidget, updateWidget, regenerateWidgetPublicId, defaultFormConfig,
} from '../../services/widgetApi';
import { WidgetIconGlyph, WIDGET_COLOR_PRESETS } from './widgetIcons';
import FormFieldsEditor from './FormFieldsEditor';
import FormWidgetPreview from './FormWidgetPreview';
import EmbedCodeCard from './EmbedCodeCard';

/**
 * Radix Select cannot hold an empty string as an item value, so "no funnel"
 * needs a sentinel. It is mapped back to null before it reaches the config.
 */
const NO_FUNNEL = '__none__';

const DISPLAY_MODES: { value: WidgetDisplayMode; icon: typeof Layout; labelKey: string; hintKey: string }[] = [
  { value: 'inline', icon: Layout, labelKey: 'widgets.form.display-inline', hintKey: 'widgets.form.display-inline-hint' },
  { value: 'collapsible', icon: SquareStack, labelKey: 'widgets.form.display-collapsible', hintKey: 'widgets.form.display-collapsible-hint' },
  { value: 'floating', icon: PanelBottom, labelKey: 'widgets.form.display-floating', hintKey: 'widgets.form.display-floating-hint' },
];

type ApiErrorShape = {
  response?: { data?: { errors?: Record<string, string[]>; message?: string } };
};

interface FormWidgetBuilderProps {
  widget: Widget | null;
  options: WidgetOptions | null;
  /** Rendered inside the slide-up slab, which already supplies padding. */
  isEmbedded?: boolean;
  onBack: () => void;
  onSaved: (widget: Widget) => void;
}

const FormWidgetBuilder: React.FC<FormWidgetBuilderProps> = ({ widget, options, isEmbedded = false, onBack, onSaved }) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [current, setCurrent] = useState<Widget | null>(widget);
  const [name, setName] = useState(widget?.name || '');
  const [status, setStatus] = useState(widget?.status ?? 'active');
  const [domains, setDomains] = useState<string[]>(widget?.allowed_domains?.length ? widget.allowed_domains : ['']);
  const [config, setConfig] = useState<FormWidgetConfig>(widget?.config || defaultFormConfig(t));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [previewOpen, setPreviewOpen] = useState(true);

  useEffect(() => {
    setCurrent(widget);
    setName(widget?.name || '');
    setStatus(widget?.status ?? 'active');
    setDomains(widget?.allowed_domains?.length ? widget.allowed_domains : ['']);
    setConfig(widget?.config || defaultFormConfig(t));
  }, [widget, t]);

  const funnels = useMemo(() => options?.funnels ?? [], [options]);
  const selectedFunnel = useMemo(
    () => funnels.find((funnel) => funnel.id === config.mapping.funnel_id) || null,
    [funnels, config.mapping.funnel_id]
  );

  const patchConfig = (patch: Partial<FormWidgetConfig>) => setConfig((prev) => ({ ...prev, ...patch }));

  const patchContent = (patch: Partial<FormWidgetConfig['content']>) =>
    setConfig((prev) => ({ ...prev, content: { ...prev.content, ...patch } }));

  const patchTheme = (patch: Partial<FormWidgetConfig['theme']>) =>
    setConfig((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const handleSave = async () => {
    const cleanDomains = domains.map((domain) => domain.trim()).filter(Boolean);

    if (!name.trim()) {
      setActiveTab('general');
      toast({ title: t('widgets.validation.name-required'), variant: 'destructive' });
      return;
    }

    if (cleanDomains.length === 0) {
      setActiveTab('general');
      toast({ title: t('widgets.validation.domain-required'), variant: 'destructive' });
      return;
    }

    // A funnel is optional — leads may be created unfiled. Only a half-filled
    // pair is rejected, since a stage without its funnel is meaningless.
    if (config.mapping.funnel_id && !config.mapping.stage_id) {
      setActiveTab('mapping');
      toast({ title: t('widgets.validation.mapping-required'), variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: name.trim(),
        status,
        allowed_domains: cleanDomains,
        config,
      };

      const saved = current
        ? await updateWidget(current.id, payload)
        : await createWidget({ ...payload, type: 'form' });

      setCurrent(saved);
      setDomains(saved.allowed_domains.length ? saved.allowed_domains : ['']);
      onSaved(saved);

      toast({ title: t('widgets.toast.saved'), description: t('widgets.toast.saved-description') });
    } catch (error) {
      // Surface the first server-side validation message so the user knows
      // exactly which part of the config was rejected.
      const data = (error as ApiErrorShape)?.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;

      toast({
        title: t('widgets.toast.save-failed'),
        description: firstError || data?.message || t('widgets.toast.save-failed-description'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!current) return;

    try {
      const updated = await regenerateWidgetPublicId(current.id);
      setCurrent(updated);
      onSaved(updated);
      toast({ title: t('widgets.embed.regenerated'), description: t('widgets.embed.regenerated-description') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  return (
    <div className={isEmbedded ? '' : 'min-h-screen bg-background'}>
      <div className={isEmbedded ? '' : 'px-4 py-6 sm:px-6'}>
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-foreground">
              {name.trim() || t('widgets.form.untitled')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {current ? t('widgets.form.editing') : t('widgets.form.creating')}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
            <Switch
              checked={status === 'active'}
              onCheckedChange={(checked) => setStatus(checked ? 'active' : 'disabled')}
            />
            <span className="text-sm text-foreground">
              {status === 'active' ? t('widgets.status.active') : t('widgets.status.disabled')}
            </span>
          </div>

          <Button onClick={handleSave} loading={saving}>
            {!saving && <Save />}
            {t('common.save')}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Configuration */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.general')}</span>
              </TabsTrigger>
              <TabsTrigger value="fields" className="gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.fields')}</span>
              </TabsTrigger>
              <TabsTrigger value="mapping" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.mapping')}</span>
              </TabsTrigger>
              <TabsTrigger value="embed" className="gap-1.5">
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('widgets.tabs.embed')}</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── General ─────────────────────────────────────────── */}
            <TabsContent value="general" className="mt-4 space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  {t('widgets.form.name-label')}
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('widgets.form.name-placeholder')}
                />
                <p className="text-xs text-muted-foreground">{t('widgets.form.name-hint')}</p>
              </div>

              {/* Domains */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  {t('widgets.form.allowed-domains')}
                </Label>
                {domains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={domain}
                      placeholder="acme.com"
                      onChange={(e) => {
                        const next = [...domains];
                        next[index] = e.target.value;
                        setDomains(next);
                      }}
                    />
                    {domains.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => setDomains(domains.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setDomains([...domains, ''])}>
                  <Plus className="h-3.5 w-3.5" />
                  {t('widgets.form.add-domain')}
                </Button>
                <p className="text-xs text-muted-foreground">{t('widgets.form.allowed-domains-hint')}</p>
              </div>

              {/* Display mode */}
              <div className="space-y-2">
                <Label className="text-sm">{t('widgets.form.display')}</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DISPLAY_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const selected = (config.theme.display || 'inline') === mode.value;

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => patchTheme({ display: mode.value })}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium text-foreground">{t(mode.labelKey)}</span>
                        <span className="text-[11px] leading-snug text-muted-foreground">{t(mode.hintKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Launcher settings — only meaningful when the form starts closed */}
              {config.theme.display !== 'inline' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('widgets.form.launcher-text')}</Label>
                    <Input
                      value={config.theme.launcher_text || ''}
                      onChange={(e) => patchTheme({ launcher_text: e.target.value })}
                      placeholder={t('widgets.defaults.form.launcher-text')}
                    />
                    {config.theme.display === 'floating' && (
                      <p className="text-[11px] text-muted-foreground">{t('widgets.form.launcher-text-bubble-hint')}</p>
                    )}
                  </div>

                  {config.theme.display === 'floating' && (
                    <div className="space-y-1.5">
                      <Label className="text-sm">{t('widgets.form.position')}</Label>
                      <Select
                        value={config.theme.position || 'bottom-right'}
                        onValueChange={(value) => patchTheme({ position: value as WidgetPosition })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">{t('widgets.form.position-bottom-right')}</SelectItem>
                          <SelectItem value="bottom-left">{t('widgets.form.position-bottom-left')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-sm">{t('widgets.form.color')}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {WIDGET_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => patchTheme({ primary_color: preset })}
                      className={`h-7 w-7 rounded-full transition-shadow duration-fast ease-standard ${
                        config.theme.primary_color.toLowerCase() === preset.toLowerCase()
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : ''
                      }`}
                      style={{ backgroundColor: preset }}
                      aria-label={preset}
                    />
                  ))}
                  <input
                    type="color"
                    value={config.theme.primary_color}
                    onChange={(e) => patchTheme({ primary_color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded-full border-none bg-transparent"
                    title={t('widgets.form.custom-color')}
                  />
                  <code className="ml-1 font-mono text-xs text-muted-foreground">{config.theme.primary_color}</code>
                </div>
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label className="text-sm">{t('widgets.form.icon')}</Label>
                <div className="flex flex-wrap gap-2">
                  {WIDGET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => patchTheme({ icon: icon as WidgetIcon })}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                        config.theme.icon === icon
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      }`}
                      aria-label={icon}
                    >
                      <WidgetIconGlyph icon={icon as WidgetIcon} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.form.headline')}</Label>
                  <Input
                    value={config.content.title}
                    placeholder={t('widgets.defaults.form.title')}
                    onChange={(e) => patchContent({ title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">{t('widgets.form.submit-text')}</Label>
                  <Input
                    value={config.content.submit_text}
                    placeholder={t('widgets.defaults.form.submit-text')}
                    onChange={(e) => patchContent({ submit_text: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.form.subheadline')}</Label>
                <Input
                  value={config.content.description}
                  placeholder={t('widgets.defaults.form.description')}
                  onChange={(e) => patchContent({ description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.form.success-message')}</Label>
                <Textarea
                  value={config.content.success_message}
                  placeholder={t('widgets.defaults.form.success-message')}
                  onChange={(e) => patchContent({ success_message: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* ─── Fields ──────────────────────────────────────────── */}
            <TabsContent value="fields" className="mt-4">
              <FormFieldsEditor fields={config.fields} onChange={(fields) => patchConfig({ fields })} />
            </TabsContent>

            {/* ─── CRM mapping ─────────────────────────────────────── */}
            <TabsContent value="mapping" className="mt-4 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('widgets.mapping.title')}</h3>
                <p className="text-xs text-muted-foreground">{t('widgets.mapping.description')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.mapping.funnel')}</Label>
                <Select
                  value={config.mapping.funnel_id ? String(config.mapping.funnel_id) : NO_FUNNEL}
                  onValueChange={(value) =>
                    // Clearing the funnel clears the stage with it — a stage
                    // only means anything inside its own funnel.
                    patchConfig({
                      mapping: {
                        ...config.mapping,
                        funnel_id: value === NO_FUNNEL ? null : Number(value),
                        stage_id: null,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('widgets.mapping.select-funnel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_FUNNEL}>{t('widgets.mapping.no-funnel')}</SelectItem>
                    {funnels.map((funnel) => (
                      <SelectItem key={funnel.id} value={String(funnel.id)}>
                        {funnel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('widgets.mapping.stage')}</Label>
                <Select
                  value={config.mapping.stage_id ? String(config.mapping.stage_id) : ''}
                  disabled={!selectedFunnel}
                  onValueChange={(value) =>
                    patchConfig({ mapping: { ...config.mapping, stage_id: Number(value) } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('widgets.mapping.select-stage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedFunnel?.stages ?? []).map((stage) => (
                      <SelectItem key={stage.id} value={String(stage.id)}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">{t('widgets.mapping.summary-title')}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• {t('widgets.mapping.summary-lead')}</li>
                  <li>• {t('widgets.mapping.summary-custom')}</li>
                  <li>• {t('widgets.mapping.summary-source')}</li>
                </ul>
              </div>
            </TabsContent>

            {/* ─── Embed ───────────────────────────────────────────── */}
            <TabsContent value="embed" className="mt-4">
              <EmbedCodeCard
                widget={current}
                embedBaseUrl={options?.embed_base_url || ''}
                onRegenerate={current ? handleRegenerate : undefined}
              />
            </TabsContent>
          </Tabs>

          {/* Live preview */}
          <div className={isEmbedded ? 'lg:sticky lg:top-0 lg:self-start' : 'lg:sticky lg:top-6 lg:self-start'}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{t('widgets.preview.title')}</h3>
              {config.theme.display !== 'inline' && (
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen((prev) => !prev)}>
                  {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {previewOpen ? t('widgets.preview.collapse') : t('widgets.preview.expand')}
                </Button>
              )}
            </div>
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
              <FormWidgetPreview config={config} open={previewOpen} onOpenChange={setPreviewOpen} />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t('widgets.preview.hint')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormWidgetBuilder;
