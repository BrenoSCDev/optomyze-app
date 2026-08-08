import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SIGNATURE_STATUS_KEYS,
  SIGNER_STATUS_KEYS,
  type SignatureStatus,
  type SignerStatus,
} from '@/services/signatureApi';

/**
 * Status pills for requests and signers.
 *
 * The colours encode the shape of the lifecycle rather than any vendor's
 * vocabulary: amber while the CRM still owes work, blue while the outside
 * world does, green when done, red when it went wrong.
 */

const REQUEST_STYLES: Record<SignatureStatus, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  queued: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  sent: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  canceled: 'bg-muted text-muted-foreground border-border',
  refused: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  expired: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  failed: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
};

const SIGNER_STYLES: Record<SignerStatus, string> = {
  pending: 'bg-muted text-muted-foreground border-border',
  notified: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  viewed: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  signed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  refused: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  auth_failed: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
};

export const SignatureStatusBadge: React.FC<{ status: SignatureStatus }> = ({ status }) => {
  const { t } = useLanguage();

  return (
    <Badge variant="outline" className={`text-[11px] ${REQUEST_STYLES[status]}`}>
      {t(SIGNATURE_STATUS_KEYS[status])}
    </Badge>
  );
};

export const SignerStatusBadge: React.FC<{ status: SignerStatus }> = ({ status }) => {
  const { t } = useLanguage();

  return (
    <Badge variant="outline" className={`text-[11px] ${SIGNER_STYLES[status]}`}>
      {t(SIGNER_STATUS_KEYS[status])}
    </Badge>
  );
};
