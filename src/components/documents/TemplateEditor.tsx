import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  documentService, type DocumentTemplate, type DocumentType, type TemplateRevision,
} from '@/services/documentsApi';
import DocumentEditor, { type DocumentEditorHandle } from './editor/DocumentEditor';
import PageSettingsPanel from './editor/PageSettingsPanel';
import PagePreview from './editor/PagePreview';
import { withDefaults, type PageSettings } from './editor/pageGeometry';
import {
  Loader2, Plus, Save, Eye, CheckCircle2, Trash2, AlertTriangle, Settings2,
  History, PenLine, Cloud, CloudOff, RotateCcw, Download, FileText, FileType2,
} from 'lucide-react';

/** Autosave debounce. Long enough not to save mid-sentence. */
const AUTOSAVE_MS = 2500;

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

/**
 * Where contract wording is written.
 *
 * This is a real document editor: the author works on a page drawn to A4
 * dimensions and never sees markup. What is stored is a structured document
 * model (`body_doc`); the HTML the contract pipeline consumes is *generated*
 * from it on every save.
 *
 * Templates written before this editor open fine — TipTap parses their stored
 * HTML into the schema, so no migration was needed and none is offered.
 */
const TemplateEditor: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<DocumentTemplate | null>(null);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<string>('');
  const [settings, setSettings] = useState<PageSettings>(withDefaults());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [revisions, setRevisions] = useState<TemplateRevision[]>([]);
  const [exporting, setExporting] = useState(false);



  const bodyRef = useRef<DocumentEditorHandle>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  /** Bumped on open so the editors remount with the new document. */
  const [editorKey, setEditorKey] = useState(0);


  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [templateList, typeResult] = await Promise.all([
        documentService.templates(),
        documentService.types(),
      ]);
      setTemplates(templateList);
      setTypes(typeResult.data);
    } catch {
      toast({ title: t('documents.templates.load-failed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { load(); }, [load]);

  const open = async (template: DocumentTemplate) => {
    try {
      const full = await documentService.template(template.id);

      setSelected(full);
      setName(full.name);
      setTypeId(full.document_type_id ? String(full.document_type_id) : '');
      setSettings(withDefaults(full.page_settings));
      setSaveState('idle');
      setSavedAt(null);
      setMode('edit');
      setEditorKey((key) => key + 1);
    } catch {
      toast({ title: t('documents.templates.load-failed'), variant: 'destructive' });
    }
  };

  const startNew = () => {
    setSelected(null);
    setName('');
    setTypeId('');
    setSettings(withDefaults());
    setSaveState('idle');
    setSavedAt(null);
    setMode('edit');
    setEditorKey((key) => key + 1);
  };

  /**
   * Collect the whole document and send it.
   *
   * Both representations travel together and always for the same content: the
   * structured model for reopening, the serialised HTML for rendering. Letting
   * them diverge would mean the editor and the contract disagreeing about what
   * the template says.
   */
  const persist = useCallback(async (autosave: boolean) => {
    const body = bodyRef.current?.getContent();
    if (!body) return;

    if (!name.trim()) {
      if (!autosave) {
        toast({ title: t('documents.templates.name-required'), variant: 'destructive' });
      }
      return;
    }

    const payload = {
      name: name.trim(),
      document_type_id: typeId ? Number(typeId) : null,
      body_html: body.html,
      body_doc: body.doc as Record<string, unknown>,
      doc_schema_version: body.schemaVersion,
      page_settings: settings,
      autosave,
    };

    setSaveState('saving');

    try {
      const saved = selected
        ? await documentService.updateTemplate(selected.id, payload)
        : await documentService.createTemplate(payload as never);

      setSelected(saved);
      setSaveState('saved');
      setSavedAt(new Date());

      // A new template must appear in the list, and a renamed one must update
      // in it — cheaper than refetching the whole list on every autosave.
      setTemplates((current) => {
        const without = current.filter((item) => item.id !== saved.id);
        return [...without, saved].sort((a, b) => a.name.localeCompare(b.name));
      });

      if (!autosave) toast({ title: t('documents.templates.saved') });
    } catch (error: any) {
      setSaveState('error');

      if (!autosave) {
        toast({
          title: t('documents.templates.save-failed'),
          description: error?.response?.data?.message,
          variant: 'destructive',
        });
      }
    }
  }, [name, typeId, settings, selected, toast, t]);

  /** Any edit marks the document dirty and restarts the autosave clock. */
  const markDirty = useCallback(() => {
    setSaveState('dirty');

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

    // Only an existing template autosaves. Creating a row from a half-typed
    // name would litter the list with "Untitled" every time somebody clicked
    // New and walked away.
    if (!selected) return;

    autosaveTimer.current = setTimeout(() => { void persist(true); }, AUTOSAVE_MS);
  }, [persist, selected]);

  useEffect(() => () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
  }, []);

  /**
   * Don't let a refresh or a stray navigation take the document.
   *
   * The autosave covers the normal case; this covers the two-second window
   * between the last keystroke and it firing.
   */
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (saveState === 'dirty' || saveState === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [saveState]);

  const publish = async () => {
    if (!selected) return;

    try {
      await persist(false);
      const updated = await documentService.publishTemplate(selected.id, !selected.is_published);
      setSelected((current) => (current ? { ...current, ...updated } : current));
      await load();
      toast({ title: t('documents.templates.published') });
    } catch (error: any) {
      toast({
        title: t('documents.templates.publish-failed'),
        description: error?.response?.data?.message ?? error?.response?.data?.error,
        variant: 'destructive',
      });
    }
  };

  const remove = async () => {
    if (!selected) return;

    try {
      await documentService.removeTemplate(selected.id);
      toast({ title: t('documents.templates.deleted') });
      startNew();
      await load();
    } catch {
      toast({ title: t('documents.templates.delete-failed'), variant: 'destructive' });
    }
  };

  /**
   * Export the wording as a file.
   *
   * Saved first: the endpoint renders what is *stored*, so exporting with
   * unsaved edits would hand back yesterday's document and look like the
   * export was broken rather than the save.
   */
  const exportAs = async (format: 'pdf' | 'docx') => {
    if (!selected) return;

    setExporting(true);

    try {
      await persist(false);

      const blob = await documentService.downloadTemplate(selected.id, format);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = url;
      link.download = `${selected.name || 'modelo'}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // The endpoint answers with JSON on failure, which arrives here as a
      // Blob because of responseType — so the message has to be read out of it.
      let description: string | undefined;

      try {
        const text = await error?.response?.data?.text?.();
        description = text ? JSON.parse(text)?.message : undefined;
      } catch {
        description = undefined;
      }

      toast({
        title: t('documents.templates.export-failed'),
        description,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const openRevisions = async () => {
    if (!selected) return;
    try {
      setRevisions(await documentService.revisions(selected.id));
    } catch {
      toast({ title: t('documents.templates.revisions-failed'), variant: 'destructive' });
    }
  };

  const restore = async (revision: TemplateRevision) => {
    if (!selected) return;

    try {
      const restored = await documentService.restoreRevision(selected.id, revision.id);
      setSelected(restored);
      setSettings(withDefaults(restored.page_settings));
      setEditorKey((key) => key + 1);
      toast({ title: t('documents.templates.restored') });
    } catch {
      toast({ title: t('documents.templates.restore-failed'), variant: 'destructive' });
    }
  };

  const saveIndicator = useMemo(() => {
    switch (saveState) {
      case 'saving':
        return { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: t('documents.templates.saving') };
      case 'saved':
        return {
          icon: <Cloud className="h-3 w-3" />,
          text: savedAt
            ? `${t('documents.templates.saved-at')} ${savedAt.toLocaleTimeString()}`
            : t('documents.templates.saved'),
        };
      case 'dirty':
        return { icon: <PenLine className="h-3 w-3" />, text: t('documents.templates.unsaved') };
      case 'error':
        return { icon: <CloudOff className="h-3 w-3 text-destructive" />, text: t('documents.templates.save-failed') };
      default:
        return null;
    }
  }, [saveState, savedAt, t]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-190px)] min-h-[560px]">
      {/* Template list */}
      <aside className="w-56 shrink-0 flex flex-col gap-2">
        <Button size="sm" onClick={startNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t('documents.templates.new')}
        </Button>

        {/* `min-h-0` — see the note in VariablePicker; without it a long
            template list stretches the column instead of scrolling. */}
        <ScrollArea className="flex-1 min-h-0 rounded-lg border">
          <div className="p-1.5 space-y-0.5">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => open(template)}
                className={`w-full text-left rounded-md px-2 py-1.5 text-xs transition-colors ${
                  selected?.id === template.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <span className="block truncate font-medium">{template.name}</span>
                <span className="flex items-center gap-1 mt-0.5">
                  {template.is_published ? (
                    <Badge variant="outline" className="h-4 px-1 text-[9px]">
                      {t('documents.templates.published-badge')}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      {t('documents.templates.draft-badge')}
                    </span>
                  )}
                </span>
              </button>
            ))}

            {templates.length === 0 && (
              <p className="text-[11px] text-muted-foreground p-2">
                {t('documents.templates.empty')}
              </p>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Editor */}
      <section className="flex-1 min-w-0 flex flex-col rounded-lg border overflow-hidden">
        <header className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <Input
            value={name}
            onChange={(event) => { setName(event.target.value); markDirty(); }}
            placeholder={t('documents.templates.name-placeholder')}
            className="h-8 text-sm max-w-[280px]"
          />

          <Select value={typeId} onValueChange={(value) => { setTypeId(value); markDirty(); }}>
            <SelectTrigger className="h-8 w-[190px] text-xs">
              <SelectValue placeholder={t('documents.templates.type')} />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={String(type.id)} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {saveIndicator && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {saveIndicator.icon}{saveIndicator.text}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex rounded-md border p-0.5">
              <Button
                variant={mode === 'edit' ? 'secondary' : 'ghost'}
                size="sm" className="h-7 px-2 text-xs gap-1"
                onClick={() => setMode('edit')}
              >
                <PenLine className="h-3 w-3" /> {t('documents.templates.edit')}
              </Button>
              <Button
                variant={mode === 'preview' ? 'secondary' : 'ghost'}
                size="sm" className="h-7 px-2 text-xs gap-1"
                onClick={() => setMode('preview')}
              >
                <Eye className="h-3 w-3" /> {t('documents.templates.preview')}
              </Button>
            </div>

            {/* Page setup */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                  <Settings2 className="h-3 w-3" /> {t('documents.templates.page-setup')}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[340px] overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-sm">{t('documents.settings.title')}</SheetTitle>
                </SheetHeader>
                <PageSettingsPanel
                  settings={settings}
                  onChange={(next) => { setSettings(next); markDirty(); }}
                />
              </SheetContent>
            </Sheet>

            {/* Revisions */}
            {selected && (
              <Sheet onOpenChange={(isOpen) => { if (isOpen) void openRevisions(); }}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs">
                    <History className="h-3 w-3" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[340px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-sm">{t('documents.templates.history')}</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-1">
                    {revisions.map((revision) => (
                      <div
                        key={revision.id}
                        className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            #{revision.revision_number}
                            <span className="ml-1.5 font-normal text-muted-foreground">
                              {t(`documents.templates.trigger-${revision.trigger}`)}
                            </span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(revision.created_at).toLocaleString()}
                            {revision.author ? ` · ${revision.author}` : ''}
                          </p>
                        </div>
                        <Button
                          variant="ghost" size="sm" className="h-6 px-1.5 shrink-0"
                          onClick={() => restore(revision)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {revisions.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {t('documents.templates.no-revisions')}
                      </p>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            {selected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" disabled={exporting}>
                    {exporting
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <Download className="h-3 w-3" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-xs gap-2" onSelect={() => exportAs('pdf')}>
                    <FileText className="h-3 w-3" /> {t('documents.templates.download-pdf')}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs gap-2" onSelect={() => exportAs('docx')}>
                    <FileType2 className="h-3 w-3" /> {t('documents.templates.download-word')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => persist(false)}>
              <Save className="h-3 w-3" /> {t('documents.templates.save')}
            </Button>

            {selected && (
              <>
                <Button
                  variant={selected.is_published ? 'outline' : 'default'}
                  size="sm" className="h-7 px-2 gap-1 text-xs"
                  onClick={publish}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {selected.is_published
                    ? t('documents.templates.unpublish')
                    : t('documents.templates.publish')}
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 px-2 text-destructive"
                  onClick={remove}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </header>

        {selected?.doc_schema_version && selected.doc_schema_version > 1 && (
          <Alert variant="destructive" size="sm" className="rounded-none border-x-0">
            <AlertTriangle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">
              {t('documents.templates.newer-schema')}
            </AlertDescription>
          </Alert>
        )}

        {/*
          One document, one surface. Everything is written in the body —
          letterhead, clauses, signature blocks — the way a Word document is
          written. There is no separate header or footer to configure.
        */}
        <div className="flex-1 min-h-0">
          {mode === 'edit' ? (
            <DocumentEditor
              key={`body-${editorKey}`}
              ref={bodyRef}
              initialDoc={selected?.body_doc ?? null}
              initialHtml={selected?.body_html ?? ''}
              settings={settings}
              templateId={selected?.id ?? null}
              onChange={markDirty}
            />
          ) : (
            <PagePreview
              templateId={selected?.id ?? null}
              settings={settings}
              getBodyHtml={() => bodyRef.current?.getContent().html ?? ''}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default TemplateEditor;
