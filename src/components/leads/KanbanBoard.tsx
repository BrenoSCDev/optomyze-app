/**
 * KANBAN BOARD COMPONENT
 * 
 * Main Kanban board layout with drag and drop functionality using react-beautiful-dnd
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import KanbanColumn from './KanbanColumn';
import { 
  Plus, 
  Filter, 
  Tag,
  UserPlus,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { timeAgo } from '@/lib/utils';
import { TagCreationDialog } from './TagCreationDialog';
import { LeadCreationDialog } from './LeadCreationDialog';
import { leadService } from '@/services/leadApi';
import { toast } from 'sonner';

interface KanbanBoardProps {
  funnel: any; // API funnel object
  availableTags: any[];
  onCreateLead: () => void;
  onCreateTag: () => void;
  onOpenFilters: () => void;
  onUpdateLeadStage?: (leadId: string, newStageId: string, oldStageId: string) => void;
  onLeadCreated?: () => void;
  onTagsClick?: (lead: any) => void;
}

const KanbanBoard = ({ funnel, availableTags, onCreateLead, onCreateTag, onOpenFilters, onUpdateLeadStage, onLeadCreated, onTagsClick }: KanbanBoardProps) => {
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  
  // Transform API data to kanban format
  const kanbanColumns = funnel.stages
    ?.sort((a: any, b: any) => a.order - b.order)
    .map((stage: any) => ({
      id: stage.id.toString(),
      title: stage.name,
      description: stage.description,
      type: stage.type,
      leads: stage.active_leads.map((lead: any) => ({
        id: lead.id.toString(),
        name: `${lead.first_name} ${lead.last_name}`,
        email: lead.email,
        phone: lead.phone,
        company: lead.custom_fields?.industry || 'N/A',
        title: lead.custom_fields?.title || 'Contact',
        score: parseFloat(lead.ai_score || '0'),
        value: parseFloat(lead.estimated_value || '0'),
        source: lead.source_platform || 'Direct',
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        lastActivity: lead.updated_at ? timeAgo(lead.updated_at) : 'No activity',
        priority: lead.priority || 'medium',
        stage: stage.id.toString(),
        avatar: lead.platform_data?.profile_picture,
        notes: lead.notes,
        createdAt: lead.created_at,
        assignedTo: lead.assigned_to,
        currency: lead.currency || 'USD',
        initialMessage: lead.initial_message,
        contactMethods: lead.contact_methods || [],
        preferredContact: lead.preferred_contact_method || 'email'
      }))
    })) || [];

  const [columns, setColumns] = useState(kanbanColumns);
  const handleAddLead = useCallback((columnId: string) => {
    setSelectedStageId(columnId);
    setLeadDialogOpen(true);
  }, []);

  // Calculate trend (mock data)
  const trendPercentage = Math.floor(Math.random() * 20) + 5;
  const isPositiveTrend = Math.random() > 0.3;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side */}
        <div className="space-y-2">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">
                  {funnel.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Title and Stats */}
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">{funnel.name}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/20 text-primary px-3 py-1"
              >
                {funnel.stages?.reduce((total: number, stage: any) => total + (stage.active_leads?.length || 0), 0) || 0} total leads
              </Badge>
              <div className={`flex items-center gap-1 text-sm ${
                isPositiveTrend ? 'text-green-400' : 'text-red-400'
              }`}>
                {isPositiveTrend ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span>{trendPercentage}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setTagDialogOpen(true)}
            className="glass-card border-accent/30 hover:bg-accent/10"
          >
            <Tag className="h-4 w-4 mr-2" />
            Create Tag
          </Button>
          
          <Button
            variant="outline"
            onClick={onOpenFilters}
            className="glass-card border-white/20 hover:bg-white/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button
            onClick={() => {
              setSelectedStageId('');
              setLeadDialogOpen(true);
            }}
            className="bg-gradient-primary hover:opacity-90 text-white font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <style>
      {`
        .kanban-board {
          max-width: 640px; /* Small screens (default) */
          overflow-x: auto;
        }

        @media (min-width: 768px) { /* Mid screens */
          .kanban-board {
            max-width: 768px;
          }
        }

        @media (min-width: 1024px) { /* Normal laptop */
          .kanban-board {
            max-width: 1024px;
          }
        }

        @media (min-width: 1280px) { /* Wide */
          .kanban-board {
            max-width: 1200px;
          }
        }

        @media (min-width: 1536px) { /* Ultra Wide */
          .kanban-board {
            max-width: 1600px;
          }
        }
      `}
      </style>

      <div
        className="flex gap-6 pb-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 kanban-board"
      >
        {columns.map((column, index) => (
          <KanbanColumn
            key={column.id}
            column={column}
            index={index}
            onAddLead={handleAddLead}
            onTagsClick={onTagsClick}
          />
        ))}
      </div>


      {/* Tag Creation Dialog */}
      <TagCreationDialog 
        open={tagDialogOpen} 
        onOpenChange={setTagDialogOpen} 
      />

      {/* Lead Creation Dialog */}
      <LeadCreationDialog
        isOpen={leadDialogOpen}
        onClose={() => {
          setLeadDialogOpen(false);
          setSelectedStageId('');
        }}
        funnelId={funnel.id?.toString() || ''}
        funnelData={{ funnel }}
        selectedStageId={selectedStageId}
        onLeadCreated={() => {
          setLeadDialogOpen(false);
          setSelectedStageId('');
          onLeadCreated?.();
        }}
      />
    </div>
  );
};

export default KanbanBoard;