/**
 * DEAL TABLE VIEW COMPONENT
 * 
 * Renders deal funnel stages as collapsible accordions with deals in table format.
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, Clock, User, ArrowRightLeft, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { dealFunnelService } from '@/services/dealFunnelApi';
import { toast } from 'sonner';

const DEAL_ACCORDION_KEY = 'deal_table_open_stages';

interface DealTableViewProps {
  columns: any[];
  funnel: any;
  onAddDeal: (columnId: string) => void;
  onDealClick?: (dealId: string) => void;
  setColumns: React.Dispatch<React.SetStateAction<any[]>>;
}

const DealTableView = ({ columns, funnel, onAddDeal, onDealClick, setColumns }: DealTableViewProps) => {
  const { t } = useLanguage();

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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleMoveDeal = async (dealId: string, currentStageId: string, newStageId: string) => {
    if (currentStageId === newStageId) return;

    const currentColumn = columns.find(c => c.id === currentStageId);
    const dealToMove = currentColumn?.deals.find((d: any) => d.id === dealId);
    if (!dealToMove) return;

    // Optimistic update
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
      // Revert
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
          <AccordionItem key={column.id} value={column.id} className="glass-card border-white/10 rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.stageColor || '#FFFFFF' }} />
                <span className="font-semibold text-foreground">{column.title}</span>
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                  {column.deals.length}
                </Badge>
                {column.totalValue > 0 && (
                  <Badge className="text-xs font-medium">
                    {formatCurrency(column.totalValue, column.currency)}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              {column.deals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">No deals in this stage</p>
                  <Button variant="outline" size="sm" onClick={() => onAddDeal(column.id)} className="text-xs">
                    Add First Deal
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Deal</TableHead>
                        <TableHead className="text-muted-foreground">Lead</TableHead>
                        <TableHead className="text-muted-foreground">Value</TableHead>
                        <TableHead className="text-muted-foreground">Items</TableHead>
                        <TableHead className="text-muted-foreground">Assigned</TableHead>
                        <TableHead className="text-muted-foreground">Created</TableHead>
                        <TableHead className="text-muted-foreground">Move</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {column.deals.map((deal: any) => {
                        const leadName = deal.lead ? `${deal.lead.first_name} ${deal.lead.last_name || ''}`.trim() : '—';
                        return (
                          <TableRow
                            key={deal.id}
                            className="border-white/5 hover:bg-white/5 cursor-pointer"
                            onClick={() => onDealClick?.(deal.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                                    {getInitials(deal.name || leadName)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="font-medium text-foreground text-sm truncate max-w-[180px]">{deal.name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">{leadName}</span>
                            </TableCell>
                            <TableCell>
                              {deal.final_total > 0 ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  {formatCurrency(deal.final_total, deal.currency || 'USD')}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {deal.items?.length || 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              {deal.user ? (
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{deal.user.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '—'}</span>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={column.id}
                                onValueChange={(newStageId) => handleMoveDeal(deal.id, column.id, newStageId)}
                              >
                                <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-white/10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-white/10 z-50">
                                  {columns.map((col) => (
                                    <SelectItem key={col.id} value={col.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.stageColor || '#FFFFFF' }} />
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
