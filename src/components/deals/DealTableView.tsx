/**
 * DEAL TABLE VIEW COMPONENT
 * 
 * Teal-accented table view for deal funnels with accordion stages.
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ClickableUser from '@/components/users/ClickableUser';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, Clock, User, Package, Mail, Phone, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phone';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';

const DEAL_ACCORDION_KEY = 'deal_table_open_stages';

interface DealTableViewProps {
  columns: any[];
  funnel: any;
  onAddDeal: (columnId: string) => void;
  onDealClick?: (dealId: string) => void;
  setColumns: React.Dispatch<React.SetStateAction<any[]>>;
  showProducts?: boolean;
  showCharges?: boolean;
}

const DealTableView = ({ columns, funnel, onAddDeal, onDealClick, setColumns, showProducts = true, showCharges = true }: DealTableViewProps) => {
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

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

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
          <AccordionItem key={column.id} value={column.id} className="deal-glass-card border-deal/10 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-deal/5">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-deal/20" style={{ backgroundColor: column.stageColor || '#14b8a6' }} />
                <span className="font-semibold text-foreground">{column.title}</span>
                <Badge variant="secondary" className="bg-deal/15 text-deal border-deal/30 text-xs">
                  {column.deals.length}
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
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
                                <Avatar className="h-8 w-8 rounded-full">
                                  <AvatarFallback className="bg-deal/20 text-deal text-xs font-medium rounded-full">
                                    {getInitials(deal.name || leadName)}
                                  </AvatarFallback>
                                </Avatar>
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
                                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                                        <TrendingUp className="h-2.5 w-2.5" />
                                        +{formatCurrency(parseFloat(deal.charges_total))}
                                      </span>
                                    )}
                                    {parseFloat(deal.discount_total || '0') > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-rose-400">
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
                                  <User className="h-3 w-3 text-deal/50" />
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
