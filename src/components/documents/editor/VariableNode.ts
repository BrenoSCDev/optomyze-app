import { Node, mergeAttributes } from '@tiptap/core';

/**
 * A CRM variable, as an atomic token.
 *
 * This node is the hinge of the whole design. It renders as a chip the author
 * can see and delete as one unit, and it *serialises to `{{lead.name}}`* — the
 * exact syntax the existing TemplateRenderer already understands.
 *
 * That is what lets a visual editor sit on top of a template engine that
 * knows nothing about it. No renderer change, no parallel syntax, no
 * migration of existing templates: the HTML this produces is the HTML
 * somebody would previously have typed by hand.
 *
 * `atom: true` is deliberate. A variable is one thing, not eight characters —
 * a backspace must remove `{{lead.name}}` whole, because a half-deleted token
 * (`{{lead.nam}}`) would silently render as empty on a signed contract.
 */
export interface VariableAttributes {
  token: string;
  label?: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variable: {
      insertVariable: (attributes: VariableAttributes) => ReturnType;
    };
  }
}

export const VariableNode = Node.create({
  name: 'variable',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      token: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-token') ?? '',
        renderHTML: (attributes) => ({ 'data-token': attributes.token }),
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-label'),
        renderHTML: (attributes) =>
          attributes.label ? { 'data-label': attributes.label } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  /**
   * The editor's DOM.
   *
   * Note this is NOT what reaches the renderer — `serializeDocument` below
   * strips these wrappers down to bare `{{token}}` text. Keeping the chip
   * markup out of the saved HTML matters because that HTML goes through
   * dompdf, which would otherwise have to style a span it knows nothing
   * about, on a legal document.
   */
  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': '',
        class: 'doc-variable',
      }),
      node.attrs.label || `{{${node.attrs.token}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.token}}}`;
  },

  addCommands() {
    return {
      insertVariable:
        (attributes: VariableAttributes) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: attributes }),
    };
  },
});

export default VariableNode;
