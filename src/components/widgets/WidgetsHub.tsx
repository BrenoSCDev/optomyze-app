/**
 * WIDGETS HUB
 *
 * Entry point for the Widgets ecosystem. Lists every widget the company owns
 * and hands off to the matching builder. New widget types plug in by adding a
 * builder and an entry to WIDGET_TYPE_CARDS — the list, actions and embed flow
 * are shared.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Loader2, Pencil, Copy, Trash2, Power, Code2,
  Globe, LayoutTemplate, Inbox, Clock, MessagesSquare, MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';
import {
  Widget, WidgetOptions, WidgetType, FormWidgetConfig, ChatWidgetConfig,
  fetchWidgets, fetchWidgetOptions, deleteWidget, duplicateWidget, updateWidgetStatus,
} from '../../services/widgetApi';
import { WidgetIconGlyph } from './widgetIcons';
import FormWidgetBuilder from './FormWidgetBuilder';
import ChatWidgetBuilder from './ChatWidgetBuilder';
import EmbedCodeCard from './EmbedCodeCard';

type View = { mode: 'list' } | { mode: 'builder'; type: WidgetType; widget: Widget | null };

interface WidgetsHubProps {
  /** Rendered inside the slide-up slab, which already supplies padding. */
  isEmbedded?: boolean;
  /**
   * Scopes the hub to one widget type — each integration card manages only
   * its own widgets. Omit to manage every type in one place.
   */
  type?: WidgetType;
}

const WidgetsHub: React.FC<WidgetsHubProps> = ({ isEmbedded = false, type }) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [options, setOptions] = useState<WidgetOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ mode: 'list' });
  const [pendingDelete, setPendingDelete] = useState<Widget | null>(null);
  const [embedWidget, setEmbedWidget] = useState<Widget | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [widgetList, widgetOptions] = await Promise.all([fetchWidgets(type), fetchWidgetOptions()]);
      setWidgets(widgetList);
      setOptions(widgetOptions);
    } catch (error) {
      console.error('Error loading widgets:', error);
      toast({ title: t('widgets.toast.load-failed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast, type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isChat = type === 'chat';
  const HubIcon = isChat ? MessagesSquare : LayoutTemplate;

  // Header mirrors the integration card that opened this hub.
  const hubTitle = type
    ? (isChat ? t('integrations.chat-widget.name') : t('integrations.form-widget.name'))
    : t('widgets.title');
  const hubDescription = type
    ? (isChat ? t('integrations.chat-widget.description') : t('integrations.form-widget.description'))
    : t('widgets.description');
  const newWidgetLabel = isChat ? t('widgets.new-chat-widget') : t('widgets.new-form-widget');

  const handleSaved = (saved: Widget) => {
    setWidgets((prev) => {
      const exists = prev.some((widget) => widget.id === saved.id);
      return exists ? prev.map((widget) => (widget.id === saved.id ? saved : widget)) : [saved, ...prev];
    });
    setView({ mode: 'builder', type: saved.type, widget: saved });
  };

  const handleDuplicate = async (widget: Widget) => {
    try {
      const copy = await duplicateWidget(widget.id);
      setWidgets((prev) => [copy, ...prev]);
      toast({ title: t('widgets.toast.duplicated'), description: t('widgets.toast.duplicated-description') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (widget: Widget) => {
    const next = widget.status === 'active' ? 'disabled' : 'active';

    try {
      const updated = await updateWidgetStatus(widget.id, next);
      setWidgets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      await deleteWidget(pendingDelete.id);
      setWidgets((prev) => prev.filter((widget) => widget.id !== pendingDelete.id));
      toast({ title: t('widgets.toast.deleted') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    } finally {
      setPendingDelete(null);
    }
  };

  if (view.mode === 'builder') {
    const builderProps = {
      widget: view.widget,
      options,
      isEmbedded,
      onBack: () => setView({ mode: 'list' }),
      onSaved: handleSaved,
    };

    return view.type === 'chat'
      ? <ChatWidgetBuilder {...builderProps} />
      : <FormWidgetBuilder {...builderProps} />;
  }

  return (
    <div className={isEmbedded ? '' : 'min-h-screen bg-background'}>
      <div className={isEmbedded ? '' : 'px-4 py-6 sm:px-6'}>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <HubIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{hubTitle}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{hubDescription}</p>
            </div>
          </div>

          {type ? (
            <Button onClick={() => setView({ mode: 'builder', type, widget: null })}>
              <Plus className="h-4 w-4" />
              {newWidgetLabel}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('widgets.new-widget')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuItem onClick={() => setView({ mode: 'builder', type: 'form', widget: null })}>
                  <LayoutTemplate className="h-4 w-4" />
                  <div>
                    <p className="text-sm">{t('widgets.new-form-widget')}</p>
                    <p className="text-[11px] text-muted-foreground">{t('widgets.new-form-widget-hint')}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setView({ mode: 'builder', type: 'chat', widget: null })}>
                  <MessagesSquare className="h-4 w-4" />
                  <div>
                    <p className="text-sm">{t('widgets.new-chat-widget')}</p>
                    <p className="text-[11px] text-muted-foreground">{t('widgets.new-chat-widget-hint')}</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mb-6 border-b border-border" />

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : widgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HubIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('widgets.empty-title')}</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {isChat ? t('widgets.empty-description-chat') : t('widgets.empty-description')}
            </p>
            {type ? (
              <Button className="mt-5" onClick={() => setView({ mode: 'builder', type, widget: null })}>
                <Plus className="h-4 w-4" />
                {newWidgetLabel}
              </Button>
            ) : (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => setView({ mode: 'builder', type: 'form', widget: null })}>
                  <LayoutTemplate className="h-4 w-4" />
                  {t('widgets.new-form-widget')}
                </Button>
                <Button variant="outline" onClick={() => setView({ mode: 'builder', type: 'chat', widget: null })}>
                  <MessagesSquare className="h-4 w-4" />
                  {t('widgets.new-chat-widget')}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${widget.config?.theme?.primary_color ?? '#7C3AED'}1F`,
                      color: widget.config?.theme?.primary_color ?? '#7C3AED',
                    }}
                  >
                    <WidgetIconGlyph icon={widget.config?.theme?.icon ?? 'message-circle'} className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{widget.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={
                          widget.status === 'active'
                            ? 'bg-green-500/15 text-[10px] text-green-600 dark:text-green-400'
                            : 'text-[10px]'
                        }
                      >
                        {widget.status === 'active' ? t('widgets.status.active') : t('widgets.status.disabled')}
                      </Badge>
                      {!type && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          {widget.type === 'chat'
                            ? <MessagesSquare className="h-2.5 w-2.5" />
                            : <LayoutTemplate className="h-2.5 w-2.5" />}
                          {widget.type === 'chat' ? t('widgets.type.chat') : t('widgets.type.form')}
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Globe className="h-2.5 w-2.5" />
                        {widget.allowed_domains[0] || '—'}
                        {widget.allowed_domains.length > 1 && ` +${widget.allowed_domains.length - 1}`}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {[
                      {
                        key: 'edit',
                        icon: Pencil,
                        label: t('common.edit'),
                        onClick: () => setView({ mode: 'builder', type: widget.type, widget }),
                      },
                      {
                        key: 'embed',
                        icon: Code2,
                        label: t('widgets.actions.embed-code'),
                        onClick: () => setEmbedWidget(widget),
                      },
                      {
                        key: 'duplicate',
                        icon: Copy,
                        label: t('widgets.actions.duplicate'),
                        onClick: () => handleDuplicate(widget),
                      },
                      {
                        key: 'status',
                        icon: Power,
                        label: widget.status === 'active'
                          ? t('widgets.actions.disable')
                          : t('widgets.actions.enable'),
                        onClick: () => handleToggleStatus(widget),
                      },
                      {
                        key: 'delete',
                        icon: Trash2,
                        label: t('common.delete'),
                        destructive: true,
                        onClick: () => setPendingDelete(widget),
                      },
                    ].map(({ key, icon: Icon, label, onClick, destructive }) => (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={label}
                            onClick={onClick}
                            /* Explicit hover bg: the ghost variant's
                             * `hover:bg-accent` is a near-white fill, which
                             * would swallow the icon in an inline row. */
                            className={
                              destructive
                                ? 'h-8 w-8'
                                : 'h-8 w-8'
                            }
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    {widget.type === 'chat' ? <MessageSquare className="h-3 w-3" /> : <Inbox className="h-3 w-3" />}
                    {widget.submissions_count}{' '}
                    {widget.type === 'chat' ? t('widgets.card.conversations') : t('widgets.card.submissions')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(widget.updated_at), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embed code dialog */}
      <Dialog open={!!embedWidget} onOpenChange={(open) => !open && setEmbedWidget(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('widgets.embed.title')}</DialogTitle>
          </DialogHeader>
          <EmbedCodeCard widget={embedWidget} embedBaseUrl={options?.embed_base_url || ''} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('widgets.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('widgets.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WidgetsHub;
