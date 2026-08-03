/**
 * OPTUS CHAT
 *
 * The assistant panel. History is server-side and private to the user, so this
 * component owns no persistence — it loads the thread on mount and appends.
 *
 * The user's message is shown optimistically with a negative temporary id; the
 * server's real row replaces it when the turn resolves. If the turn fails the
 * optimistic bubble stays, because the backend has already stored the question
 * and dropping it here would contradict what a reload shows.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Check, Copy, Info, Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { OptusError, OptusMessage, optusService } from '@/services/optusApi';
import OptusMarkdown from './OptusMarkdown';

/** Copy control, shown on hover over an assistant reply. */
const CopyButton: React.FC<{ content: string }> = ({ content }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          aria-label={t('optus.copy')}
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/msg:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{copied ? t('optus.copied') : t('optus.copy')}</TooltipContent>
    </Tooltip>
  );
};

const OptusChat = () => {
  const { t } = useLanguage();

  const [messages, setMessages] = useState<OptusMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    optusService.conversation()
      .then(conversation => {
        if (!cancelled) setMessages(conversation.messages);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('optus.load-failed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // Loading the thread once on mount; `t` changing must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll the panel's own viewport and nothing else. `scrollIntoView` walks
  // every scrollable ancestor including the document, which is what locked the
  // page behind the Teams chat overlay. Radix wraps children in a content div,
  // so the scroller is the viewport above it — not `parentElement`.
  useEffect(() => {
    const viewport = bottomRef.current?.closest('[data-radix-scroll-area-viewport]');
    viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;

    const optimistic: OptusMessage = {
      id: -Date.now(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      const answer = await optusService.send(question);
      setMessages(prev => [...prev, answer]);
    } catch (error) {
      const reason = error instanceof OptusError ? error.reason : 'unknown';

      toast.error(
        reason === 'not_configured' ? t('optus.error-not-configured')
          : reason === 'rate_limited' ? t('optus.error-rate-limited')
            : t('optus.error')
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [sending, t]);

  const clear = async () => {
    try {
      await optusService.clear();
      setMessages([]);
    } catch {
      toast.error(t('optus.error'));
    } finally {
      setConfirmingClear(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends, Shift+Enter breaks the line — the convention every
    // assistant uses, and the reason this is a textarea and not an input.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const suggestions = [t('optus.suggestion-1'), t('optus.suggestion-2'), t('optus.suggestion-3')];

  return (
    <div className="flex h-full min-h-0 flex-col bg-popover">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{t('optus.title')}</h2>
            <p className="truncate text-xs text-muted-foreground">{t('optus.subtitle')}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* History moved from this browser to the user's account, which
              changes who can see it and where it follows them. Worth saying. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                aria-label={t('optus.storage-info')}
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              {t('optus.storage-info')}
            </TooltipContent>
          </Tooltip>

          {messages.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmingClear(true)}
                  aria-label={t('optus.clear-chat')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{t('optus.clear-chat')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Thread */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-4/5" />
              <Skeleton className="ml-auto h-10 w-3/5" />
              <Skeleton className="h-20 w-4/5" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center px-2 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{t('optus.welcome')}</h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{t('optus.welcome-desc')}</p>

              {/* Starters double as a scope hint: these are the kinds of
                  questions Optus can actually answer. */}
              <div className="mt-5 flex w-full flex-col gap-2">
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    // `--accent` is a near-inverse of the surface in both
                    // themes, so the hover fill only reads if the label flips
                    // with it — `hover:bg-accent` alone left dark text on a
                    // dark fill in light mode, and the reverse in dark mode.
                    className="rounded-lg border border-border bg-card px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(message => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={cn('group/msg flex flex-col', isUser ? 'items-end' : 'items-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5',
                      isUser
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-muted text-foreground'
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </p>
                    ) : (
                      <OptusMarkdown content={message.content} />
                    )}
                  </div>

                  {!isUser && (
                    <div className="mt-0.5 flex h-6 items-center">
                      <CopyButton content={message.content} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('optus.thinking')}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('optus.placeholder')}
            disabled={sending}
            rows={1}
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none py-2"
          />
          <Button
            onClick={() => void send(input)}
            disabled={!input.trim() || sending}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label={t('optus.title')}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Says what Optus is for, so nobody waits on an action it can't take. */}
        <p className="mt-2 px-0.5 text-[11px] leading-snug text-muted-foreground">
          {t('optus.disclaimer')}
        </p>
      </div>

      {/* The launcher sits at z-80, above the dialog's own z-70, so the
          overlay and card are lifted past it to cover the panel they belong to. */}
      <AlertDialog open={confirmingClear} onOpenChange={setConfirmingClear}>
        <AlertDialogContent className="z-[90] max-w-md" overlayClassName="z-[90]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('optus.clear-chat')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('optus.clear-confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void clear()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('optus.clear-chat')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OptusChat;
