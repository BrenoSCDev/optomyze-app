/**
 * CONTACTS
 *
 * Every lead in the company as a flat, paginated list. Leads no longer have to
 * belong to a funnel, so this — not the funnel board — is the canonical view.
 *
 * Table and grid share one data source and one selection model; the checkboxes
 * are wired to state now so the bulk-action bar can be filled in later.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, ArchiveRestore, ChevronLeft, ChevronRight, Download, Filter, Grid3x3,
  List, MessageSquare, Phone, Plus, Search, SlidersHorizontal, Tag, UserPlus, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { formatPhoneNumber } from '@/lib/phone';
import UserAvatar from '@/components/ui/user-avatar';
import LeadPreviewModal from '@/components/leads/LeadPreviewModal';
import MoveFunnelModal from '@/components/leads/MoveFunnelModal';
import ContactCreationDialog from './ContactCreationDialog';
import { IoFunnelOutline } from 'react-icons/io5';
import TagManagementModal from '@/components/leads/TagManagementModal';
import AssignUserModal, { CompanyUser } from '@/components/leads/AssignUserModal';
import api from '@/services/api';
import QuickChatModal from './QuickChatModal';
import {
  Contact, ContactFilters, ContactsMeta, bulkArchiveContacts, bulkAssignContacts,
  bulkMoveContactsToFunnel, bulkTagContacts, contactAvatarPath, contactDisplayName, fetchContacts,
  setContactArchived,
} from '@/services/contactApi';
import SourcePlatformIcon, { sourcePlatformMeta } from './SourcePlatformIcon';

type ViewMode = 'table' | 'grid';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const ManageContacts: React.FC = () => {
  const { t } = useLanguage();
  const { funnels } = useAuth();

  const [view, setView] = useState<ViewMode>('table');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<ContactsMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [funnelFilter, setFunnelFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [archivedFilter, setArchivedFilter] = useState<'active' | 'archived' | 'all'>('active');

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<string | undefined>(undefined);
  const [funnelTarget, setFunnelTarget] = useState<Contact | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tagTarget, setTagTarget] = useState<Contact | null>(null);
  const [assignTarget, setAssignTarget] = useState<Contact | null>(null);
  const [chatTarget, setChatTarget] = useState<Contact | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkFunnelOpen, setBulkFunnelOpen] = useState(false);

  // Reference data the tag/assign modals need. Fetched once, lazily — the
  // list itself doesn't need either.
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/api/tags', { params: { scope: 'lead' } }).then(r => r.data?.data ?? r.data ?? []).catch(() => []),
      api.get('/api/users').then(r => r.data?.data ?? r.data ?? []).catch(() => []),
    ]).then(([tags, users]) => {
      if (cancelled) return;
      setAvailableTags(Array.isArray(tags) ? tags : []);
      setCompanyUsers(Array.isArray(users) ? users : []);
    });
    return () => { cancelled = true; };
  }, []);

  const openPreview = (id: number, tab?: string) => { setPreviewTab(tab); setPreviewId(String(id)); };

  const toggleArchived = async (c: Contact) => {
    const next = c.is_active !== false;   // currently live -> archive it
    try {
      await setContactArchived(c.id, next);
      toast.success(next ? t('contacts.archived-done') : t('contacts.unarchived-done'));
      load();
    } catch {
      toast.error(t('contacts.archive-failed'));
    }
  };

  /**
   * The API omits contact funnels entirely when the company has contact
   * pipelines disabled, so "no contact funnels" is an exact proxy for the
   * feature being off — no separate settings fetch required.
   */
  const contactFunnels = (funnels ?? []).filter((f: any) => f.type === 'contact');
  const pipelinesEnabled = contactFunnels.length > 0;

  /** Where a contact can actually be filed: active funnels only. */
  const addableFunnels = contactFunnels
    .filter((f: any) => f.is_active)
    .map((f: any) => ({ id: f.id, name: f.name }));

  /** Quick actions shared by the table row and the grid card. */
  const rowActions = (c: Contact) => [
    { key: 'chat',   Icon: MessageSquare, label: t('contacts.action-chat'),   run: () => setChatTarget(c) },
    // Placeholder until VoIP lands. Not `disabled`: a disabled button emits no
    // pointer events, so its tooltip would never open — which is the only
    // thing this control is here to say.
    { key: 'call',   Icon: Phone,         label: t('contacts.action-call-soon'), run: () => {}, soon: true },
    // Hidden entirely when the company doesn't run contact pipelines —
    // there is nowhere to file a contact, so the action would be a dead end.
    ...(pipelinesEnabled
      ? [{ key: 'funnel', Icon: IoFunnelOutline, label: t('contacts.action-add-to-funnel'), run: () => setFunnelTarget(c) }]
      : []),
    { key: 'tags',   Icon: Tag,           label: t('contacts.action-tags'),   run: () => setTagTarget(c) },
    { key: 'assign', Icon: UserPlus,      label: t('contacts.action-assign'), run: () => setAssignTarget(c) },
    c.is_active === false
      ? { key: 'unarchive', Icon: ArchiveRestore, label: t('contacts.action-unarchive'), run: () => toggleArchived(c) }
      : { key: 'archive',   Icon: Archive,        label: t('contacts.action-archive'),   run: () => toggleArchived(c) },
  ];

  const QuickActions: React.FC<{ contact: Contact }> = ({ contact }) => (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {rowActions(contact).map(({ key, Icon, label, run, soon }: any) => (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              aria-disabled={soon || undefined}
              onClick={soon ? undefined : run}
              className={soon ? 'cursor-default text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground/50' : undefined}
            >
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );

  // Debounce the box into the query so we don't fire per keystroke.
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters: ContactFilters = useMemo(() => ({
    page,
    per_page: perPage,
    search: search || undefined,
    funnel_id: funnelFilter === 'all' || funnelFilter === 'none' ? undefined : funnelFilter,
    without_funnel: funnelFilter === 'none' || undefined,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    archived: archivedFilter,
  }), [page, perPage, search, funnelFilter, priorityFilter, archivedFilter]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchContacts(filters);
      setContacts(res.data);
      setMeta(res.meta);
    } catch {
      toast.error(t('contacts.load-failed'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => { load(); }, [load]);

  /**
   * Selection deliberately survives pagination, so a user can gather rows from
   * several pages before acting. It's keyed on ids, which stay meaningful once
   * those rows scroll out of view.
   *
   * Changing a *filter* still clears it: the selected rows may no longer be
   * reachable, and acting on records you can't see is surprising.
   */
  useEffect(() => { setSelected(new Set()); }, [search, funnelFilter, priorityFilter, archivedFilter]);

  const allOnPageSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id));

  const toggleAll = () => {
    setSelected(prev => {
      if (allOnPageSelected) return new Set();
      const next = new Set(prev);
      contacts.forEach(c => next.add(c.id));
      return next;
    });
  };

  const toggleOne = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeFilterCount =
    (funnelFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0) +
    (archivedFilter !== 'active' ? 1 : 0);

  const clearFilters = () => {
    setFunnelFilter('all'); setPriorityFilter('all'); setArchivedFilter('active'); setPage(1);
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const runBulk = async (fn: () => Promise<number>, successKey: string) => {
    try {
      setBulkBusy(true);
      const updated = await fn();
      toast.success(`${updated} ${t(successKey)}`);
      setSelected(new Set());
      load();
    } catch {
      toast.error(t('contacts.bulk-failed'));
    } finally {
      setBulkBusy(false);
    }
  };

  /** Client-side CSV of the current page — matches what the user can see. */
  const handleExport = () => {
    if (!contacts.length) return;
    const rows = contacts.filter(c => selected.size === 0 || selected.has(c.id));
    const header = ['Name', 'Email', 'Phone', 'Funnel', 'Stage', 'Owner', 'Priority', 'Created'];
    const csv = [
      header.join(','),
      ...rows.map(c => [
        contactDisplayName(c), c.email ?? '', c.phone ?? '',
        c.funnel?.name ?? '', c.stage?.name ?? '', c.assigned_user?.name ?? '',
        c.priority ?? '', new Date(c.created_at).toLocaleDateString(),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('contacts.exported'));
  };

  const rangeStart = meta ? (meta.current_page - 1) * meta.per_page + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('contacts.search-placeholder')}
            className="h-9 pl-8 pr-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={cn(activeFilterCount > 0 && 'border-primary text-primary')}>
              <SlidersHorizontal />
              <span className="hidden sm:inline">{t('contacts.filters')}</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {pipelinesEnabled && (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {t('contacts.filter-funnel')}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={funnelFilter} onValueChange={(v) => { setFunnelFilter(v); setPage(1); }}>
                  <DropdownMenuRadioItem value="all">{t('contacts.all-contacts')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="none">{t('contacts.no-pipeline')}</DropdownMenuRadioItem>
                  {contactFunnels.map((f: any) => (
                    <DropdownMenuRadioItem key={f.id} value={String(f.id)}>{f.name}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {t('contacts.filter-archived')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={archivedFilter}
              onValueChange={(v) => { setArchivedFilter(v as typeof archivedFilter); setPage(1); }}
            >
              <DropdownMenuRadioItem value="active">{t('contacts.archived-hide')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="archived">{t('contacts.archived-only')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="all">{t('contacts.archived-all')}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {t('contacts.filter-priority')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
              <DropdownMenuRadioItem value="all">{t('contacts.any-priority')}</DropdownMenuRadioItem>
              {PRIORITIES.map(p => (
                <DropdownMenuRadioItem key={p} value={p}>{t(`lead-details.priority-${p}`)}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                >
                  {t('contacts.clear-filters')}
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-input-border">
            {([['table', List], ['grid', Grid3x3]] as const).map(([mode, Icon]) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setView(mode)}
                    aria-label={t(`contacts.view-${mode}`)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center transition-colors duration-fast ease-standard',
                      view === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{t(`contacts.view-${mode}`)}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} disabled={!contacts.length}>
            <Download />
            <span className="hidden sm:inline">{t('contacts.export')}</span>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus />
            <span className="hidden sm:inline">{t('contacts.new')}</span>
          </Button>
        </div>
      </div>

      {/* Bulk actions. The selection spans pages, so the count can exceed
          what's currently rendered. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-selected px-3 py-2 text-sm">
          <span className="font-medium text-selected-foreground">
            {selected.size} {t('contacts.selected')}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={bulkBusy}>
            {t('contacts.clear-selection')}
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Same gate as the row action: nowhere to file them, no button. */}
            {pipelinesEnabled && (
              <Button
                variant="outline" size="sm" disabled={bulkBusy}
                onClick={() => setBulkFunnelOpen(true)}
              >
                <IoFunnelOutline />
                {t('contacts.bulk-add-to-funnel')}
              </Button>
            )}
            <Button
              variant="outline" size="sm" disabled={bulkBusy}
              onClick={() => setBulkTagOpen(true)}
            >
              <Tag />
              {t('contacts.bulk-tag')}
            </Button>
            <Button
              variant="outline" size="sm" disabled={bulkBusy}
              onClick={() => setBulkAssignOpen(true)}
            >
              <UserPlus />
              {t('contacts.bulk-assign')}
            </Button>
            {archivedFilter === 'archived' ? (
              <Button
                variant="outline" size="sm" loading={bulkBusy}
                onClick={() => runBulk(() => bulkArchiveContacts(selectedIds, false), 'contacts.bulk-unarchived')}
              >
                {!bulkBusy && <ArchiveRestore />}
                {t('contacts.bulk-unarchive')}
              </Button>
            ) : (
              <Button
                variant="outline" size="sm" loading={bulkBusy}
                onClick={() => runBulk(() => bulkArchiveContacts(selectedIds, true), 'contacts.bulk-archived')}
              >
                {!bulkBusy && <Archive />}
                {t('contacts.bulk-archive')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {search || activeFilterCount > 0 ? t('contacts.no-results') : t('contacts.empty')}
            </p>
          </div>
        ) : view === 'table' ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-table-header">
              <tr className="border-b border-table-border">
                <th className="w-10 px-3 py-2.5">
                  <Checkbox checked={allOnPageSelected} onCheckedChange={toggleAll} aria-label={t('contacts.select-all')} />
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-table-header-foreground">{t('contacts.col-name')}</th>
                <th className="hidden px-3 py-2.5 text-left font-medium text-table-header-foreground md:table-cell">{t('contacts.col-contact')}</th>
                {pipelinesEnabled && (
                  <th className="hidden px-3 py-2.5 text-left font-medium text-table-header-foreground lg:table-cell">{t('contacts.col-pipeline')}</th>
                )}
                <th className="hidden px-3 py-2.5 text-left font-medium text-table-header-foreground lg:table-cell">{t('contacts.col-owner')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-table-header-foreground">{t('contacts.col-origin')}</th>
                <th className="w-[196px] px-3 py-2.5 text-right font-medium text-table-header-foreground">{t('contacts.col-actions')}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr
                  key={c.id}
                  onClick={() => setPreviewId(String(c.id))}
                  className={cn(
                    'cursor-pointer border-b border-table-border transition-colors duration-fast ease-standard hover:bg-table-hover',
                    selected.has(c.id) && 'bg-table-selected'
                  )}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} aria-label={contactDisplayName(c)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={contactDisplayName(c)}
                        profilePicPath={contactAvatarPath(c)}
                        className="h-8 w-8 shrink-0 text-[11px]"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{contactDisplayName(c)}</div>
                        <div className="truncate text-xs text-muted-foreground md:hidden">
                          {c.email ?? formatPhoneNumber(c.phone ?? '')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                    <div className="truncate">{c.email ?? '—'}</div>
                    <div className="text-xs">{c.phone ? formatPhoneNumber(c.phone) : ''}</div>
                  </td>
                  {pipelinesEnabled && (
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      {c.funnel ? (
                        <span className="text-muted-foreground">
                          {c.funnel.name}{c.stage ? ` · ${c.stage.name}` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-subtle">{t('contacts.no-pipeline')}</span>
                      )}
                    </td>
                  )}
                  <td className="hidden px-3 py-2.5 lg:table-cell">
                    {c.assigned_user ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={c.assigned_user.name} profilePicPath={c.assigned_user.profile_pic} className="h-6 w-6 text-[10px]" />
                        <span className="truncate text-muted-foreground">{c.assigned_user.name}</span>
                      </div>
                    ) : <span className="text-xs text-subtle">{t('contacts.unassigned')}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <SourcePlatformIcon platform={c.source_platform} className="h-4 w-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{sourcePlatformMeta(c.source_platform).label}</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <QuickActions contact={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {contacts.map(c => (
              <div
                key={c.id}
                onClick={() => setPreviewId(String(c.id))}
                className={cn(
                  'cursor-pointer rounded-lg border bg-card p-3 shadow-elevation-sm transition-colors duration-fast ease-standard hover:border-border-strong hover:bg-surface-2',
                  selected.has(c.id) ? 'border-primary' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar
                      name={contactDisplayName(c)}
                      profilePicPath={contactAvatarPath(c)}
                      className="h-9 w-9 shrink-0 text-xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{contactDisplayName(c)}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.email ?? (c.phone ? formatPhoneNumber(c.phone) : '—')}</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} aria-label={contactDisplayName(c)} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <SourcePlatformIcon platform={c.source_platform} className="h-3.5 w-3.5 shrink-0" />
                    {sourcePlatformMeta(c.source_platform).label}
                  </span>
                  {c.assigned_user
                    ? <UserAvatar name={c.assigned_user.name} profilePicPath={c.assigned_user.profile_pic} className="h-6 w-6 text-[10px]" />
                    : <span className="text-[11px] text-subtle">{t('contacts.unassigned')}</span>}
                </div>

                {pipelinesEnabled && (
                  <p className="mt-2 truncate text-[11px] text-subtle">
                    {c.funnel ? `${c.funnel.name}${c.stage ? ` · ${c.stage.name}` : ''}` : t('contacts.no-pipeline')}
                  </p>
                )}

                <div className="mt-2 flex justify-end border-t border-border pt-2">
                  <QuickActions contact={c} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.total > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {rangeStart}–{rangeEnd} {t('contacts.of')} {meta.total}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('contacts.per-page')}</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(meta.page_sizes ?? [10, 15, 20, 50, 100]).map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost" size="icon-sm"
              aria-label={t('contacts.previous')}
              disabled={meta.current_page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="px-2 text-xs tabular-nums text-muted-foreground">
              {meta.current_page} / {meta.last_page}
            </span>
            <Button
              variant="ghost" size="icon-sm"
              aria-label={t('contacts.next')}
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk tag / assign pickers. Lightweight on purpose: the per-lead
          modals expect a single lead and its current values. */}
      {/* Bulk add-to-funnel. Mirrors the tag picker: pick one, it applies to
          the whole selection and closes. */}
      <Dialog open={bulkFunnelOpen} onOpenChange={setBulkFunnelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('contacts.bulk-add-to-funnel-title')}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {selected.size} {t('contacts.selected')}
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {addableFunnels.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('contacts.no-funnels')}</p>
            )}
            {addableFunnels.map((f: any) => (
              <button
                key={f.id}
                type="button"
                disabled={bulkBusy}
                onClick={() => {
                  setBulkFunnelOpen(false);
                  runBulk(() => bulkMoveContactsToFunnel(selectedIds, f.id), 'contacts.bulk-moved-to-funnel');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-surface-3"
              >
                <IoFunnelOutline className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('contacts.bulk-tag-title')}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {selected.size} {t('contacts.selected')}
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {availableTags.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">{t('contacts.no-tags')}</p>
            )}
            {availableTags.map((tag: any) => (
              <button
                key={tag.id}
                type="button"
                disabled={bulkBusy}
                onClick={() => {
                  setBulkTagOpen(false);
                  runBulk(() => bulkTagContacts(selectedIds, [tag.id], 'attach'), 'contacts.bulk-tagged');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-surface-3"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color || 'hsl(var(--muted-foreground))' }}
                />
                <span className="truncate">{tag.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('contacts.bulk-assign-title')}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {selected.size} {t('contacts.selected')}
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => {
                setBulkAssignOpen(false);
                runBulk(() => bulkAssignContacts(selectedIds, null), 'contacts.bulk-assigned');
              }}
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-fast ease-standard hover:bg-surface-3"
            >
              {t('contacts.unassign')}
            </button>
            {companyUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={bulkBusy}
                onClick={() => {
                  setBulkAssignOpen(false);
                  runBulk(() => bulkAssignContacts(selectedIds, u.id), 'contacts.bulk-assigned');
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-surface-3"
              >
                <UserAvatar name={u.name} profilePicPath={(u as any).profile_pic} className="h-6 w-6 text-[10px]" />
                <span className="truncate">{u.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <QuickChatModal
        open={!!chatTarget}
        onClose={() => setChatTarget(null)}
        leadId={chatTarget ? Number(chatTarget.id) : null}
        leadName={chatTarget ? contactDisplayName(chatTarget) : ''}
      />

      <LeadPreviewModal
        isOpen={!!previewId}
        onClose={() => { setPreviewId(null); setPreviewTab(undefined); }}
        leadId={previewId}
        initialTab={previewTab}
        onLeadDeleted={load}
      />

      <ContactCreationDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
      />

      {/* Puts the contact into a pipeline. Only reachable when the company
          runs contact funnels — see contactFunnels. */}
      <MoveFunnelModal
        isOpen={!!funnelTarget}
        onClose={() => setFunnelTarget(null)}
        leadId={funnelTarget ? String(funnelTarget.id) : ''}
        funnels={addableFunnels}
        onMoved={() => { setFunnelTarget(null); load(); }}
      />

      <TagManagementModal
        isOpen={!!tagTarget}
        onClose={() => setTagTarget(null)}
        lead={tagTarget as any}
        availableTags={availableTags}
        onTagsUpdated={() => { setTagTarget(null); load(); }}
      />

      <AssignUserModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        leadId={assignTarget ? Number(assignTarget.id) : 0}
        users={companyUsers}
        currentAssignedUserId={assignTarget?.assigned_user?.id}
        onUserAssigned={() => { setAssignTarget(null); load(); }}
      />
    </div>
  );
};

export default ManageContacts;
