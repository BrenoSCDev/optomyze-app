/**
 * TAG SCOPES
 *
 * Which entities a tag may be attached to. Each scope maps to one pivot table
 * on the API side: lead -> lead_tag, deal -> sale_tag, task -> task_tag.
 *
 * A tag with no scopes selected would be invisible in every picker, so the
 * selector refuses to empty completely — deselecting the last one is treated
 * as a no-op rather than silently creating an unusable tag.
 */

import React from 'react';
import { CheckSquare, Contact } from 'lucide-react';
// Same icon the sidebar uses for deal funnels, so "deal" reads consistently.
import { MdCurrencyExchange } from 'react-icons/md';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type TagScope = 'lead' | 'deal' | 'task';

export const TAG_SCOPES: TagScope[] = ['lead', 'deal', 'task'];

/** Label key per scope, so the three surfaces stay worded identically. */
export const tagScopeLabelKey = (scope: TagScope) => `tags.scope-${scope}`;

/**
 * Whether a tag may be attached to the given entity.
 *
 * Mirrors Tag::appliesTo() on the API. A missing or empty `scopes` means
 * "everywhere" — that is what tags meant before scoping existed, and treating
 * it as an empty set would make older tags vanish from every picker.
 *
 * Used where tags arrive embedded in a larger payload (the funnel endpoints)
 * and so cannot be narrowed with `?scope=`.
 */
export const tagAppliesTo = (
  tag: { scopes?: TagScope[] | null } | null | undefined,
  scope: TagScope,
): boolean => !tag?.scopes?.length || tag.scopes.includes(scope);

interface Props {
  value: TagScope[];
  onChange: (scopes: TagScope[]) => void;
  className?: string;
  disabled?: boolean;
}

const SCOPE_ICON: Record<TagScope, React.ComponentType<{ className?: string }>> = {
  lead: Contact,
  deal: MdCurrencyExchange,
  task: CheckSquare,
};

const TagScopeSelector: React.FC<Props> = ({ value, onChange, className, disabled }) => {
  const { t } = useLanguage();

  const toggle = (scope: TagScope) => {
    if (disabled) return;

    const next = value.includes(scope)
      ? value.filter(s => s !== scope)
      : [...value, scope];

    // Never let the set empty out — see the file header.
    if (!next.length) return;

    onChange(TAG_SCOPES.filter(s => next.includes(s)));
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {TAG_SCOPES.map(scope => {
        const Icon = SCOPE_ICON[scope];
        const active = value.includes(scope);

        return (
          <button
            key={scope}
            type="button"
            onClick={() => toggle(scope)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors duration-fast ease-standard',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-hover hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(tagScopeLabelKey(scope))}
          </button>
        );
      })}
    </div>
  );
};

export default TagScopeSelector;
