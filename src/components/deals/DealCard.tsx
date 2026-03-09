/**
 * DEAL CARD COMPONENT
 * 
 * Rich deal card with teal accent and dense layout.
 * Visually distinct from lead cards in sales funnels.
 */

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  GripVertical,
  User,
  Clock,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  Package,
  CircleDot,
  GitBranch,
  Tag,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';

interface DealCardProps {
  deal: any;
  isDragging?: boolean;
  onDealClick?: (dealId: string) => void;
  onTagClick?: (deal: any) => void;
  showProducts?: boolean;
  showCharges?: boolean;
}

const DealCard = ({ deal, isDragging, onDealClick, onTagClick, showProducts = true, showCharges = true }: DealCardProps) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({ id: deal.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const leadName = deal.lead
    ? `${deal.lead.first_name} ${deal.lead.last_name || ''}`.trim()
    : 'No lead';

  const currency = deal.currency || companyCurrency;
  const chargesTotal = deal.charges_total || 0;
  const discountTotal = parseFloat(deal.discount_total || '0');
  const subtotal = parseFloat(deal.subtotal || '0');
  const finalTotal = deal.final_total || 0;

  return (
    <div className="relative">
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`deal-glass-card p-3 cursor-pointer transition-all duration-300 relative border-t-2 border-t-deal ${
          isDragging ? 'opacity-20 scale-95' : ''
        }`}
        whileHover={{ y: isDragging ? 0 : -2 }}
        layout
      >
        {/* Deal Header - Compact row */}
        <div className="flex items-center gap-2.5 mb-2">
          <div {...listeners} className="cursor-grab active:cursor-grabbing shrink-0">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground hover:text-deal transition-colors" />
          </div>
          <Avatar className="h-8 w-8 shrink-0 rounded-full">
            <AvatarFallback className="bg-deal/20 text-deal text-xs font-semibold rounded-full">
              {getInitials(deal.name || leadName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDealClick?.(deal.id);
              }}
              className="font-semibold text-foreground text-sm truncate hover:text-deal transition-colors cursor-pointer text-left w-full block"
            >
              {deal.name}
            </button>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">
              {leadName}
            </p>
          </div>

          {/* Final Total Badge */}
          {finalTotal > 0 && (
            <Badge className="bg-deal/15 text-deal border-deal/30 text-xs font-semibold shrink-0 px-2 py-0.5">
              {formatCurrency(finalTotal, currency)}
            </Badge>
          )}
        </div>

        {/* Lead Contact - Inline compact */}
        {deal.lead && (deal.lead.email || deal.lead.phone) && (
          <div className="flex items-center gap-3 mb-2 text-[11px] text-muted-foreground pl-[42px]">
            {deal.lead.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-2.5 w-2.5 shrink-0 text-deal/60" />
                <span className="truncate">{deal.lead.email}</span>
              </span>
            )}
            {deal.lead.phone && (
              <span className="flex items-center gap-1 shrink-0">
                <Phone className="h-2.5 w-2.5 text-deal/60" />
                {deal.lead.phone}
              </span>
            )}
          </div>
        )}

        {/* Lead Funnel & Stage - Horizontal chips */}
        {deal.lead && (deal.lead.funnel || deal.lead.stage) && (
          <div className="flex items-center gap-1.5 mb-2 pl-[42px]">
            {deal.lead.funnel && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-deal/10 text-deal/80 border-deal/20 flex items-center gap-0.5">
                <GitBranch className="w-2.5 h-2.5" />
                {deal.lead.funnel.name}
              </Badge>
            )}
            {deal.lead.stage && (
              <Badge
                className="text-[10px] px-1.5 py-0 h-5 border flex items-center gap-0.5"
                style={{
                  backgroundColor: `${deal.lead.stage.color}15`,
                  color: deal.lead.stage.color,
                  borderColor: `${deal.lead.stage.color}40`,
                }}
              >
                <CircleDot className="w-2.5 h-2.5" />
                {deal.lead.stage.name}
              </Badge>
            )}
          </div>
        )}

        {/* Items - Horizontal compact list */}
        {showProducts && deal.items && deal.items.length > 0 && (
          <div className="mb-2 p-2 rounded-lg bg-deal/5 border border-deal/10">
            <div className="flex items-center gap-1 text-[10px] text-deal/70 mb-1">
              <Package className="h-2.5 w-2.5" />
              <span className="font-medium uppercase tracking-wider">{deal.items.length} item{deal.items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-0.5">
              {deal.items.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate max-w-[130px]">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(parseFloat(item.total_price || '0'), currency)}
                  </span>
                </div>
              ))}
              {deal.items.length > 3 && (
                <span className="text-[10px] text-muted-foreground">+{deal.items.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Financial Breakdown - Compact */}
        {showCharges && (chargesTotal > 0 || discountTotal > 0) && (
          <div className="mb-2 p-2 rounded-lg bg-deal/5 border border-deal/10 space-y-0.5">
            {subtotal > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(subtotal, currency)}</span>
              </div>
            )}
            {chargesTotal > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />
                  Charges
                </span>
                <span className="text-emerald-400">+{formatCurrency(chargesTotal, currency)}</span>
              </div>
            )}
            {discountTotal > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <TrendingDown className="h-2.5 w-2.5 text-rose-400" />
                  Discounts
                </span>
                <span className="text-rose-400">-{formatCurrency(discountTotal, currency)}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes - Single line */}
        {deal.notes && (
          <div className="flex items-center gap-1 mb-2 text-[11px] text-muted-foreground pl-[42px]">
            <FileText className="h-2.5 w-2.5 shrink-0 text-deal/60" />
            <span className="truncate">{deal.notes}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1.5 border-t border-deal/10 mt-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '—'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tags display */}
            {deal.tags && deal.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {deal.tags.slice(0, 2).map((tag: any, i: number) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-deal/15 text-deal border border-deal/20">
                    {typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
                {deal.tags.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{deal.tags.length - 2}</span>
                )}
              </div>
            )}

            {/* Tag button */}
            {onTagClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(deal);
                }}
                className="p-1 rounded-md bg-white/5 hover:bg-deal/20 border border-white/10 hover:border-deal/50 transition-all duration-200 group"
                title="Manage tags"
              >
                <Tag className="h-2.5 w-2.5 text-muted-foreground group-hover:text-deal transition-colors" />
              </button>
            )}

            {deal.user && (
              <div className="flex items-center gap-1">
                <User className="h-2.5 w-2.5 text-deal/60" />
                <span className="text-[10px] text-muted-foreground">{deal.user.name}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DealCard;
