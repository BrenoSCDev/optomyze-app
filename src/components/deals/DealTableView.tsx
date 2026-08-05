/**
 * DEAL TABLE VIEW COMPONENT
 * 
 * Teal-accented table view for deal funnels with accordion stages.
 */

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ClickableUser from '@/components/users/ClickableUser';
import UserAvatar from '@/components/ui/user-avatar';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, Clock, Package, Mail, Phone, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phone';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';

const DEAL_ACCORDION_KEY = 'deal_table_open_stages';

/**
 * Each stage's rows scroll in their own box, capped at roughly ten deals —
 * the page size — so a stage with hundreds of deals doesn't push the ones
 * below it off the screen, and paging through one stage never moves the
 * others. Mirrors FunnelTableView on the contact side.
 *
 * `[&>div]:overflow-visible` unsets the `overflow-auto` that <Table> puts on
 * its own wrapper. Left alone, that wrapper is the nearest scrollport, so the
 * sticky header would anchor to an element that never scrolls and slide away
 * with the rows.
 */
const STAGE_SCROLL_CLASSES =
  'max-h-[min(70vh,44rem)] overflow-auto [&>div]:overflow-visible scrollbar-deal';

/**
 * Bottom-of-stage sentinel: asks for the next page of deals once it scrolls
 * into view, rooted on the enclosing stage scroller.
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
      className="flex items-center justify-center gap-2 border-t border-deal/10 py-3 text-xs text-muted-foreground"
    >
      <Loader2 className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : 'opacity-40'}`} />
      <span>{isLoading ? 'Loading more deals…' : `Showing ${loaded} of ${total}`}</span>
    </div>
  );
};

interface DealTableViewProps {
  columns: any[];
  funnel: any;
  onAddDeal: (columnId: string) => void;
  onDealClick?: (dealId: string) => void;
  setColumns: React.Dispatch<React.SetStateAction<any[]>>;
  showProducts?: boolean;
  showCharges?: boolean;
  /** Mirrors a persisted move into the shared payload's stage totals. */
  onDealStageChanged?: (dealId: string, newStageId: string, oldStageId: string) => void;
  /** Pulls the next page of deals into a stage — see DealKanbanColumn. */
  onLoadMore?: (stageId: string) => void;
  stageLoading?: Record<string, boolean>;
}

const DealTableView = ({ columns, funnel, onAddDeal, onDealClick, setColumns, showProducts = true, showCharges = true, onDealStageChanged, onLoadMore, stageLoading }: DealTableViewProps) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();

  const [openStages, setOpenStages] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(DEAL_ACCORDION_KEY);
      return stored ? JSON.parse(stored) : columns.map(c => c.id);
    } catch {
      return columns.map(c => c.id);
    }
  });

  useEffect(() => {
    localStorage.setItem(DEAL_ACCORDION_KEY, JSON.stringify(openStages));
  }, [openStages]);

  const formatCurrency = (amount: number, currency: string = companyCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMoveDeal = async (dealId: string, currentStageId: string, newStageId: string) => {
    if (currentStageId === newStageId) return;

    const currentColumn = columns.find(c => c.id === currentStageId);
    const dealToMove = currentColumn?.deals.find((d: any) => d.id === dealId);
    if (!dealToMove) return;

    setColumns(prev =>
      prev.map(col => {
        if (col.id === currentStageId) {
          return { ...col, deals: col.deals.filter((d: any) => d.id !== dealId) };
        }
        if (col.id === newStageId) {
          return { ...col, deals: [{ ...dealToMove, stage_id: parseInt(newStageId) }, ...col.deals] };
        }
        return col;
      })
    );

    try {
      await dealFunnelService.moveDealToStage(dealId, newStageId);
      toast.success('Deal moved successfully');
      onDealStageChanged?.(dealId, newStageId, currentStageId);
    } catch {
      setColumns(prev =>
        prev.map(col => {
          if (col.id === newStageId) {
            return { ...col, deals: col.deals.filter((d: any) => d.id !== dealId) };
          }
          if (col.id === currentStageId) {
            return { ...col, deals: [...col.deals, dealToMove] };
          }
          return col;
        })
      );
      toast.error('Failed to move deal');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <Accordion type="multiple" value={openStages} onValueChange={setOpenStages} className="space-y-3">
        {columns.map((column) => (
          <AccordionItem key={column.id} value={column.id} className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-deal/5">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-deal/20" style={{ backgroundColor: column.stageColor || '#14b8a6' }} />
                <span className="font-semibold text-foreground">{column.title}</span>
                {/* The stage's full size, not the number of rows loaded. */}
                <Badge variant="secondary" className="bg-deal/15 text-deal border-deal/30 text-xs">
                  {column.total ?? column.deals.length}
                </Badge>
                {column.totalValue > 0 && (
                  <Badge className="text-xs font-medium bg-deal/15 text-deal border-deal/30">
                    {formatCurrency(column.totalValue)}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              {column.deals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-8 w-8 text-deal/30 mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">No deals in this stage</p>
                  <Button variant="outline" size="sm" onClick={() => onAddDeal(column.id)} className="text-xs border-deal/30 text-deal hover:bg-deal/10">
                    Add First Deal
                  </Button>
                </div>
              ) : (
                <div data-stage-scroll={column.id} className={STAGE_SCROLL_CLASSES}>
                  <Table>
                    {/* Sticky so the columns stay labelled while a long stage
                        scrolls. The component's own bg-table-header is opaque
                        in both themes, so rows don't show through. */}
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-deal/10 hover:bg-transparent">
                        <TableHead className="text-deal/70">Deal</TableHead>
                        <TableHead className="text-deal/70">Lead</TableHead>
                        <TableHead className="text-deal/70">Contact</TableHead>
                        <TableHead className="text-deal/70">Value</TableHead>
                        {showProducts && <TableHead className="text-deal/70">Items</TableHead>}
                        <TableHead className="text-deal/70">Assigned</TableHead>
                        <TableHead className="text-deal/70">Created</TableHead>
                        <TableHead className="text-deal/70">Move</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {column.deals.map((deal: any) => {
                        const leadName = deal.lead ? `${deal.lead.first_name} ${deal.lead.last_name || ''}`.trim() : '—';
                        return (
                          <TableRow
                            key={deal.id}
                            className="border-deal/5 hover:bg-deal/5 cursor-pointer"
                            onClick={() => onDealClick?.(deal.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {/* The person behind the deal, matching the
                                    deal cards and the contact funnel. */}
                                <UserAvatar
                                  name={leadName}
                                  profilePicPath={deal.lead?.whatsapp_inbox_chat?.profile_pic_url}
                                  avatarKey={deal.lead?.avatar_key}
                                  className="h-8 w-8 text-xs font-medium"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground text-sm truncate max-w-[160px]">{deal.name}</p>
                                  {deal.notes && (
                                    <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{deal.notes}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{leadName}</span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                {deal.lead?.email && (
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Mail className="h-2.5 w-2.5 text-deal/50" />
                                    <span className="truncate max-w-[140px]">{deal.lead.email}</span>
                                  </div>
                                )}
                                {deal.lead?.phone && (
                                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Phone className="h-2.5 w-2.5 text-deal/50" />
                                    <span>{formatPhoneNumber(deal.lead.phone)}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                {deal.final_total > 0 ? (
                                  <Badge className="bg-deal/15 text-deal border-deal/30 text-xs">
                                    {formatCurrency(deal.final_total)}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                                {showCharges && (parseFloat(deal.charges_total || '0') > 0 || parseFloat(deal.discount_total || '0') > 0) && (
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    {parseFloat(deal.charges_total || '0') > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                                        <TrendingUp className="h-2.5 w-2.5" />
                                        +{formatCurrency(parseFloat(deal.charges_total))}
                                      </span>
                                    )}
                                    {parseFloat(deal.discount_total || '0') > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400">
                                        <TrendingDown className="h-2.5 w-2.5" />
                                        -{formatCurrency(parseFloat(deal.discount_total))}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {showProducts && (
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {deal.items?.length || 0}
                              </span>
                            </TableCell>
                            )}
                            <TableCell>
                              {deal.user ? (
                                <ClickableUser userId={deal.user.id} className="gap-1.5">
                                  {/* The owner's actual photo, matching the
                                      contact funnel table and the cards. */}
                                  <UserAvatar
                                    name={deal.user.name}
                                    profilePicPath={deal.user.profile_pic}
                                    className="h-6 w-6 text-[10px]"
                                  />
                                  <span className="text-xs text-muted-foreground">{deal.user.name}</span>
                                </ClickableUser>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 text-deal/50" />
                                <span>{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={column.id}
                                onValueChange={(newStageId) => handleMoveDeal(deal.id, column.id, newStageId)}
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-deal/20 focus:ring-deal/30">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-deal/20 z-50">
                                  {columns.map((col) => (
                                    <SelectItem key={col.id} value={col.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.stageColor || '#14b8a6' }} />
                                        {col.title}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {column.hasMore && (
                    <LoadMoreRow
                      stageId={column.id}
                      loaded={column.deals.length}
                      total={column.total ?? column.deals.length}
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

export default DealTableView;
