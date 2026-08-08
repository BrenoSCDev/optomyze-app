import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  documentService,
  type DocumentHistoryEntry,
} from '@/services/documentsApi';
import {
  Loader2, FileText, FilePlus2, Send, PenLine, CheckCircle2, XCircle,
  Clock, Archive, Terminal, AlertTriangle, RefreshCw,
} from 'lucide-react';

interface DocumentHistoryTimelineProps {
  documentId: number;
  /** Bumped by the parent after an action, to re-pull without a full remount. */
  refreshToken?: number;
}

/**
 * Everything that ever happened to this document, newest first.
 *
 * Two channels in one list rather than two tabs: the interesting question is
 * usually "the counterparty never signed — what did we actually send them",
 * and answering it means reading business milestones and API calls against the
 * same clock. The toggle folds the technical rows away for everybody who is
 * not debugging.
 */
const DocumentHistoryTimeline: React.FC<DocumentHistoryTimelineProps> = ({
  documentId, refreshToken,
}) => {
  const { t } = useLanguage();

  const [entries, setEntries] = useState<DocumentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [technical, setTechnical] = useState(false);
  const [technicalAllowed, setTechnicalAllowed] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const response = await documentService.history(documentId, technical);
      setEntries(response.data);
      // The server decides whether the caller may see API traffic; if it
      // declined, reflect that instead of leaving a toggle that does nothing.
      if (technical && !response.technical_included) {
        setTechnicalAllowed(false);
        setTechnical(false);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [documentId, technical]);

  useEffect(() => { load(); }, [load, refreshToken]);

  if (loading && entries.length === 0) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground py-3">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t('documents.history.load-failed')}
        </span>
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={load}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {t('documents.history.title')}
        </p>

        {technicalAllowed && (
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <Terminal className="w-3 h-3" />
            {t('documents.history.technical')}
            <Switch
              checked={technical}
              onCheckedChange={setTechnical}
              className="scale-75"
            />
          </label>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          {t('documents.history.empty')}
        </p>
      ) : (
        <ol className="relative space-y-0">
          {entries.map((entry, index) => (
            <TimelineRow
              key={entry.id}
              entry={entry}
              isLast={index === entries.length - 1}
            />
          ))}
        </ol>
      )}
    </div>
  );
};

/** One row: rail, dot, then the text. */
const TimelineRow: React.FC<{ entry: DocumentHistoryEntry; isLast: boolean }> = ({
  entry, isLast,
}) => {
  const isTechnical = entry.channel === 'technical';
  const isFailure = entry.success === false;

  return (
    <li className="flex gap-3 pb-3 last:pb-0">
      {/* Rail + dot */}
      <div className="flex flex-col items-center pt-1">
        <span
          className={[
            'flex items-center justify-center rounded-full shrink-0',
            isTechnical ? 'w-4 h-4' : 'w-6 h-6',
            isFailure
              ? 'bg-destructive/10 text-destructive'
              : isTechnical
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary',
          ].join(' ')}
        >
          <EntryIcon entry={entry} />
        </span>
        {!isLast && <span className="w-px flex-1 bg-border mt-1" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={[
              'font-medium break-words',
              isTechnical ? 'text-[11px] text-muted-foreground' : 'text-xs',
              isFailure ? 'text-destructive' : '',
            ].join(' ')}
          >
            {entry.title}
          </p>
          <time
            className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0"
            dateTime={entry.at}
          >
            {new Date(entry.at).toLocaleString()}
          </time>
        </div>

        {entry.detail && (
          <p
            className={[
              'break-all',
              isTechnical
                ? 'text-[10px] font-mono text-muted-foreground/80'
                : 'text-[11px] text-muted-foreground',
            ].join(' ')}
          >
            {entry.detail}
            {entry.duration_ms ? ` · ${entry.duration_ms}ms` : ''}
          </p>
        )}

        {entry.actor && (
          <p className="text-[10px] text-muted-foreground">{entry.actor}</p>
        )}

        {entry.error && (
          <p className="text-[10px] text-destructive break-words mt-0.5">
            {entry.error}
          </p>
        )}
      </div>
    </li>
  );
};

const EntryIcon: React.FC<{ entry: DocumentHistoryEntry }> = ({ entry }) => {
  const size = entry.channel === 'technical' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  if (entry.channel === 'technical') {
    return entry.success === false
      ? <AlertTriangle className={size} />
      : <Terminal className={size} />;
  }

  switch (entry.type) {
    case 'document_created':      return <FilePlus2 className={size} />;
    case 'document_generated':    return <FileText className={size} />;
    case 'document_sent':         return <Send className={size} />;
    case 'signature_signature_started':
    case 'signature_signed':      return <PenLine className={size} />;
    case 'document_signed':
    case 'signature_completed':   return <CheckCircle2 className={size} />;
    case 'document_rejected':
    case 'signature_refused':
    case 'document_cancelled':
    case 'signature_canceled':    return <XCircle className={size} />;
    case 'document_expired':
    case 'signature_expired':     return <Clock className={size} />;
    case 'document_archived':     return <Archive className={size} />;
    default:                      return <Clock className={size} />;
  }
};

export default DocumentHistoryTimeline;
