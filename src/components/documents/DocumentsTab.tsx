import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  documentService, isDocumentOpen, type DocumentRecord,
} from '@/services/documentsApi';
import { SignerStatusBadge } from '@/components/signatures/SignatureStatusBadge';
import DocumentStatusBadge from './DocumentStatusBadge';
import NewDocumentModal from './NewDocumentModal';
import SendForSignatureModal from './SendForSignatureModal';
import {
  Loader2, Plus, Download, Send, XCircle, FileSignature,
  AlertTriangle, RefreshCw, FileCog,
} from 'lucide-react';

interface DocumentsTabProps {
  leadId?: number | null;
  saleId?: number | null;
  /** Prefills the first signer when sending. */
  defaultSigner?: { name?: string; email?: string; phone?: string; leadId?: number };
}

/**
 * The documents attached to one lead or deal.
 *
 * Mounted on both record types with the same props, so the two views cannot
 * drift apart. A deal legitimately has several — proposal, main contract,
 * maintenance addendum, NDA — so this is a list, not a single slot.
 *
 * Polls only while something is out for signature: completion arrives by
 * webhook from outside the app and there is no push channel for it. The
 * interval is unhurried because signing takes minutes to days, and it stops
 * the moment nothing is outstanding.
 */
const POLL_INTERVAL_MS = 30_000;

const DocumentsTab: React.FC<DocumentsTabProps> = ({ leadId, saleId, defaultSigner }) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [sendTarget, setSendTarget] = useState<DocumentRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DocumentRecord | null>(null);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);

    try {
      const { data } = await documentService.list({
        lead_id: leadId ?? undefined,
        sale_id: saleId ?? undefined,
        per_page: 50,
      });
      setDocuments(data);
    } catch {
      if (!quiet) {
        toast({ title: t('documents.tab.load-failed'), variant: 'destructive' });
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [leadId, saleId, toast, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const hasOpen = documents.some((doc) => isDocumentOpen(doc.status));

    if (!hasOpen) {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (pollRef.current) return;

    pollRef.current = window.setInterval(() => load(true), POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [documents, load]);

  const handleGenerate = async (document: DocumentRecord) => {
    setBusyId(document.id);
    try {
      await documentService.generate(document.id);
      toast({ title: t('documents.tab.generated') });
      await load(true);
    } catch (error: any) {
      toast({
        title: t('documents.tab.generate-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;

    setBusyId(cancelTarget.id);
    try {
      await documentService.cancel(cancelTarget.id);
      toast({ title: t('documents.tab.cancelled') });
      await load(true);
    } catch (error: any) {
      toast({
        title: t('documents.tab.cancel-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
      setCancelTarget(null);
    }
  };

  const handleDownload = async (document: DocumentRecord) => {
    try {
      const blob = await documentService.download(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: t('documents.tab.file-unavailable'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{t('documents.tab.heading')}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => load()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('documents.tab.new')}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileSignature className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{t('documents.tab.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{document.number}</span>
                    <span className="font-medium text-sm truncate">{document.title}</span>
                    <DocumentStatusBadge status={document.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {document.type_label}
                    {document.version_number ? ` · v${document.version_number}` : ''}
                    {document.sent_at && ` · ${t('documents.tab.sent-on').replace('{date}', new Date(document.sent_at).toLocaleDateString())}`}
                    {document.signed_at && ` · ${t('documents.tab.signed-on').replace('{date}', new Date(document.signed_at).toLocaleDateString())}`}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {document.is_editable && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === document.id}
                      onClick={() => handleGenerate(document)}
                      title={t('documents.tab.generate')}
                    >
                      {busyId === document.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <FileCog className="w-3.5 h-3.5" />}
                    </Button>
                  )}

                  {document.has_pdf && (
                    <Button size="sm" variant="outline" onClick={() => handleDownload(document)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}

                  {document.status === 'ready_to_send' && (
                    <Button size="sm" onClick={() => setSendTarget(document)}>
                      <Send className="w-3.5 h-3.5 mr-1" /> {t('documents.tab.send')}
                    </Button>
                  )}

                  {!['signed', 'cancelled', 'archived', 'expired'].includes(document.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={busyId === document.id}
                      onClick={() => setCancelTarget(document)}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {document.signature?.signers?.length ? (
                <div className="flex flex-wrap gap-2">
                  {document.signature.signers.map((signer) => (
                    <div
                      key={signer.id}
                      className="flex items-center gap-1.5 text-xs bg-muted/40 rounded-md px-2 py-1"
                    >
                      <span>{signer.name}</span>
                      <SignerStatusBadge status={signer.status} />
                    </div>
                  ))}
                </div>
              ) : null}

              {document.signature?.last_error && (
                <Alert variant="destructive" size="sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <AlertDescription className="text-xs break-words">
                    {document.signature.last_error}
                  </AlertDescription>
                </Alert>
              )}

              {/* The signature is legally complete either way; only our
                  archived copy is outstanding, and saying so beats silence. */}
              {document.signature?.documents?.some((d) => d.download_status === 'unavailable') && (
                <Alert size="sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <AlertDescription className="text-xs">
                    {t('documents.tab.copy-unavailable')}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}

      <NewDocumentModal
        open={showNew}
        onOpenChange={setShowNew}
        leadId={leadId}
        saleId={saleId}
        onCreated={() => load(true)}
      />

      <SendForSignatureModal
        open={sendTarget !== null}
        onOpenChange={(open) => !open && setSendTarget(null)}
        document={sendTarget}
        defaultSigner={defaultSigner}
        onSent={() => load(true)}
      />

      <AlertDialog open={cancelTarget !== null} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.tab.cancel-title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.tab.cancel-description').replace('{title}', cancelTarget?.title ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('documents.tab.cancel-back')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>
              {t('documents.tab.cancel-confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentsTab;
