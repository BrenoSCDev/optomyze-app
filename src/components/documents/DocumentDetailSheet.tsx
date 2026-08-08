import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentService, type DocumentRecord } from '@/services/documentsApi';
import { SignerStatusBadge } from '@/components/signatures/SignatureStatusBadge';
import DocumentStatusBadge from './DocumentStatusBadge';
import DocumentHistoryTimeline from './DocumentHistoryTimeline';
import SendForSignatureModal from './SendForSignatureModal';
import {
  Loader2, Download, Send, FileCog, XCircle, History, AlertTriangle,
} from 'lucide-react';

interface DocumentDetailSheetProps {
  documentId: number | null;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}

/**
 * One document in full: header, versions, signers.
 *
 * The version list is the point of this screen. A contract is not one file but
 * a history of them, and being able to see — and download — exactly what was
 * sent on a given date is what makes the record defensible.
 */
const DocumentDetailSheet: React.FC<DocumentDetailSheetProps> = ({
  documentId, onOpenChange, onChanged,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSend, setShowSend] = useState(false);
  // Any action that changes the document also adds to its history.
  const [historyToken, setHistoryToken] = useState(0);

  const load = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      setDocument(await documentService.get(documentId));
      setHistoryToken((token) => token + 1);
    } catch {
      toast({ title: t('documents.tab.load-failed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast, t]);

  useEffect(() => { load(); }, [load]);

  const act = async (action: () => Promise<unknown>, successKey: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: t(successKey) });
      await load();
      onChanged?.();
    } catch (error: any) {
      toast({
        title: t('documents.detail.action-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const download = async (versionId?: number) => {
    if (!document) return;

    try {
      const blob = await documentService.download(document.id, versionId);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document.number}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: t('documents.tab.file-unavailable'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={documentId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[88vh] overflow-y-auto">
        {loading || !document ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs text-muted-foreground">{document.number}</span>
                {document.title}
                <DocumentStatusBadge status={document.status} />
              </DialogTitle>
              <DialogDescription>
                {document.type_label}
                {document.template_name ? ` · ${document.template_name}` : ''}
                {document.owner_name ? ` · ${document.owner_name}` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {document.is_editable && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => act(() => documentService.generate(document.id), 'documents.tab.generated')}
                  >
                    <FileCog className="w-3.5 h-3.5 mr-1.5" /> {t('documents.tab.generate')}
                  </Button>
                )}

                {document.has_pdf && (
                  <Button size="sm" variant="outline" onClick={() => download()}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> {t('documents.detail.download')}
                  </Button>
                )}

                {document.status === 'ready_to_send' && (
                  <Button size="sm" onClick={() => setShowSend(true)}>
                    <Send className="w-3.5 h-3.5 mr-1.5" /> {t('documents.tab.send')}
                  </Button>
                )}

                {!['signed', 'cancelled', 'archived', 'expired'].includes(document.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={busy}
                    onClick={() => act(() => documentService.cancel(document.id), 'documents.tab.cancelled')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> {t('documents.detail.cancel')}
                  </Button>
                )}
              </div>

              {/* Term */}
              {(document.start_date || document.end_date || document.value != null) && (
                <Card className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {document.value != null && (
                    <div>
                      <p className="text-muted-foreground">{t('documents.new.value')}</p>
                      <p className="font-medium">
                        {Number(document.value).toLocaleString(undefined, {
                          style: 'currency',
                          currency: document.currency || 'BRL',
                        })}
                      </p>
                    </div>
                  )}
                  {document.start_date && (
                    <div>
                      <p className="text-muted-foreground">{t('documents.new.start-date')}</p>
                      <p className="font-medium">{new Date(document.start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {document.end_date && (
                    <div>
                      <p className="text-muted-foreground">{t('documents.new.end-date')}</p>
                      <p className="font-medium">{new Date(document.end_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {document.renewal_date && (
                    <div>
                      <p className="text-muted-foreground">{t('documents.detail.renewal')}</p>
                      <p className="font-medium">{new Date(document.renewal_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Signers */}
              {document.signature?.signers?.length ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium">{t('documents.send.signers')}</p>
                    {document.signature.signers.map((signer) => (
                      <div
                        key={signer.id}
                        className="flex items-center justify-between gap-2 text-xs bg-muted/40 rounded-md px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <span className="font-medium">{signer.name}</span>
                          {signer.email && (
                            <span className="text-muted-foreground"> · {signer.email}</span>
                          )}
                        </div>
                        <SignerStatusBadge status={signer.status} />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {document.signature?.last_error && (
                <Alert variant="destructive" size="sm">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <AlertDescription className="text-xs break-words">
                    {document.signature.last_error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Version history — a contract is a history of files, not one. */}
              {document.versions?.length ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" /> {t('documents.detail.versions')}
                    </p>
                    {document.versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between gap-2 text-xs border border-border rounded-md px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <span className="font-medium">v{version.version_number}</span>
                          <span className="text-muted-foreground">
                            {' · '}{new Date(version.created_at).toLocaleString()}
                            {version.generated_by ? ` · ${version.generated_by}` : ''}
                          </span>
                        </div>
                        {version.has_pdf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => download(version.id)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {/* Transaction history — every milestone and, on request, every
                  provider call, on one clock. */}
              <Separator />
              <DocumentHistoryTimeline
                documentId={document.id}
                refreshToken={historyToken}
              />
            </div>

            <SendForSignatureModal
              open={showSend}
              onOpenChange={setShowSend}
              document={document}
              defaultSigner={{ name: document.lead_name ?? undefined }}
              onSent={() => { load(); onChanged?.(); }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentDetailSheet;
