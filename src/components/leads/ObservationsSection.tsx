/**
 * OBSERVATIONS SECTION
 * 
 * Displays lead observations with CRUD functionality
 */

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  StickyNote, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  User,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Observation, observationService } from '@/services/observationApi';

interface ObservationsSectionProps {
  observations: Observation[];
  leadId: number;
  onObservationCreated: (observation: Observation) => void;
  onObservationUpdated: (observation: Observation) => void;
  onObservationDeleted: (observationId: number) => void;
}

const ObservationsSection: React.FC<ObservationsSectionProps> = ({
  observations,
  leadId,
  onObservationCreated,
  onObservationUpdated,
  onObservationDeleted
}) => {
  const { t } = useLanguage();
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sort observations by created_at descending (newest first)
  const sortedObservations = [...observations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleCreate = async () => {
    if (!newNote.trim()) {
      toast.error(t('observations.error-empty'));
      return;
    }

    setIsSubmitting(true);
    try {
      const observation = await observationService.createObservation(leadId, newNote.trim());
      onObservationCreated(observation);
      setNewNote('');
      toast.success(t('observations.created'));
    } catch (error) {
      console.error('Error creating observation:', error);
      toast.error(t('observations.error-create'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (observation: Observation) => {
    setEditingId(observation.id);
    setEditingNote(observation.note);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNote('');
  };

  const handleUpdate = async () => {
    if (!editingNote.trim() || !editingId) {
      toast.error(t('observations.error-empty'));
      return;
    }

    setIsUpdating(true);
    try {
      const observation = await observationService.updateObservation(editingId, editingNote.trim());
      onObservationUpdated(observation);
      setEditingId(null);
      setEditingNote('');
      toast.success(t('observations.updated'));
    } catch (error) {
      console.error('Error updating observation:', error);
      toast.error(t('observations.error-update'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await observationService.deleteObservation(deleteId);
      onObservationDeleted(deleteId);
      setDeleteId(null);
      toast.success(t('observations.deleted'));
    } catch (error) {
      console.error('Error deleting observation:', error);
      toast.error(t('observations.error-delete'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Observation */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Plus className="w-4 h-4 text-primary" />
          {t('observations.add-new')}
        </h4>
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('observations.placeholder')}
          className="min-h-[100px] resize-none border-border bg-background text-foreground placeholder:text-muted-foreground"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={isSubmitting || !newNote.trim()}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('observations.saving')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {t('observations.add')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Observations List */}
      {sortedObservations.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StickyNote className="w-6 h-6 text-primary/70" />
          </div>
          <p className="text-sm text-muted-foreground">{t('observations.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t('observations.list')} ({sortedObservations.length})
          </h4>
          
          {sortedObservations.map((observation) => (
            <div 
              key={observation.id}
              className="space-y-3 rounded-lg border border-border bg-muted/30 p-4"
            >
              {editingId === observation.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    className="min-h-[80px] resize-none border-border bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={isUpdating}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4" />
                      {t('common.cancel')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isUpdating || !editingNote.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {observation.note}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>{observation.user?.name || t('observations.unknown-user')}</span>
                      <span>•</span>
                      <span>{formatDate(observation.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(observation)}
                        className="h-7 w-7 p-0 hover:bg-muted"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(observation.id)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="border-border bg-background text-foreground z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {t('observations.delete-title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('observations.delete-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-border bg-background text-foreground hover:bg-muted"
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ObservationsSection;
