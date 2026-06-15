/**
 * FUNNEL TABLE VIEW COMPONENT
 * 
 * Renders funnel stages as collapsible accordions with leads in table format.
 * Shares the same data and actions as KanbanBoard.
 */

import { useState, useEffect } from 'react';
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
  TrendingUp, 
  Mail, 
  Phone, 
  Clock, 
  Tag, 
  User,
  ArrowRightLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';
import TagBadge from '@/components/tags/TagBadge';
import ClickableUser from '@/components/users/ClickableUser';

const ACCORDION_STORAGE_KEY = 'funnel_table_open_stages';

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

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[priority] || 'bg-muted text-muted-foreground';
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'Meta Ads': 'bg-blue-500/20 text-blue-400',
      'Google Ads': 'bg-green-500/20 text-green-400',
      'Organic': 'bg-purple-500/20 text-purple-400',
      'Referral': 'bg-orange-500/20 text-orange-400',
    };
    return colors[source] || 'bg-muted/50 text-muted-foreground';
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
            className="glass-card border-white/10 rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-white/5">
              <div className="flex items-center gap-3 flex-1">
                {/* Stage color indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: column.stageColor || '#FFFFFF' }}
                />
                <span className="font-semibold text-foreground">{column.title}</span>
                <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
                  {column.leads.length}
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-name') || 'Name'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-contact') || 'Contact'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-score') || 'Score'}</TableHead>
                        {showEstimatedValues && (
                          <TableHead className="text-muted-foreground">{t('funnel.page.table-value') || 'Value'}</TableHead>
                        )}
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-source') || 'Source'}</TableHead>
                        <TableHead className="text-muted-foreground">{t('funnel.page.table-priority') || 'Priority'}</TableHead>
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
                          className="border-white/5 hover:bg-white/5 cursor-pointer"
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
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {lead.company}
                                </p>
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

                          {/* Score */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-accent" />
                              <span className="text-sm font-medium text-accent">{lead.score}%</span>
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

                          {/* Source */}
                          <TableCell>
                            <Badge className={`text-xs ${getSourceColor(lead.source)}`}>
                              {lead.source}
                            </Badge>
                          </TableCell>

                          {/* Priority */}
                          <TableCell>
                            <Badge className={`text-xs capitalize ${getPriorityBadge(lead.priority)}`}>
                              {lead.priority}
                            </Badge>
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
                                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
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
                                  <User className="h-3 w-3 text-muted-foreground" />
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
                              <SelectTrigger className="h-8 w-[140px] text-xs bg-background border-white/10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10 z-50">
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
