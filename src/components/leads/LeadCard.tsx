/**
 * LEAD CARD COMPONENT
 * 
 * Individual lead card with glassmorphism design for the Kanban board
 */

import { Lead } from '@/types/leads';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Mail, 
  Phone, 
  Building, 
  Clock, 
  DollarSign,
  TrendingUp,
  GripVertical
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

const LeadCard = ({ lead, isDragging }: LeadCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lead.id,
  });

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
      className={`glass-card p-4 cursor-pointer transition-all duration-300 border-l-4 ${getPriorityColor(lead.priority)} ${
        isDragging || isSortableDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:scale-102'
      }`}
      whileHover={{ y: -2 }}
      layout
      {...attributes}
    >
      {/* Lead Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 transition-colors"
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {lead.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {lead.company} - {lead.title}
          </p>
        </div>
        
        {/* Lead Score */}
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-accent" />
          <span className="text-xs font-medium text-accent">{lead.score}%</span>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          <span>{lead.phone}</span>
        </div>
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lead.tags.slice(0, 2).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-accent/20 text-accent border-accent/30"
            >
              {tag}
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
      
      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{lead.lastActivity}</span>
      </div>
        
        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs px-2 py-0.5 ${getSourceColor(lead.source)}`}
          >
            {lead.source}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default LeadCard;