/**
 * DEAL CARD COMPONENT
 * 
 * Rich deal card for the Deal Kanban board.
 * Displays deal name, lead info, financial breakdown, items, charges, discounts, and more.
 */

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  GripVertical,
  DollarSign,
  User,
  Clock,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  TrendingDown,
  Receipt,
  Package,
  CircleDot,
  GitBranch,
} from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useLanguage } from '@/contexts/LanguageContext';

interface DealCardProps {
  deal: any;
  isDragging?: boolean;
  onDealClick?: (dealId: string) => void;
}

const DealCard = ({ deal, isDragging, onDealClick }: DealCardProps) => {
  const { t } = useLanguage();
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

  const currency = deal.currency || 'USD';
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
        className={`glass-card p-4 cursor-pointer transition-all duration-300 border-l-4 border-l-primary/50 relative ${
          isDragging ? 'opacity-20 scale-95' : 'hover:scale-102'
        }`}
        whileHover={{ y: isDragging ? 0 : -2 }}
        layout
      >
        {/* Deal Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                {getInitials(deal.name || leadName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDealClick?.(deal.id);
              }}
              className="font-semibold text-foreground text-sm truncate hover:text-primary transition-colors cursor-pointer text-left w-full"
            >
              {deal.name}
            </button>
            <p className="text-xs text-muted-foreground truncate">
              {leadName}
            </p>
          </div>

          {/* Final Total - prominent */}
          {finalTotal > 0 && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-semibold shrink-0">
              {formatCurrency(finalTotal, currency)}
            </Badge>
          )}
        </div>

        {/* Lead Contact Info */}
        {deal.lead && (
          <div className="space-y-1 mb-3">
            {deal.lead.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{deal.lead.email}</span>
              </div>
            )}
            {deal.lead.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{deal.lead.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Lead Funnel & Stage badges */}
        {deal.lead && (deal.lead.funnel || deal.lead.stage) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {deal.lead.funnel && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground flex items-center gap-1">
                <GitBranch className="w-2.5 h-2.5" />
                {deal.lead.funnel.name}
              </Badge>
            )}
            {deal.lead.stage && (
              <Badge
                className="text-xs px-2 py-0.5 border flex items-center gap-1"
                style={{
                  backgroundColor: `${deal.lead.stage.color}20`,
                  color: deal.lead.stage.color,
                  borderColor: `${deal.lead.stage.color}50`,
                }}
              >
                <CircleDot className="w-2.5 h-2.5" />
                {deal.lead.stage.name}
              </Badge>
            )}
          </div>
        )}

        {/* Items list */}
        {deal.items && deal.items.length > 0 && (
          <div className="mb-3 p-2.5 rounded-md bg-white/5 border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <Package className="h-3 w-3" />
              <span className="font-medium">{deal.items.length} item{deal.items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-1">
              {deal.items.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id || i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate max-w-[140px]">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(parseFloat(item.total_price || '0'), currency)}
                  </span>
                </div>
              ))}
              {deal.items.length > 3 && (
                <span className="text-xs text-muted-foreground">+{deal.items.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        {(chargesTotal > 0 || discountTotal > 0) && (
          <div className="mb-3 p-2.5 rounded-md bg-white/5 border border-white/5 space-y-1">
            {subtotal > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatCurrency(subtotal, currency)}</span>
              </div>
            )}
            {chargesTotal > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-2.5 w-2.5 text-green-400" />
                  Charges
                </span>
                <span className="text-green-400">+{formatCurrency(chargesTotal, currency)}</span>
              </div>
            )}
            {discountTotal > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TrendingDown className="h-2.5 w-2.5 text-red-400" />
                  Discounts
                </span>
                <span className="text-red-400">-{formatCurrency(discountTotal, currency)}</span>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {deal.notes && (
          <div className="flex items-start gap-1.5 mb-3 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{deal.notes}</span>
          </div>
        )}

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : '—'}</span>
          </div>

          {deal.user && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{deal.user.name}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DealCard;
