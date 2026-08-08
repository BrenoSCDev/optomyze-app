import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { DOCUMENT_STATUS_KEYS, type DocumentStatus } from '@/services/documentsApi';

/**
 * The lifecycle pill.
 *
 * Colours encode who owes the next move: neutral while it is being drafted,
 * amber while the company owes something (approval, sending), blue while the
 * counterparty does, green when done, red when it went wrong.
 */
const STYLES: Record<DocumentStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  pending_approval: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  ready_to_send: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  waiting_signature: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  partially_signed: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  signed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  expired: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  archived: 'bg-muted text-muted-foreground border-border',
};

const DocumentStatusBadge: React.FC<{ status: DocumentStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const { t } = useLanguage();

  return (
    <Badge variant="outline" className={`text-[11px] ${STYLES[status]} ${className}`}>
      {t(DOCUMENT_STATUS_KEYS[status])}
    </Badge>
  );
};

export default DocumentStatusBadge;
