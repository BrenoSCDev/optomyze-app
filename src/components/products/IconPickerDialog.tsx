/**
 * ICON PICKER DIALOG
 *
 * Lets users search and select icons from react-icons (Fa, Md, Hi, Bs, Ai sets).
 * Stores the icon identifier string (e.g. "FaBox") and resolves it at render time.
 */

import { useState, useMemo, useCallback } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as HiIcons from 'react-icons/hi';
import * as BsIcons from 'react-icons/bs';
import * as AiIcons from 'react-icons/ai';
import * as RiIcons from 'react-icons/ri';
import * as IoIcons from 'react-icons/io5';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon registry — map identifier prefix to icon set
const ICON_SETS: Record<string, Record<string, any>> = {
  Fa: FaIcons,
  Md: MdIcons,
  Hi: HiIcons,
  Bs: BsIcons,
  Ai: AiIcons,
  Ri: RiIcons,
  Io: IoIcons,
};

// Build a flat array of { key, component } for searching
const ALL_ICONS: { key: string; component: React.ElementType }[] = [];
Object.entries(ICON_SETS).forEach(([, set]) => {
  Object.entries(set).forEach(([key, comp]) => {
    if (typeof comp === 'function') {
      ALL_ICONS.push({ key, component: comp as React.ElementType });
    }
  });
});

/** Resolve an icon identifier string to a React component */
export function resolveIcon(iconKey: string | null | undefined): React.ElementType | null {
  if (!iconKey) return null;
  for (const set of Object.values(ICON_SETS)) {
    if (set[iconKey]) return set[iconKey] as React.ElementType;
  }
  return null;
}

/** Render an icon by its string key, with optional className */
export function IconDisplay({
  iconKey,
  className,
}: {
  iconKey: string | null | undefined;
  className?: string;
}) {
  const Icon = resolveIcon(iconKey);
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onChange: (iconKey: string | null) => void;
}

const PAGE_SIZE = 80;

const IconPickerDialog = ({ open, onOpenChange, value, onChange }: IconPickerDialogProps) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_ICONS;
    return ALL_ICONS.filter((i) => i.key.toLowerCase().includes(q));
  }, [search]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);

  const handleSelect = useCallback(
    (key: string) => {
      onChange(key === value ? null : key);
      onOpenChange(false);
    },
    [value, onChange, onOpenChange]
  );

  const handleClear = () => {
    onChange(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Choose Icon</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons… (e.g. box, star, user)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Current selection */}
          {value && (
            <div className="flex items-center gap-3 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <IconDisplay iconKey={value} className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary flex-1">{value}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClear}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Grid */}
          <ScrollArea className="h-72">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 p-1">
              {paginated.map(({ key, component: Icon }) => (
                <button
                  key={key}
                  title={key}
                  onClick={() => handleSelect(key)}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-md hover:bg-accent transition-colors',
                    value === key && 'bg-primary/20 ring-1 ring-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Load more */}
            {paginated.length < filtered.length && (
              <div className="flex justify-center py-3">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                  Load more ({filtered.length - paginated.length} remaining)
                </Button>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No icons found for "{search}"</div>
            )}
          </ScrollArea>

          <p className="text-xs text-muted-foreground text-right">
            Showing {paginated.length} of {filtered.length} icons
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IconPickerDialog;
