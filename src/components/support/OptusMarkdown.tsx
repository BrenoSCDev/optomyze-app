/**
 * OPTUS MARKDOWN
 *
 * Renders assistant replies. Optus is told markdown is rendered, so it leans on
 * lists and bold UI labels — those carry the meaning of a set of steps and have
 * to survive to the screen.
 *
 * Styled explicitly rather than through a prose plugin: the bubble sits on
 * `muted`, so headings and code need the CRM's own tokens to stay legible in
 * both themes.
 */

import React, { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Fenced blocks get their own copy button — they hold things people retype. */
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = String(children ?? '');
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="group/code relative my-2">
      <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed">
        <code className="font-mono text-foreground">{children}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-2 top-2 rounded-md border border-border bg-card p-1.5 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover/code:opacity-100"
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
};

const OptusMarkdown: React.FC<{ content: string; className?: string }> = ({ content, className }) => (
  <div className={cn('text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="my-2 whitespace-pre-wrap break-words">{children}</p>,
        // Steps are the most common shape of an answer, so lists get real
        // hanging indents rather than the browser default.
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-muted-foreground">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        h1: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground">{children}</h4>,
        h2: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground">{children}</h4>,
        h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-foreground">{children}</h4>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>
        ),
        hr: () => <hr className="my-3 border-border" />,
        code: ({ className: lang, children, ...props }) => {
          // react-markdown gives inline code no language class; only fenced
          // blocks are worth the copy affordance.
          const isBlock = Boolean(lang);
          if (isBlock) return <CodeBlock>{children}</CodeBlock>;

          return (
            <code
              className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[0.8em] text-foreground"
              {...props}
            >
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-background px-2 py-1 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

// Replies never change once rendered; memoising keeps a long thread cheap.
export default memo(OptusMarkdown);
