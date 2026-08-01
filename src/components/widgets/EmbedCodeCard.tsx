/**
 * EMBED CODE CARD
 *
 * Shows the snippet the customer pastes into their website, plus the widget's
 * public id and the ability to rotate it (which invalidates old snippets).
 */

import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Info, KeyRound } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { Widget, buildEmbedCode } from '../../services/widgetApi';

interface EmbedCodeCardProps {
  widget: Widget | null;
  embedBaseUrl: string;
  onRegenerate?: () => Promise<void> | void;
}

const EmbedCodeCard: React.FC<EmbedCodeCardProps> = ({ widget, embedBaseUrl, onRegenerate }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!widget) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">{t('widgets.embed.save-first')}</AlertDescription>
      </Alert>
    );
  }

  const snippet = buildEmbedCode(widget, embedBaseUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('widgets.embed.copied') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t('widgets.embed.title')}</h3>
        <p className="text-xs text-muted-foreground">
          {widget.type === 'chat' ? t('widgets.embed.description-chat') : t('widgets.embed.description')}
        </p>
      </div>

      {/* Widget ID */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{t('widgets.embed.widget-id')}</span>
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{widget.public_id}</code>
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            {t('widgets.embed.regenerate')}
          </Button>
        )}
      </div>

      {/* Snippet */}
      <div className="relative">
        <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-4 pr-14 text-xs leading-relaxed text-foreground">
          <code>{snippet}</code>
        </pre>
        <Button
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
          {t('widgets.embed.domain-note')}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmbedCodeCard;
