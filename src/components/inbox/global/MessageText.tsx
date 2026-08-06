/**
 * MESSAGE TEXT
 *
 * Renders a message body with URLs turned into real links. Shared by every
 * bubble in the inbox — plain text, media captions and the optimistic echo —
 * so a link behaves the same whichever channel or message type it arrives on.
 *
 * The parsing rules mirror the website widget's (crm-api/public/widgets/chat.js):
 * only http(s) and bare www. hosts match, so a "javascript:" or "data:" string
 * in a message can never become clickable.
 */

import React from 'react';
import { cn } from '@/lib/utils';

const LINK_PATTERN = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

/**
 * Sentence punctuation that follows a URL far more often than it belongs to
 * one: "see https://x.com/docs." should not link the full stop.
 */
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;

/** Trim characters that ended up in the match but belong to the sentence. */
const trimUrl = (raw: string): string => {
  let url = raw.replace(TRAILING_PUNCTUATION, '');

  // A trailing ")" only belongs to the URL if it opened inside it, so
  // "(see https://x.com/a)" drops it but ".../Foo_(bar)" keeps it.
  while (url.endsWith(')') && url.split(')').length > url.split('(').length) {
    url = url.slice(0, -1);
  }

  return url;
};

interface MessageTextProps {
  text?: string | null;
  className?: string;
  /**
   * True on the filled outgoing bubble, where a blue link would disappear
   * into the background — there the link inherits the bubble's own
   * foreground and relies on the underline instead.
   */
  onAccent?: boolean;
}

const MessageText: React.FC<MessageTextProps> = ({ text, className, onAccent }) => {
  const linkClass = cn(
    'underline underline-offset-2 hover:decoration-2',
    onAccent ? 'text-inherit' : 'text-blue-600 dark:text-blue-400'
  );

  const nodes: React.ReactNode[] = [];
  const source = text ?? '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  LINK_PATTERN.lastIndex = 0;

  while ((match = LINK_PATTERN.exec(source)) !== null) {
    const url = trimUrl(match[0]);

    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    if (url) {
      nodes.push(
        <a
          key={`${match.index}-${url}`}
          href={/^www\./i.test(url) ? `https://${url}` : url}
          target="_blank"
          // noopener/noreferrer keep the opened page away from the CRM;
          // nofollow because the text is written by the contact.
          rel="noopener noreferrer nofollow"
          className={linkClass}
          onClick={(event) => event.stopPropagation()}
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + url.length;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return (
    <p className={cn('text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]', className)}>
      {nodes}
    </p>
  );
};

export default MessageText;
