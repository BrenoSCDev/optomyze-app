import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
// TipTap 3 folds font size and line height into the text-style package, so
// both come from upstream rather than being hand-rolled here.
import { TextStyle, Color, FontFamily, FontSize, LineHeight } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';

import VariableNode from './VariableNode';
import PageBreakNode from './PageBreakNode';

/**
 * The document schema — the source of truth this whole module is built on.
 *
 * Everything downstream (HTML, PDF, and DOCX if it ever comes) is *generated*
 * from documents shaped by these extensions. Adding or renaming a node here is
 * a schema change: bump SCHEMA_VERSION and DocumentTemplate::SCHEMA_VERSION
 * together, or a template written by a newer build will open in an older one
 * and silently lose the nodes it has no definition for.
 */
export const SCHEMA_VERSION = 1;

/**
 * Paragraph spacing, as a style attribute on the block.
 *
 * A style attribute rather than a class, because the PDF stylesheet is
 * generated separately from the page settings and cannot know about classes
 * the editor invents. `margin-bottom` in points is what dompdf reads.
 */
const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          marginBottom: {
            default: null,
            parseHTML: (element) => element.style.marginBottom || null,
            renderHTML: (attributes) =>
              attributes.marginBottom
                ? { style: `margin-bottom: ${attributes.marginBottom}` }
                : {},
          },
        },
      },
    ];
  },
});

export function buildExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      // Configured separately below, with a restricted protocol list.
      link: false,
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily.configure({ types: ['textStyle'] }),
    FontSize.configure({ types: ['textStyle'] }),
    LineHeight.configure({ types: ['paragraph', 'heading'] }),
    ParagraphSpacing,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      // A contract body is authored content that gets rendered to PDF and
      // sent outside the company. Restricting schemes keeps `javascript:`
      // out of a document somebody else will open.
      protocols: ['http', 'https', 'mailto'],
      HTMLAttributes: { rel: 'noopener noreferrer' },
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Table.configure({ resizable: true, lastColumnResizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    VariableNode,
    PageBreakNode,
    Placeholder.configure({
      placeholder: placeholder ?? 'Comece a escrever o documento…',
    }),
  ];
}

/**
 * Editor HTML → renderer HTML.
 *
 * The editor's DOM carries chrome the renderer must never see: variable chips
 * are `<span data-variable class="doc-variable">Nome do contato</span>`, and
 * dompdf would print that label verbatim onto a contract. Reducing each chip
 * back to `{{token}}` is what makes the visual editor and the existing
 * template engine the same system.
 *
 * Done with the DOM rather than a regex because the input is HTML the editor
 * produced and attribute order, quoting and nesting are not worth guessing at.
 */
export function serializeForRenderer(editorHtml: string): string {
  const doc = new DOMParser().parseFromString(
    `<div id="__root">${editorHtml}</div>`,
    'text/html'
  );

  const root = doc.getElementById('__root');
  if (!root) return editorHtml;

  root.querySelectorAll('[data-variable]').forEach((chip) => {
    const token = chip.getAttribute('data-token') ?? '';
    chip.replaceWith(doc.createTextNode(token ? `{{${token}}}` : ''));
  });

  // Editing affordances that mean nothing on paper.
  root.querySelectorAll('.ProseMirror-selectednode').forEach((el) => {
    el.classList.remove('ProseMirror-selectednode');
  });
  root.querySelectorAll('.column-resize-handle, .ProseMirror-gapcursor').forEach((el) => {
    el.remove();
  });

  return root.innerHTML;
}

/**
 * The tokens a document actually uses.
 *
 * Read off the structured model rather than by scanning HTML for `{{...}}`,
 * so a literal brace typed in a clause is never mistaken for a variable.
 */
export function collectVariables(doc: unknown): string[] {
  const found = new Set<string>();

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'variable' && node.attrs?.token) found.add(node.attrs.token);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };

  walk(doc);

  return [...found];
}
