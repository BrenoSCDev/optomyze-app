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
        <h4 className="text-sm font-medium text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          {t('observations.add-new')}
        </h4>
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('observations.placeholder')}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[100px] resize-none"
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
                <Plus className="w-4 h-4 mr-2" />
                {t('observations.add')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Observations List */}
      {sortedObservations.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <StickyNote className="w-6 h-6 text-amber-500/60" />
          </div>
          <p className="text-gray-400 text-sm">{t('observations.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            {t('observations.list')} ({sortedObservations.length})
          </h4>
          
          {sortedObservations.map((observation) => (
            <div 
              key={observation.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3"
            >
              {editingId === observation.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <Textarea
                    value={editingNote}
                    onChange={(e) => setEditingNote(e.target.value)}
                    className="bg-white/5 border-white/10 text-white min-h-[80px] resize-none"
                    disabled={isUpdating}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4 mr-1" />
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
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {observation.note}
                  </p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      <span>{observation.user?.name || t('observations.unknown-user')}</span>
                      <span className="text-gray-600">•</span>
                      <span>{formatDate(observation.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(observation)}
                        className="h-7 w-7 p-0 hover:bg-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-white" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(observation.id)}
                        className="h-7 w-7 p-0 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
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
        <AlertDialogContent className="bg-gray-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {t('observations.delete-title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('observations.delete-description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
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
