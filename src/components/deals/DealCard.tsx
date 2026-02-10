/**
 * DEAL CARD COMPONENT
 * 
 * Individual deal card for the Deal Kanban board.
 * Displays deal-specific data: name, lead info, total value, user.
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
        </div>

        {/* Deal Value */}
        {deal.final_total > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <DollarSign className="h-3 w-3 text-green-400" />
            <span className="text-sm font-semibold text-green-400">
              {formatCurrency(deal.final_total, deal.currency || 'USD')}
            </span>
          </div>
        )}

        {/* Items count */}
        {deal.items && deal.items.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>{deal.items.length} item{deal.items.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Lead info badges */}
        {deal.lead && (
          <div className="flex flex-wrap gap-1 mb-3">
            {deal.lead.funnel && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground">
                {deal.lead.funnel.name}
              </Badge>
            )}
            {deal.lead.stage && (
              <Badge
                className="text-xs px-2 py-0.5 border"
                style={{
                  backgroundColor: `${deal.lead.stage.color}20`,
                  color: deal.lead.stage.color,
                  borderColor: `${deal.lead.stage.color}50`,
                }}
              >
                {deal.lead.stage.name}
              </Badge>
            )}
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
