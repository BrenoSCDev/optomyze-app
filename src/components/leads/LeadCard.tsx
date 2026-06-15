/**
 * LEAD CARD COMPONENT
 * 
 * Individual lead card with glassmorphism design for the Kanban board
 */

import { Lead } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  Clock,
  GripVertical,
  Tag,
  MoreVertical,
  UserCheck,
  GitBranch,
  Trash2
} from 'lucide-react';
import {
  useDraggable,
} from '@dnd-kit/core';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import UserAvatar from '@/components/ui/user-avatar';
import ClickableUser from '@/components/users/ClickableUser';
import SourcePlatformIcon from './SourcePlatformIcon';
import TagBadge from '@/components/tags/TagBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  isMoving?: boolean;
  onTagClick?: (lead: Lead) => void;
  onLeadClick?: (leadId: string) => void;
  onDeleteLead?: (lead: Lead) => void;
  onAssignUser?: (lead: Lead) => void;
  onMoveFunnel?: (lead: Lead) => void;
  showEstimatedValue?: boolean;
  showAssignedUser?: boolean;
}

const LeadCard = ({ lead, isDragging, isMoving = false, onTagClick, onLeadClick, onDeleteLead, onAssignUser, onMoveFunnel, showEstimatedValue = true, showAssignedUser = true }: LeadCardProps) => {
  const { t } = useLanguage();
  const { currencyCode: companyCurrency } = useCurrency();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({ id: lead.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatCurrency = (amount: number, currency: string = companyCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Always use the company's configured currency
  const leadCurrency = companyCurrency;

  return (
    <div className="relative">
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`glass-card p-4 cursor-pointer transition-all duration-300 border-l-4 relative ${getPriorityColor(lead.priority)} ${
          isDragging ? 'opacity-20 scale-95' : 'hover:scale-102'
        } ${isMoving ? 'opacity-60' : ''}`}
        whileHover={{ y: isDragging ? 0 : -2 }}
        layout
      >
        {/* Lead Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
            <UserAvatar
              name={lead.name}
              profilePicPath={lead.avatar}
              className="w-10 h-10 text-sm font-medium"
            />
          </div>

          <div className="flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeadClick?.(lead.id);
              }}
              className="font-semibold text-foreground text-sm truncate hover:text-primary transition-colors cursor-pointer text-left w-full"
            >
              {lead.name}
            </button>
          </div>

          {/* More Actions Menu */}
          {(onTagClick || onAssignUser || onMoveFunnel || onDeleteLead) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all duration-200 group"
                  title={t('lead-card.more-actions')}
                >
                  <MoreVertical className="w-3 h-3 text-gray-400 group-hover:text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border-border z-[80]">
                {onTagClick && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onTagClick(lead); }}
                    className="cursor-pointer"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    {t('lead-card.manage-tags')}
                  </DropdownMenuItem>
                )}
                {onAssignUser && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onAssignUser(lead); }}
                    className="cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    {t('lead-details.assign-user')}
                  </DropdownMenuItem>
                )}
                {onMoveFunnel && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onMoveFunnel(lead); }}
                    className="cursor-pointer"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    {t('lead-card.move-funnel')}
                  </DropdownMenuItem>
                )}
                {onDeleteLead && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDeleteLead(lead); }}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('lead-details.delete-lead')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email ? lead.email : "No email informed"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{lead.phone || t('lead-details.no-phone-informed')}</span>
        </div>
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <TagBadge key={index} tag={tag} />
          ))}
          {lead.tags.length > 2 && (
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground"
            >
              +{lead.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Lead Estimated Value */}
      {showEstimatedValue && lead.value > 0 && (
        <div className="mt-2">
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs font-medium">
            {t('funnel.page.estimated')}: {formatCurrency(lead.value, leadCurrency)}
          </Badge>
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
      
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lead.lastActivity}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <SourcePlatformIcon source={lead.source} />
        </div>
      </div>

      {/* Assigned User */}
      {showAssignedUser && (lead as any).assigned_user && (
        <ClickableUser
          userId={(lead as any).assigned_user.id}
          className="flex items-center gap-2 pt-2 mt-2 border-t border-white/10 w-full"
        >
          <UserAvatar
            name={(lead as any).assigned_user.name}
            profilePicPath={(lead as any).assigned_user.profile_pic}
            className="w-5 h-5 text-[9px]"
          />
          <span className="text-xs text-muted-foreground">
            {(lead as any).assigned_user.name}
          </span>
        </ClickableUser>
      )}
      </motion.div>
      
      {/* Loading Overlay for Moving State */}
      {isMoving && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-background/80 rounded-lg border border-border">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-xs font-medium text-foreground">Moving...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LeadCard;