import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentService } from '@/services/documentsApi';
import { buildExtensions, serializeForRenderer, SCHEMA_VERSION } from './documentSchema';
import { type PageSettings, pageBox } from './pageGeometry';
import PageCanvas, { PAGE_GAP_PX } from './PageCanvas';
import PaginationExtension from './PaginationExtension';
import EditorToolbar from './EditorToolbar';
import VariablePicker from './VariablePicker';
import './document-editor.css';

export interface DocumentEditorHandle {
  /** The pair the API stores: structured model plus its generated HTML. */
  getContent: () => { doc: unknown; html: string; schemaVersion: number };
  isEmpty: () => boolean;
  focus: () => void;
}

interface DocumentEditorProps {
  initialDoc?: unknown | null;
  /** Fallback for templates authored before the visual editor existed. */
  initialHtml?: string | null;
  settings: PageSettings;
  templateId?: number | null;
  editable?: boolean;
  placeholder?: string;
  onChange?: () => void;

}

/**
 * The visual document editor.
 *
 * Two things about the data flow are worth stating, because they are what keep
 * this from breaking the existing contract pipeline:
 *
 *   1. `body_doc` (the ProseMirror tree) is the source of truth. `body_html`
 *      is generated from it on every save and is what the renderer, the PDF
 *      and the signature provider consume — none of which know this editor
 *      exists.
 *
 *   2. Opening a template written before this editor works: TipTap parses the
 *      stored HTML into the schema. `{{token}}` text stays plain text and
 *      still renders correctly; it simply is not a chip until someone
 *      reinserts it from the picker. Nothing is lost, and nothing had to be
 *      migrated.
 */
const DocumentEditor = React.forwardRef<DocumentEditorHandle, DocumentEditorProps>(
  ({
    initialDoc, initialHtml, settings, templateId,
    editable = true, placeholder, onChange,
  }, ref) => {
    const { toast } = useToast();
    const { t } = useLanguage();

    const [pickerOpen, setPickerOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pageCount, setPageCount] = useState(1);
    const fileInput = useRef<HTMLInputElement>(null);

    /*
     * Page geometry, behind a ref the plugin reads on every pass.
     *
     * Not an extension option captured at creation: page setup changes while
     * the editor is alive, and recreating the editor to pick up a new margin
     * would throw away the undo history and the caret.
     */
    const geometryRef = useRef({ pageHeight: 0, pageGap: PAGE_GAP_PX, marginTop: 0, marginBottom: 0 });

    useEffect(() => {
      const box = pageBox(settings);

      geometryRef.current = {
        pageHeight: box.heightPx,
        pageGap: PAGE_GAP_PX,
        marginTop: box.marginsPx.top,
        marginBottom: box.marginsPx.bottom,
      };
    }, [settings]);

    const editor = useEditor({
      extensions: [
        ...buildExtensions(placeholder),
        PaginationExtension.configure({
          geometry: () => geometryRef.current,
          onPageCount: setPageCount,
        }),
      ],
      // The structured model wins whenever it exists; HTML is the legacy path.
      content: (initialDoc as never) ?? initialHtml ?? '',
      editable,
      onUpdate: () => onChange?.(),
      editorProps: {
        attributes: {
          class: 'doc-prose focus:outline-none',
          spellcheck: 'true',
        },
      },
    });

    /*
     * Nudge the plugin when page setup changes.
     *
     * The geometry ref is already updated; this is what makes it re-measure
     * rather than waiting for the next keystroke to reflow the document.
     */
    useEffect(() => {
      if (!editor) return;

      const timer = setTimeout(() => {
        editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false));
      }, 0);

      return () => clearTimeout(timer);
    }, [editor, settings]);

    useEffect(() => {
      editor?.setEditable(editable);
    }, [editor, editable]);

    useImperativeHandle(ref, () => ({
      getContent: () => ({
        doc: editor?.getJSON() ?? null,
        // Serialised here, not on the server: the schema lives in this file,
        // and a PHP reimplementation of it would drift the first time a node
        // changed.
        html: serializeForRenderer(editor?.getHTML() ?? ''),
        schemaVersion: SCHEMA_VERSION,
      }),
      isEmpty: () => editor?.isEmpty ?? true,
      focus: () => editor?.chain().focus().run(),
    }), [editor]);

    const insertVariable = useCallback((token: string, label: string) => {
      editor?.chain().focus().insertVariable({ token, label }).run();
    }, [editor]);

    /**
     * Upload, then insert a reference.
     *
     * Never a base64 data URL: that would put the same megabytes into
     * `body_doc`, into every autosave revision, and into the snapshot of every
     * contract generated from this template. The server inlines the bytes once,
     * at generation time.
     */
    const handleFile = useCallback(async (file: File) => {
      setUploading(true);

      try {
        const asset = await documentService.uploadAsset(file, templateId ?? undefined);
        editor?.chain().focus().setImage({ src: asset.url, alt: file.name }).run();
      } catch (error: any) {
        toast({
          title: t('documents.editor.upload-failed'),
          description: error?.response?.data?.message,
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        if (fileInput.current) fileInput.current.value = '';
      }
    }, [editor, templateId, toast, t]);

    // Pasted and dropped images go through the same upload path, so a
    // screenshot pasted into a contract does not become a 3 MB data URL.
    useEffect(() => {
      if (!editor || !editable) return;

      const dom = editor.view.dom;

      const fromClipboard = (event: ClipboardEvent) => {
        const file = Array.from(event.clipboardData?.files ?? [])[0];
        if (file?.type.startsWith('image/')) {
          event.preventDefault();
          void handleFile(file);
        }
      };

      const fromDrop = (event: DragEvent) => {
        const file = Array.from(event.dataTransfer?.files ?? [])[0];
        if (file?.type.startsWith('image/')) {
          event.preventDefault();
          void handleFile(file);
        }
      };

      dom.addEventListener('paste', fromClipboard as EventListener);
      dom.addEventListener('drop', fromDrop as EventListener);

      return () => {
        dom.removeEventListener('paste', fromClipboard as EventListener);
        dom.removeEventListener('drop', fromDrop as EventListener);
      };
    }, [editor, editable, handleFile]);

    return (
      <div className="flex flex-col h-full min-h-0">
        {editable && (
          <EditorToolbar
            editor={editor}
            disabled={uploading}
            onInsertVariable={() => setPickerOpen(true)}
            onInsertImage={() => fileInput.current?.click()}
          />
        )}

        <div className="flex-1 min-h-0 overflow-auto bg-muted/40">
          <PageCanvas settings={settings} pageCount={pageCount}>
            <EditorContent editor={editor} />
          </PageCanvas>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <VariablePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onPick={insertVariable}
        />
      </div>
    );
  }
);

DocumentEditor.displayName = 'DocumentEditor';

export default DocumentEditor;
