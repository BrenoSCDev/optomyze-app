import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useKanbanSensors, kanbanCollisionDetection, KANBAN_DROP_ANIMATION,
  KanbanDragPreview, KanbanDragSource,
} from '@/components/dnd/kanbanDnd';
import {
  documentService, DOCUMENT_BOARD_STATUSES, DOCUMENT_MANUAL_STATUSES,
  DOCUMENT_STATUS_KEYS, type DocumentRecord, type DocumentStatus,
} from '@/services/documentsApi';
import DocumentStatusBadge from './DocumentStatusBadge';
import NewDocumentModal from './NewDocumentModal';
import { getEcho } from '@/services/echo';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Search, FileSignature } from 'lucide-react';

/**
 * The contract pipeline, as a board.
 *
 * Only the columns a human owns accept a drop. Everything from "awaiting
 * signature" onward is set by the signature provider's webhooks, so those
 * columns render but refuse cards — dragging a card to "Signed" would put a
 * lie on a legal record, and the backend refuses it too.
 *
 * Drag behaviour comes from the shared kanban config so this board feels
 * identical to the lead funnel, the deal funnel and the task board.
 */

const DocumentCard: React.FC<{
  document: DocumentRecord;
  onOpen: (document: DocumentRecord) => void;
}> = ({ document, onOpen }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `document-${document.id}`,
    data: { document },
  });

  return (
    <KanbanDragSource isDragging={isDragging}>
      <div ref={setNodeRef} {...listeners} {...attributes}>
        <Card
          className="p-3 space-y-2 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => onOpen(document)}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">{document.number}</span>
            {document.version_number && (
              <span className="text-[10px] text-muted-foreground">v{document.version_number}</span>
            )}
          </div>

          <p className="text-sm font-medium leading-tight line-clamp-2">{document.title}</p>

          {(document.deal_name || document.lead_name) && (
            <p className="text-xs text-muted-foreground truncate">
              {document.deal_name ?? document.lead_name}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{document.type_label}</span>
            {document.value != null && (
              <span className="text-xs font-medium">
                {Number(document.value).toLocaleString(undefined, {
                  style: 'currency',
                  currency: document.currency || 'BRL',
                })}
              </span>
            )}
          </div>
        </Card>
      </div>
    </KanbanDragSource>
  );
};

const BoardColumn: React.FC<{
  status: DocumentStatus;
  documents: DocumentRecord[];
  onOpen: (document: DocumentRecord) => void;
}> = ({ status, documents, onOpen }) => {
  const { t } = useLanguage();
  const droppable = DOCUMENT_MANUAL_STATUSES.includes(status);
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}`, disabled: !droppable });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] rounded-xl border bg-muted/20 p-3 transition-colors ${
        isOver && droppable ? 'border-primary/50 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium">{t(DOCUMENT_STATUS_KEYS[status])}</span>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
          {documents.length}
        </span>
      </div>

      <div className="space-y-2 min-h-[80px]">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} onOpen={onOpen} />
        ))}
      </div>

      {/* Says why a column will not accept a card, rather than silently refusing. */}
      {!droppable && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
          {t('documents.board.provider-controlled')}
        </p>
      )}
    </div>
  );
};

interface DocumentsBoardProps {
  onOpenDocument: (document: DocumentRecord) => void;
}

const DocumentsBoard: React.FC<DocumentsBoardProps> = ({ onOpenDocument }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const sensors = useKanbanSensors();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<DocumentRecord | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { user } = useAuth() as { user: { id: number; company_id: number } | null };

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await documentService.board();
      setDocuments(data);
    } catch {
      if (!quiet) toast({ title: t('documents.tab.load-failed'), variant: 'destructive' });
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { load(); }, [load]);

  /**
   * Live board.
   *
   * Most of what moves a contract card is nobody in this tab: the counterparty
   * signs or refuses and a webhook writes the change on a queue worker. Without
   * this the board is a photograph, and the moment it matters most — everyone
   * watching a contract land — is exactly when it would be wrong.
   *
   * Patching in place rather than refetching, so an open dropdown, a scroll
   * position and a half-typed search survive somebody else's signature.
   */
  useEffect(() => {
    if (!user?.company_id) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`company.${user.company_id}`);

    channel.listen('.document.live', (payload: any) => {
      setDocuments((current) => {
        if (payload.action === 'deleted') {
          return current.filter((d) => String(d.id) !== String(payload.document_id));
        }

        const incoming: DocumentRecord = payload.document;
        if (!incoming) return current;

        const index = current.findIndex((d) => String(d.id) === String(incoming.id));

        if (index === -1) {
          // Created elsewhere, or moved back into a board status from one the
          // board does not show (archived, say).
          return DOCUMENT_BOARD_STATUSES.includes(incoming.status)
            ? [incoming, ...current]
            : current;
        }

        // Left the board entirely — archived from another tab.
        if (!DOCUMENT_BOARD_STATUSES.includes(incoming.status)) {
          return current.filter((_, i) => i !== index);
        }

        const next = [...current];
        next[index] = incoming;
        return next;
      });
    });

    return () => {
      channel.stopListening('.document.live');
    };
  }, [user?.company_id]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;

    return documents.filter((document) =>
      document.title.toLowerCase().includes(term)
      || document.number.toLowerCase().includes(term)
      || (document.lead_name ?? '').toLowerCase().includes(term)
      || (document.deal_name ?? '').toLowerCase().includes(term));
  }, [documents, search]);

  const byStatus = useMemo(() => {
    const groups: Record<string, DocumentRecord[]> = {};
    DOCUMENT_BOARD_STATUSES.forEach((status) => { groups[status] = []; });
    filtered.forEach((document) => {
      if (groups[document.status]) groups[document.status].push(document);
    });
    return groups;
  }, [filtered]);

  const handleDragStart = (event: DragStartEvent) => {
    setDragging((event.active.data.current as { document?: DocumentRecord })?.document ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const document = dragging;
    setDragging(null);

    if (!document || !event.over) return;

    const status = String(event.over.id).replace('column-', '') as DocumentStatus;

    if (status === document.status || !DOCUMENT_MANUAL_STATUSES.includes(status)) return;

    // Optimistic: waiting on the network before the card moves is what makes
    // a board feel heavy. Rolled back below if the server disagrees.
    const previous = documents;
    setDocuments((current) =>
      current.map((d) => (d.id === document.id ? { ...d, status } : d)));

    try {
      await documentService.setStatus(document.id, status);
    } catch (error: any) {
      setDocuments(previous);
      toast({
        title: t('documents.board.move-failed'),
        description: error?.response?.data?.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('documents.board.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('documents.tab.new')}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileSignature className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{t('documents.tab.empty')}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={kanbanCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {DOCUMENT_BOARD_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                documents={byStatus[status] ?? []}
                onOpen={onOpenDocument}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={KANBAN_DROP_ANIMATION}>
            {dragging && (
              <KanbanDragPreview>
                <Card className="p-3 w-[264px]">
                  <p className="text-sm font-medium line-clamp-2">{dragging.title}</p>
                  <DocumentStatusBadge status={dragging.status} className="mt-2" />
                </Card>
              </KanbanDragPreview>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <NewDocumentModal open={showNew} onOpenChange={setShowNew} onCreated={() => load(true)} />
    </div>
  );
};

export default DocumentsBoard;
