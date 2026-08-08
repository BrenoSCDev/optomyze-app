import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { documentService, type VariableGroup } from '@/services/documentsApi';
import { Search, Braces, AlertTriangle } from 'lucide-react';

interface VariablePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (token: string, label: string) => void;
}

/**
 * Search-and-insert for CRM variables.
 *
 * The point of this dialog is that nobody has to know the token syntax. They
 * search "email", they see "E-mail do contato", they press Enter, and a chip
 * lands in the document. `{{lead.email}}` is an implementation detail shown
 * only as a hint.
 *
 * The `requires` badge is the other half: a template using `{{deal.total}}`
 * cannot render against a lead with no opportunity, and finding that out when
 * a contract fails to generate is far worse than seeing "needs a deal" here.
 */
const VariablePicker: React.FC<VariablePickerProps> = ({ open, onOpenChange, onPick }) => {
  const { t } = useLanguage();

  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    documentService
      .variableRegistry()
      .then((data) => { if (!cancelled) setGroups(data); })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => { if (open) setSearch(''); }, [open]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;

    return groups
      .map((group) => ({
        ...group,
        variables: group.variables.filter(
          (v) =>
            v.token.toLowerCase().includes(term) ||
            v.label.toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.variables.length > 0);
  }, [groups, search]);

  const flat = useMemo(() => filtered.flatMap((g) => g.variables), [filtered]);

  const pick = (token: string, label: string) => {
    onPick(token, label);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Braces className="h-4 w-4" /> {t('documents.editor.variable-title')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('documents.editor.variable-help')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              // Enter inserts the single remaining match — searching then
              // reaching for the mouse is the slow path this avoids.
              if (event.key === 'Enter' && flat.length > 0) {
                event.preventDefault();
                pick(flat[0].token, flat[0].label);
              }
            }}
            placeholder={t('documents.editor.variable-search')}
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/*
          A plain scrolling element, deliberately not the ScrollArea primitive.

          Radix renders its viewport at `height: 100%`, and a percentage height
          does not resolve against a parent whose own height is `auto` — which
          is what `max-height` leaves it as. The viewport therefore grows to
          fit the whole list, the Root clips it with `overflow: hidden`, and
          the result is a list cut off mid-way with no way to scroll it. Only a
          *definite* height (`h-72`, `h-[60vh]`) makes that primitive work.

          `overflow-y: auto` on a `max-height` box has no such dependency: it
          scrolls when the content is taller and collapses to the content when
          it is not, which is the behaviour this dialog needs. The trade is the
          native scrollbar instead of the styled one — worth it here.
        */}
        <div className="overflow-y-auto overscroll-contain max-h-[calc(80vh-180px)] -mx-2 px-2">
          {failed && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground py-6 justify-center">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('documents.editor.variable-failed')}
            </p>
          )}

          {!failed && !loading && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {t('documents.editor.variable-none')}
            </p>
          )}

          <div className="space-y-4 pb-2">
            {filtered.map((group) => (
              <div key={group.group}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  {group.requires && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                      {t('documents.editor.requires')} {group.requires}
                    </Badge>
                  )}
                </div>

                <div className="space-y-0.5">
                  {group.variables.map((variable) => (
                    <button
                      key={variable.token}
                      type="button"
                      onClick={() => pick(variable.token, variable.label)}
                      className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted transition-colors flex items-baseline justify-between gap-3"
                    >
                      <span className="text-xs">{variable.label}</span>
                      <code className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {`{{${variable.token}}}`}
                      </code>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariablePicker;
