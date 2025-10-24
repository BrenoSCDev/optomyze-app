/**
 * LEAD CARD COMPONENT
 * 
 * Individual lead card with glassmorphism design for the Kanban board
 */

import { Lead } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Building, 
  Clock, 
  DollarSign,
  TrendingUp,
  GripVertical,
  Tag
} from 'lucide-react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
  isMoving?: boolean;
  onTagClick?: (lead: Lead) => void;
  onLeadClick?: (leadId: string) => void;
}

const LeadCard = ({ lead, isDragging, isMoving = false, onTagClick, onLeadClick }: LeadCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-orange-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Meta Ads': return 'bg-blue-500/20 text-blue-400';
      case 'Google Ads': return 'bg-green-500/20 text-green-400';
      case 'Organic': return 'bg-purple-500/20 text-purple-400';
      case 'Referral': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 cursor-pointer transition-all duration-300 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:scale-102'
      }`}
      whileHover={{ y: -2 }}
      layout
      {...attributes}
    >
      {/* Lead Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 transition-colors"
          {...listeners}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
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
        
        {/* Lead Score & Tag Icon */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-accent" />
            <span className="text-xs font-medium text-accent">{lead.score}%</span>
          </div>
          
          {/* Tag Management Button */}
          {onTagClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(lead);
              }}
              className="p-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 transition-all duration-200 group"
              title="Manage Tags"
            >
              <Tag className="w-3 h-3 text-gray-400 group-hover:text-purple-400" />
            </button>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email ? lead.email : "No email informed"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{lead.phone}</span>
        </div>
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-accent/20 text-accent border-accent/30"
            >
              {typeof tag === 'string' ? tag : tag.name}
            </Badge>
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

      {/* Bottom Section */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        {/* <div className="flex items-center gap-2">
          <DollarSign className="h-3 w-3 text-green-400" />
          <span className="text-xs font-medium text-green-400">
            {formatCurrency(lead.value)}
          </span>
        </div> */}
        
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs px-2 py-0.5 ${getSourceColor(lead.source)}`}
          >
            {lead.source}
          </Badge>
        </div>
        {/* Last Activity */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lead.lastActivity}</span>
        </div>
      </div>

    </motion.div>
  );
};

export default LeadCard;