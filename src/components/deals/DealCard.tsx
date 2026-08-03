/**
 * DEAL CARD COMPONENT
 * 
 * Rich deal card with teal accent and dense layout.
 * Visually distinct from lead cards in sales funnels.
 */

import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatPhoneNumber } from '@/lib/phone';
import { 
  GripVertical,
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
import UserAvatar from '@/components/ui/user-avatar';
import ClickableUser from '@/components/users/ClickableUser';
import TagBadge from '@/components/tags/TagBadge';

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
  } = useDraggable({ id: deal.id });

  /*
   * No transform here on purpose — the board renders a DragOverlay copy that
   * follows the cursor. Translating this element too would drag the original
   * along underneath it, showing two cards at once.
   */

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(n => n.length > 0);
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

  const leadName = deal.lead
    ? `${deal.lead.first_name} ${deal.lead.last_name || ''}`.trim()
    : 'No lead';

  // Always display in company currency for consistency
  const currency = companyCurrency;
  const chargesTotal = deal.charges_total || 0;
  const discountTotal = parseFloat(deal.discount_total || '0');
  const subtotal = parseFloat(deal.subtotal || '0');
  const finalTotal = deal.final_total || 0;

  return (
    <div className="relative">
      {/* Plain div, not motion.div — see LeadCard for the reasoning. */}
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm p-3 cursor-grab active:cursor-grabbing transition-colors duration-base ease-standard relative border-t-2 border-t-deal touch-none ${
          isDragging ? 'invisible' : ''
        }`}
      >
        {/* Deal Header - Compact row */}
        <div className="flex items-center gap-2.5 mb-2">
          {/* Visual affordance only — the whole card is draggable. */}
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors" />
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
                {formatPhoneNumber(deal.lead.phone)}
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

        {/* Deal Tags - below funnel & stage badges */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="flex items-center gap-1 mb-2 pl-[42px] flex-wrap">
            {deal.tags.slice(0, 3).map((tag: any, i: number) => (
              <TagBadge key={i} tag={tag} className="text-[9px] px-1.5 py-0.5" />
            ))}
            {deal.tags.length > 3 && (
              <span className="text-[9px] text-muted-foreground">+{deal.tags.length - 3}</span>
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
                  <TrendingUp className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                  Charges
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(chargesTotal, currency)}</span>
              </div>
            )}
            {discountTotal > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <TrendingDown className="h-2.5 w-2.5 text-rose-600 dark:text-rose-400" />
                  Discounts
                </span>
                <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(discountTotal, currency)}</span>
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
            {/* Tag button */}
            {onTagClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(deal);
                }}
                className="p-1 rounded-md bg-surface-2 hover:bg-deal/20 border border-border hover:border-deal/50 transition-colors duration-fast ease-standard group"
                title="Manage tags"
              >
                <Tag className="h-2.5 w-2.5 text-muted-foreground group-hover:text-deal transition-colors" />
              </button>
            )}

            {deal.user && (
              <ClickableUser userId={deal.user.id} className="gap-1">
                <UserAvatar
                  name={deal.user.name}
                  profilePicPath={deal.user.profile_pic}
                  className="w-4 h-4 text-[8px]"
                />
                <span className="text-[10px] text-muted-foreground">{deal.user.name}</span>
              </ClickableUser>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Memoised: see LeadCard — a board-level state change (opening any
 *  modal) must not re-render every card before the modal paints. */
export default memo(DealCard);
