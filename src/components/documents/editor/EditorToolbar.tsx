import React from 'react';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { AVAILABLE_FONTS } from './pageGeometry';
import {
  Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered,
  IndentIncrease, IndentDecrease, Quote, Minus, Link2, ImagePlus, Table2,
  Braces, FileStack, Eraser, Baseline, Highlighter, Heading1, Heading2,
  Heading3, Type, Rows3, Columns3, Trash2, Merge, Split,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  onInsertVariable: () => void;
  onInsertImage: () => void;
  disabled?: boolean;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];
const LINE_HEIGHTS = [1, 1.15, 1.5, 1.6, 2, 2.5, 3];

/** Colours that stay legible on white paper and survive greyscale printing. */
const TEXT_COLORS = [
  '#111111', '#374151', '#6b7280', '#b91c1c', '#c2410c',
  '#a16207', '#15803d', '#0f766e', '#1d4ed8', '#6d28d9',
];

const HIGHLIGHTS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#e9d5ff'];

const ToolButton: React.FC<{
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, active, disabled, children }) => (
  <TooltipProvider delayDuration={400}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          aria-pressed={!!active}
          className={`h-8 w-8 p-0 ${active ? 'bg-primary/15 text-primary hover:bg-primary/20' : ''}`}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/**
 * The editor toolbar.
 *
 * Grouped the way the spec asks and the way Word and Docs have trained people:
 * history, then typography, then emphasis, then colour, then block layout,
 * then insertion. Table controls appear only when the caret is inside a table
 * — eight table buttons permanently greyed out is the "overwhelming" the brief
 * warns against.
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor, onInsertVariable, onInsertImage, disabled,
}) => {
  const { t } = useLanguage();

  if (!editor) return null;

  const inTable = editor.isActive('table');

  const currentFont =
    (editor.getAttributes('textStyle').fontFamily as string) ?? '';
  const currentSize =
    (editor.getAttributes('textStyle').fontSize as string)?.replace('pt', '') ?? '';

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(t('documents.editor.link-prompt'), previous ?? 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b bg-background/95 backdrop-blur px-2 py-1.5">
      {/* History */}
      <ToolButton label={t('documents.editor.undo')} onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()}>
        <Undo2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.redo')} onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()}>
        <Redo2 className="h-3.5 w-3.5" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Font + size */}
      <Select
        value={currentFont}
        onValueChange={(value) => editor.chain().focus().setFontFamily(value).run()}
      >
        <SelectTrigger className="h-8 w-[136px] text-xs"><SelectValue placeholder={t('documents.editor.font')} /></SelectTrigger>
        <SelectContent>
          {AVAILABLE_FONTS.map((font) => (
            <SelectItem key={font.value} value={font.value} className="text-xs">
              <span style={{ fontFamily: font.css }}>{font.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentSize}
        onValueChange={(value) => editor.chain().focus().setFontSize(`${value}pt`).run()}
      >
        <SelectTrigger className="h-8 w-[64px] text-xs"><SelectValue placeholder="11" /></SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((size) => (
            <SelectItem key={size} value={String(size)} className="text-xs">{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Emphasis */}
      <ToolButton label={t('documents.editor.bold')} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}>
        <Bold className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.italic')} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}>
        <Italic className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.underline')} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={disabled}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.strike')} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={disabled}>
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolButton>

      {/* Colour */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled} aria-label={t('documents.editor.text-color')}>
            <Baseline className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="h-5 w-5 rounded border border-border"
                style={{ background: color }}
                onClick={() => editor.chain().focus().setColor(color).run()}
                aria-label={color}
              />
            ))}
          </div>
          <DropdownMenuItem className="mt-1 text-xs" onSelect={() => editor.chain().focus().unsetColor().run()}>
            {t('documents.editor.default-color')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled} aria-label={t('documents.editor.highlight')}>
            <Highlighter className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {HIGHLIGHTS.map((color) => (
              <button
                key={color}
                type="button"
                className="h-5 w-5 rounded border border-border"
                style={{ background: color }}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                aria-label={color}
              />
            ))}
          </div>
          <DropdownMenuItem className="mt-1 text-xs" onSelect={() => editor.chain().focus().unsetHighlight().run()}>
            {t('documents.editor.no-highlight')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolButton label="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={disabled}>
        <Heading1 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.paragraph')} active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} disabled={disabled}>
        <Type className="h-3.5 w-3.5" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment */}
      <ToolButton label={t('documents.editor.align-left')} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} disabled={disabled}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.align-center')} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} disabled={disabled}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.align-right')} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} disabled={disabled}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.justify')} active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} disabled={disabled}>
        <AlignJustify className="h-3.5 w-3.5" />
      </ToolButton>

      {/* Line height */}
      <Select
        value=""
        onValueChange={(value) => editor.chain().focus().setLineHeight(value).run()}
      >
        <SelectTrigger className="h-8 w-[70px] text-xs" aria-label={t('documents.editor.line-height')}>
          <SelectValue placeholder="1.6" />
        </SelectTrigger>
        <SelectContent>
          {LINE_HEIGHTS.map((height) => (
            <SelectItem key={height} value={String(height)} className="text-xs">{height}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists and indent */}
      <ToolButton label={t('documents.editor.bullets')} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}>
        <List className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.numbers')} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}>
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.indent')} onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={disabled || !editor.can().sinkListItem('listItem')}>
        <IndentIncrease className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.outdent')} onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={disabled || !editor.can().liftListItem('listItem')}>
        <IndentDecrease className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.quote')} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled}>
        <Quote className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.separator')} onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={disabled}>
        <Minus className="h-3.5 w-3.5" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Insert */}
      <ToolButton label={t('documents.editor.link')} active={editor.isActive('link')} onClick={setLink} disabled={disabled}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.image')} onClick={onInsertImage} disabled={disabled}>
        <ImagePlus className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        label={t('documents.editor.table')}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        disabled={disabled}
      >
        <Table2 className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label={t('documents.editor.page-break')} onClick={() => editor.chain().focus().setPageBreak().run()} disabled={disabled}>
        <FileStack className="h-3.5 w-3.5" />
      </ToolButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="secondary"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={onInsertVariable}
        disabled={disabled}
      >
        <Braces className="h-3.5 w-3.5" />
        {t('documents.editor.variable')}
      </Button>

      <ToolButton
        label={t('documents.editor.clear-formatting')}
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        disabled={disabled}
      >
        <Eraser className="h-3.5 w-3.5" />
      </ToolButton>

      {/*
        Table controls, only while the caret is in a table. Contextual rather
        than always-visible: eight permanently disabled buttons is exactly the
        clutter the brief asks to avoid.
      */}
      {inTable && (
        <>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-1">
            {t('documents.editor.table')}
          </span>
          <ToolButton label={t('documents.editor.row-after')} onClick={() => editor.chain().focus().addRowAfter().run()} disabled={disabled}>
            <Rows3 className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label={t('documents.editor.col-after')} onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={disabled}>
            <Columns3 className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label={t('documents.editor.merge-cells')} onClick={() => editor.chain().focus().mergeCells().run()} disabled={disabled || !editor.can().mergeCells()}>
            <Merge className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label={t('documents.editor.split-cell')} onClick={() => editor.chain().focus().splitCell().run()} disabled={disabled || !editor.can().splitCell()}>
            <Split className="h-3.5 w-3.5" />
          </ToolButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" aria-label={t('documents.editor.table-delete')}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs" onSelect={() => editor.chain().focus().deleteRow().run()}>
                {t('documents.editor.delete-row')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onSelect={() => editor.chain().focus().deleteColumn().run()}>
                {t('documents.editor.delete-column')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-destructive" onSelect={() => editor.chain().focus().deleteTable().run()}>
                {t('documents.editor.delete-table')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
};

export default EditorToolbar;
