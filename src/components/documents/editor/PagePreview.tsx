import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentService } from '@/services/documentsApi';
import PageCanvas, { PAGE_GAP_PX } from './PageCanvas';
import { type PageSettings, pageBox } from './pageGeometry';
import { paginateStaticHtml } from './paginateStatic';
import { Loader2, RefreshCw, UserSearch, AlertTriangle, Database } from 'lucide-react';

interface PagePreviewProps {
  templateId: number | null;
  settings: PageSettings;
  getBodyHtml: () => string;
}

interface PreviewLead {
  id: number;
  name: string;
}

/**
 * Read-only preview, rendered by the server.
 *
 * Deliberately not a client-side render of the editor's own HTML. The whole
 * value of this screen is that it answers "what will the customer receive",
 * and only the server can answer that: it resolves the template language
 * ({% if %}, {% for %}), substitutes real CRM values, and inlines image
 * assets — none of which the editor does.
 *
 * "Preview with CRM data" is the important half. A template can look perfect
 * with placeholder chips and fall apart against a real deal with fourteen line
 * items, and finding that out from a customer is the expensive way.
 */
const PagePreview: React.FC<PagePreviewProps> = ({
  templateId, settings, getBodyHtml,
}) => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<PreviewLead | null>(null);
  const [leads, setLeads] = useState<PreviewLead[]>([]);
  const [search, setSearch] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const render = useCallback(async () => {
    if (!templateId) {
      // An unsaved template has nothing to preview against — the endpoint
      // resolves variables through a stored template.
      setError(t('documents.preview.save-first'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await documentService.previewTemplate(templateId, {
        body_html: getBodyHtml(),
        lead_id: lead?.id,
      });

      setHtml(result.html);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? t('documents.preview.failed');
      const line = err?.response?.data?.line;
      setError(line ? `${message} (${t('documents.preview.line')} ${line})` : message);
    } finally {
      setLoading(false);
    }
  }, [templateId, getBodyHtml, lead, t]);

  useEffect(() => { void render(); }, [render]);

  /*
   * The preview is server-rendered HTML, not a ProseMirror document, so the
   * editor's pagination plugin cannot reach it. The same rule is applied
   * directly to the DOM here — otherwise Preview would show text straddling
   * page boundaries that the editor had correctly pushed apart.
   */
  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const box = pageBox(settings);

    const repaginate = () =>
      setPageCount(
        paginateStaticHtml(node, {
          pageHeight: box.heightPx,
          pageGap: PAGE_GAP_PX,
          marginTop: box.marginsPx.top,
          marginBottom: box.marginsPx.bottom,
        })
      );

    const frame = requestAnimationFrame(repaginate);

    // Images arrive after the HTML and change every height below them.
    const images = Array.from(node.querySelectorAll('img'));
    images.forEach((img) => img.addEventListener('load', repaginate));

    return () => {
      cancelAnimationFrame(frame);
      images.forEach((img) => img.removeEventListener('load', repaginate));
    };
  }, [html, settings]);

  // Lead search for "preview with real data". Debounced, and the endpoint
  // itself requires three characters — searching on every keystroke from the
  // first letter would scan the whole contact table.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const rows = await documentService.searchLeadsForPreview(search);
        if (!cancelled) setLeads(rows);
      } catch {
        if (!cancelled) setLeads([]);
      }
    }, 250);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <UserSearch className="h-3 w-3" />
              {lead ? lead.name : t('documents.preview.with-crm-data')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2" align="start">
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('documents.preview.search-lead')}
              className="h-8 text-xs mb-2"
            />

            <div className="max-h-[220px] overflow-y-auto space-y-0.5">
              {lead && (
                <button
                  type="button"
                  onClick={() => setLead(null)}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  {t('documents.preview.clear-lead')}
                </button>
              )}

              {leads.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setLead(row)}
                  className="w-full text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted truncate"
                >
                  {row.name}
                </button>
              ))}

              {leads.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  {t('documents.preview.no-leads')}
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {lead && (
          <Badge variant="secondary" className="h-5 gap-1 text-[10px]">
            <Database className="h-2.5 w-2.5" /> {t('documents.preview.real-values')}
          </Badge>
        )}

        <Button
          variant="ghost" size="sm" className="h-7 gap-1.5 text-xs ml-auto"
          onClick={render} disabled={loading}
        >
          {loading
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <RefreshCw className="h-3 w-3" />}
          {t('documents.preview.refresh')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" size="sm" className="rounded-none border-x-0">
          <AlertTriangle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 overflow-auto bg-muted/40">
        <PageCanvas settings={settings} pageCount={pageCount}>
          <div
            ref={contentRef}
            className="doc-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </PageCanvas>
      </div>
    </div>
  );
};

export default PagePreview;
