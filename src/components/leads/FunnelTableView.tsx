/**
 * FUNNEL TABLE VIEW COMPONENT
 * 
 * Renders funnel stages as collapsible accordions with leads in table format.
 * Shares the same data and actions as KanbanBoard.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber } from '@/lib/phone';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Mail, 
  Phone, 
  Clock, 
  Tag,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import TagBadge from '@/components/tags/TagBadge';
import SourcePlatformIcon from './SourcePlatformIcon';
import UserAvatar from '@/components/ui/user-avatar';
import ClickableUser from '@/components/users/ClickableUser';

const ACCORDION_STORAGE_KEY = 'funnel_table_open_stages';

/**
 * Each stage's rows scroll in their own box, capped at roughly ten leads —
 * the page size — so a stage with hundreds of leads doesn't push the ones
 * below it off the screen, and paging through one stage never moves the
 * others. 44rem is ten rows plus the header; the vh term keeps it sane on
 * short viewports.
 */
/*
 * `[&>div]:overflow-visible` unsets the `overflow-auto` that <Table> puts on
 * its own wrapper. Left alone, that wrapper is the nearest scrollport, so the
 * sticky header would anchor to it — an element that never scrolls — and the
 * header would slide away with the rows. Neutralising it makes this box the
 * scrollport for both the sticky header and the sentinel below.
 */
const STAGE_SCROLL_CLASSES =
  'max-h-[min(70vh,44rem)] overflow-auto [&>div]:overflow-visible scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20';

/**
 * Bottom-of-stage sentinel: asks for the next page of leads once it scrolls
 * into view. Rooted on the enclosing stage scroller (see above) so it fires on
 * that stage's own scrolling, falling back to the viewport if the markup ever
 * changes.
 */
const LoadMoreRow = ({
  stageId,
  loaded,
  total,
  isLoading,
  onLoadMore,
}: {
  stageId: string;
  loaded: number;
  total: number;
  isLoading: boolean;
  onLoadMore?: (stageId: string) => void;
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore(stageId);
      },
      { root: sentinel.closest<HTMLElement>('[data-stage-scroll]'), rootMargin: '150px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [stageId, onLoadMore, loaded]);

  return (
    <div
      ref={sentinelRef}
      className="flex items-center justify-center gap-2 border-t border-border py-3 text-xs text-muted-foreground"
    >
      <Loader2 className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : 'opacity-40'}`} />
      <span>{isLoading ? 'Loading more leads…' : `Showing ${loaded} of ${total}`}</span>
    </div>
  );
};

interface FunnelTableViewProps {
  columns: any[];
  funnel: any;
  onAddLead: (columnId: string) => void;
  onTagClick?: (lead: any) => void;
  onLeadClick?: (leadId: string) => void;
  onUpdateLeadStage?: (leadId: string, newStageId: string, oldStageId: string) => void;
  showEstimatedValues?: boolean;
  showAssignedUser?: boolean;
  setColumns: React.Dispatch<React.SetStateAction<any[]>>;
  /** Pulls the next page of leads into a stage — see KanbanColumn. */
  onLoadMore?: (stageId: string) => void;
  stageLoading?: Record<string, boolean>;
}

const FunnelTableView = ({
  columns,
  funnel,
  onAddLead,
  onTagClick,
  onLeadClick,
  onUpdateLeadStage,
  showEstimatedValues = true,
  showAssignedUser = true,
  setColumns,
  onLoadMore,
  stageLoading,
}: FunnelTableViewProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();

  // Persist accordion state
  const [openStages, setOpenStages] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(ACCORDION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : columns.map(c => c.id);
    } catch {
      return columns.map(c => c.id);
    }
  });

  useEffect(() => {
    localStorage.setItem(ACCORDION_STORAGE_KEY, JSON.stringify(openStages));
  }, [openStages]);

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n.length > 0 && !n.includes('-'));
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const formatCurrency = (amount: number, currency: string = companyCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMoveLeadToStage = async (leadId: string, currentStageId: string, newStageId: string) => {
    if (currentStageId === newStageId) return;

    const currentColumn = columns.find(c => c.id === currentStageId);
    const leadToMove = currentColumn?.leads.find((l: any) => l.id === leadId);
    if (!leadToMove) return;

    const leadValue = leadToMove.value || 0;

    // Optimistic update
    setColumns(prev =>
      prev.map(col => {
        if (col.id === currentStageId) {
          return {
            ...col,
            leads: col.leads.filter((l: any) => l.id !== leadId),
            valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue),
          };
        }
        if (col.id === newStageId) {
          return {
            ...col,
            leads: [{ ...leadToMove, stage: newStageId }, ...col.leads],
            valueEstimated: (col.valueEstimated || 0) + leadValue,
          };
        }
        return col;
      })
    );

    try {
      await leadService.moveLeadToStage(leadId, newStageId);
      toast.success(t('funnel.page.lead-moved') || 'Lead moved successfully');
      onUpdateLeadStage?.(leadId, newStageId, currentStageId);
    } catch {
      // Revert
      setColumns(prev =>
        prev.map(col => {
          if (col.id === newStageId) {
            return {
              ...col,
              leads: col.leads.filter((l: any) => l.id !== leadId),
              valueEstimated: Math.max(0, (col.valueEstimated || 0) - leadValue),
            };
          }
          if (col.id === currentStageId) {
            return {
              ...col,
              leads: [...col.leads, leadToMove],
              valueEstimated: (col.valueEstimated || 0) + leadValue,
            };
          }
          return col;
        })
      );
      toast.error('Failed to move lead. Please try again.');
    }
  };

  const handleLeadClick = (leadId: string) => {
    if (onLeadClick) {
      onLeadClick(leadId);
    } else {
      navigate(`/leads/${funnel.id}/lead/${leadId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <Accordion
        type="multiple"
        value={openStages}
        onValueChange={setOpenStages}
        className="space-y-3"
      >
        {columns.map((column) => (
          <AccordionItem
            key={column.id}
            value={column.id}
            className="glass-card border-border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-surface-2">
              <div className="flex items-center gap-3 flex-1">
                {/* Stage color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: column.stageColor || '#FFFFFF' }}
                />
                <span className="font-semibold text-foreground">{column.title}</span>
                {/* The stage's full size, not the number of rows loaded. */}
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                  {column.total ?? column.leads.length}
                </Badge>
                {showEstimatedValues && column.valueEstimated > 0 && (
                  <Badge className="text-xs font-medium">
                    {formatCurrency(column.valueEstimated)}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              {column.leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('funnel.page.table-no-leads') || 'No leads in this stage'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => onAddLead(column.id)} className="text-xs">
                    {t('funnel.page.add-first-lead') || 'Add First Lead'}
                  </Button>
                </div>
              ) : (
                <div data-stage-scroll={column.id} className={STAGE_SCROLL_CLASSES}>
                  <Table>
                    {/* Sticky so the columns stay labelled while a long stage
                        scrolls. The component's own bg-table-header is opaque
                        in both themes, so rows don't show through. */}
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-name') || 'Name'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-contact') || 'Contact'}</TableHead>
                        {showEstimatedValues && (
                          <TableHead className="text-muted-foreground">{t('funnel.page.table-value') || 'Value'}</TableHead>
                        )}
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-source') || 'Source'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-tags') || 'Tags'}</TableHead>
                        {showAssignedUser && (
                          <TableHead className="text-muted-foreground">{t('funnel.page.table-assigned') || 'Assigned'}</TableHead>
                        )}
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-activity') || 'Last Activity'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-move') || 'Move'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {column.leads.map((lead: any) => (
                        <TableRow
                          key={lead.id}
                          className="border-border hover:bg-surface-2 cursor-pointer"
                          onClick={() => handleLeadClick(lead.id)}
                        >
                          {/* Name */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                                  {getInitials(lead.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm truncate max-w-[180px]">
                                  {lead.name}
                                </p>
                                {/* Only a real value gets a second line — this
                                    used to render the literal "N/A" for every
                                    contact without an industry. */}
                                {lead.company && lead.company !== 'N/A' && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {lead.company}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Contact */}
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{lead.email || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span>{lead.phone ? formatPhoneNumber(lead.phone) : '—'}</span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Value */}
                          {showEstimatedValues && (
                            <TableCell>
                              {lead.value > 0 ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  {formatCurrency(lead.value)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}

                          {/* Source — the same icon the cards and filters use,
                              rather than this table's own coloured text badge. */}
                          <TableCell>
                            <SourcePlatformIcon source={lead.source} className="w-4 h-4" />
                          </TableCell>

                          {/* Tags */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {lead.tags?.slice(0, 2).map((tag: any, i: number) => (
                                <TagBadge key={i} tag={tag} className="px-1.5 py-0" />
                              ))}
                              {lead.tags?.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{lead.tags.length - 2}</span>
                              )}
                              {onTagClick && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTagClick(lead);
                                  }}
                                  className="p-1 rounded-md hover:bg-surface-3 transition-colors"
                                >
                                  <Tag className="w-3 h-3 text-muted-foreground hover:text-accent" />
                                </button>
                              )}
                            </div>
                          </TableCell>

                          {/* Assigned */}
                          {showAssignedUser && (
                            <TableCell>
                              {lead.assigned_user ? (
                                <ClickableUser userId={lead.assigned_user.id} className="gap-1.5">
                                  <UserAvatar
                                    name={lead.assigned_user.name}
                                    profilePicPath={lead.assigned_user.profile_pic}
                                    className="h-6 w-6 text-[10px]"
                                  />
                                  <span className="text-xs text-muted-foreground">{lead.assigned_user.name}</span>
                                </ClickableUser>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )}

                          {/* Last Activity */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{lead.lastActivity}</span>
                            </div>
                          </TableCell>

                          {/* Move to stage */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={column.id}
                              onValueChange={(newStageId) =>
                                handleMoveLeadToStage(lead.id, column.id, newStageId)
                              }
                            >
                              <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border z-50">
                                {columns.map((col) => (
                                  <SelectItem key={col.id} value={col.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: col.stageColor || '#FFFFFF' }}
                                      />
                                      {col.title}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {column.hasMore && (
                    <LoadMoreRow
                      stageId={column.id}
                      loaded={column.leads.length}
                      total={column.total ?? column.leads.length}
                      isLoading={!!stageLoading?.[column.id]}
                      onLoadMore={onLoadMore}
                    />
                  )}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
};

export default FunnelTableView;
