import { Node, mergeAttributes } from '@tiptap/core';

/**
 * An explicit page break.
 *
 * Serialises to `<div class="page-break"></div>`, which the PDF stylesheet
 * already turns into `page-break-after: always` — the class predates this
 * editor, so a break inserted here behaves identically to one a hand-authored
 * template used.
 *
 * A block-level atom rather than a mark: a page break occupies a position in
 * the document, it does not decorate text. Making it selectable means it can
 * be deleted with a single backspace, which is what a user expects of
 * something drawn as a dashed line.
 */
export const PageBreakNode = Node.create({
  name: 'pageBreak',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  parseHTML() {
    return [{ tag: 'div.page-break' }, { tag: 'div[data-page-break]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'page-break',
        'data-page-break': '',
      }),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    } as never;
  },

  addKeyboardShortcuts() {
    return {
      // The shortcut Word and Docs both use.
      'Mod-Enter': () => this.editor.commands.insertContent({ type: this.name }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export default PageBreakNode;
