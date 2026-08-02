/**
 * TAGS DASHBOARD COMPONENT
 *
 * Settings page for managing company tags with card grid layout and tag creation
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Tag,
  Trash2,
  Pencil,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TagScopeSelector, { TAG_SCOPES, TagScope, tagScopeLabelKey } from '@/components/tags/TagScopeSelector';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { tagService } from '@/services/tagApi';
import { toast } from 'sonner';
import TagColorPicker from '@/components/tags/TagColorPicker';
import EmojiPickerButton from '@/components/chat/EmojiPickerButton';
import { DEFAULT_TAG_COLOR } from '@/lib/tagColors';

interface TagData {
  id: number;
  company_id: number;
  name: string;
  color: string;
  /** Which entities this tag may be attached to. Null means "everywhere". */
  scopes: TagScope[] | null;
  /** Present only when the list was requested with_counts. */
  leads_count?: number;
  sales_count?: number;
  tasks_count?: number;
  created_at: string;
  updated_at: string;
}

// Skeleton placeholder shown while tags are loading. Defined at module scope so it
// keeps a stable component identity across TagsDashboard re-renders (a component
// re-declared inside another component's body is a *new type* on every render,
// which forces React to unmount/remount every instance instead of reusing it).
const SkeletonCard = () => (
  <div className="glass-card p-6 rounded-lg">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  </div>
);

// Empty state shown when the company has no tags yet. Defined at module scope for
// the same stable-identity reason as SkeletonCard above.
const EmptyState = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="p-3 rounded-lg bg-muted/20 w-fit mx-auto mb-4">
        <Tag className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t('tags.no-tags')}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t('tags.no-tags-description')}
      </p>
      <Button
        className="neon-border"
        onClick={onCreateNew}
      >
        <Plus className="h-4 w-4" />
        {t('tags.create-first')}
      </Button>
    </motion.div>
  );
};

interface TagCardProps {
  tag: TagData;
  isDeleting: boolean;
  onEdit: (tag: TagData) => void;
  onDelete: (tagId: number) => void;
}

// A single tag card. Defined at module scope (not inside TagsDashboard) and wrapped
// in React.memo so it only re-renders when its own tag data or delete state actually
// changes - typing in a dialog or toggling unrelated state in the parent no longer
// causes every card in the grid to unmount/remount and replay its enter animation.
const TagCard = memo(({ tag, isDeleting, onEdit, onDelete }: TagCardProps) => {
  const { t } = useLanguage();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card p-6 rounded-lg group transition-colors duration-fast ease-standard neon-border"
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Tag Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="p-3 rounded-lg transition-colors"
            style={{
              backgroundColor: `${tag.color || DEFAULT_TAG_COLOR}26`,
              color: tag.color || DEFAULT_TAG_COLOR,
            }}
          >
            <Tag className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 truncate">
              {tag.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('tags.created')} {new Date(tag.created_at).toLocaleDateString()}
            </p>

            {/* Where this tag is offered, and how often it is actually used.
                A null `scopes` predates scoping and meant "everywhere". */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {(tag.scopes?.length ? tag.scopes : TAG_SCOPES).map(scope => {
                const count = scope === 'lead' ? tag.leads_count
                  : scope === 'deal' ? tag.sales_count
                  : tag.tasks_count;

                return (
                  <span
                    key={scope}
                    className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {t(tagScopeLabelKey(scope))}
                    {typeof count === 'number' && count > 0 && (
                      <span className="tabular-nums text-foreground">{count}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => onEdit(tag)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">{t('tags.delete')}</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {t('tags.delete-confirm')} '{tag.name}'? {t('tags.delete-warning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-muted/20 border-muted/30 hover:bg-muted/30">
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(tag.id)}
                  className="bg-red-500 text-white hover:bg-red-600 border-red-500"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
});
TagCard.displayName = 'TagCard';

interface TagsDashboardProps {
  /** Rendered inside the CRM Panel, which supplies its own heading. */
  embedded?: boolean;
}

const TagsDashboard = ({ embedded = false }: TagsDashboardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const newTagNameRef = useRef<HTMLInputElement>(null);
  const editTagNameRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<{ name: string; color: string; scopes: TagScope[] }>({
    name: '',
    color: DEFAULT_TAG_COLOR,
    // New tags apply everywhere until narrowed — the least surprising default.
    scopes: [...TAG_SCOPES],
  });
  const [formErrors, setFormErrors] = useState({
    name: ''
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<{ name: string; color: string; scopes: TagScope[] }>({
    name: '',
    color: DEFAULT_TAG_COLOR,
    scopes: [...TAG_SCOPES],
  });
  const [editFormErrors, setEditFormErrors] = useState({
    name: ''
  });

  // Fetch tags from API - memoized to prevent unnecessary re-renders
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tagService.getAllTags({ withCounts: true });
      setTags(response.data || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast.error(t('tags.fetch-error'), {
        description: t('tags.fetch-error-description')
      });
    } finally {
      setLoading(false);
    }
  }, [t]); // Only re-create if translation function changes

  // Only fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Create new tag - memoized to prevent unnecessary re-renders
  const createTag = useCallback(async () => {
    if (!formData.name.trim()) {
      setFormErrors({ name: t('tags.name-required') });
      return;
    }

    if (!user?.company_id) {
      toast.error(t('common.error'), {
        description: t('tags.company-error')
      });
      return;
    }

    setCreating(true);
    try {
      const response = await tagService.createTag(formData.name.trim(), user.company_id, formData.color, formData.scopes);

      // Extract the new tag from the API response
      const newTag = response.data || response;

      // Optimistic update - add the new tag to the state
      setTags(prev => [...prev, newTag]);

      setFormData({ name: '', color: DEFAULT_TAG_COLOR, scopes: [...TAG_SCOPES] });
      setFormErrors({ name: '' });
      setShowNewTagModal(false);

      toast.success(t('tags.created'), {
        description: `${t('tags.tag')} "${formData.name}" ${t('tags.created-successfully')}`
      });
    } catch (error: any) {
      console.error('Error creating tag:', error);

      // Handle validation errors
      if (error.response?.status === 422) {
        const serverErrors = error.response.data?.errors || {};
        setFormErrors({
          name: serverErrors.name?.[0] || ''
        });
        return;
      }

      // Network or server errors
      const isNetworkError = !error.response;
      toast.error(t('common.error'), {
        description: isNetworkError
          ? t('tags.network-error')
          : t('tags.server-error')
      });
    } finally {
      setCreating(false);
    }
  }, [formData.name, formData.color, user?.company_id, t]); // Dependencies for createTag

  // Update tag - memoized to prevent unnecessary re-renders
  const updateTag = useCallback(async () => {
    if (!editingTag) return;

    if (!editFormData.name.trim()) {
      setEditFormErrors({ name: t('tags.name-required') });
      return;
    }

    setUpdating(true);
    try {
      const response = await tagService.updateTag(editingTag.id, {
        name: editFormData.name.trim(),
        color: editFormData.color,
        scopes: editFormData.scopes,
      });

      const updatedTag = response.data || response;

      setTags(prev => prev.map(tag => (tag.id === editingTag.id ? { ...tag, ...updatedTag } : tag)));

      setEditingTag(null);
      setEditFormErrors({ name: '' });

      toast.success(t('tags.updated-successfully'));
    } catch (error: any) {
      console.error('Error updating tag:', error);

      if (error.response?.status === 422) {
        const serverErrors = error.response.data?.errors || {};
        setEditFormErrors({
          name: serverErrors.name?.[0] || ''
        });
        return;
      }

      toast.error(t('common.error'), {
        description: t('tags.update-error')
      });
    } finally {
      setUpdating(false);
    }
  }, [editingTag, editFormData, t]); // Dependencies for updateTag

  // Delete tag - memoized to prevent unnecessary re-renders
  const deleteTag = useCallback(async (tagId: number) => {
    try {
      setDeletingTagId(tagId);
      await tagService.deleteTag(tagId);

      // Optimistic update
      setTags(prev => prev.filter(tag => tag.id !== tagId));

      toast.success(t('common.success'), {
        description: t('tags.deleted-successfully')
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error(t('common.error'), {
        description: t('tags.delete-error')
      });
    } finally {
      setDeletingTagId(null);
    }
  }, [t]); // Dependencies for deleteTag

  // Open the edit modal for a tag, pre-filling the form
  const openEditTag = useCallback((tag: TagData) => {
    setEditingTag(tag);
    setEditFormData({
      name: tag.name,
      color: tag.color || DEFAULT_TAG_COLOR,
      // A null `scopes` is a pre-scoping tag, which meant "usable everywhere".
      scopes: tag.scopes?.length ? tag.scopes : [...TAG_SCOPES],
    });
    setEditFormErrors({ name: '' });
  }, []);

  // Insert an emoji at the cursor position of a text input
  const insertEmojiAtCursor = (
    inputRef: React.RefObject<HTMLInputElement>,
    value: string,
    setValue: (value: string) => void,
    emoji: string
  ) => {
    const input = inputRef.current;
    if (!input) {
      setValue(value + emoji);
      return;
    }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setValue(newValue);
    requestAnimationFrame(() => {
      input.focus();
      const pos = start + emoji.length;
      input.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-8'}>
      {/* Header. The title and breadcrumb are dropped when embedded — the CRM
          Panel already labels this section — but the create action stays. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {!embedded && (
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 futuristic-text break-words">
              {t('tags.title')}
            </h1>
            <nav className="text-sm text-muted-foreground">
              {t('tags.breadcrumb')}
            </nav>
          </div>
        )}

        <Dialog open={showNewTagModal} onOpenChange={setShowNewTagModal}>
          <DialogTrigger asChild>
            <Button className="neon-border w-full sm:w-auto shrink-0" size="lg">
              <Plus className="h-4 w-4" />
              {t('tags.new-tag')}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground futuristic-text">{t('tags.create-new')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="tag-name" className="text-foreground">
                  {t('tags.name')} *
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tag-name"
                    ref={newTagNameRef}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder={t('tags.name-placeholder')}
                    className={`glass-card border-muted/30 ${formErrors.name ? 'border-red-500' : ''}`}
                    disabled={creating}
                  />
                  <EmojiPickerButton
                    onEmojiSelect={(emoji) =>
                      insertEmojiAtCursor(newTagNameRef, formData.name, (v) => setFormData(prev => ({ ...prev, name: v })), emoji)
                    }
                    disabled={creating}
                  />
                </div>
                {formErrors.name && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {formErrors.name}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">{t('tags.color')}</Label>
                <TagColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('tags.used-for')}</Label>
                <TagScopeSelector
                  value={formData.scopes}
                  onChange={(scopes) => setFormData(prev => ({ ...prev, scopes }))}
                  disabled={creating}
                />
                <p className="text-xs text-muted-foreground">{t('tags.used-for-hint')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewTagModal(false);
                  setFormData({ name: '', color: DEFAULT_TAG_COLOR, scopes: [...TAG_SCOPES] });
                  setFormErrors({ name: '' });
                }}
                disabled={creating}
                className="flex-1 glass-card border-muted/30 hover:bg-muted/20"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={createTag}
                disabled={creating || !formData.name.trim()}
                className="flex-1 neon-border"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    {t('common.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t('common.create')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState onCreateNew={() => setShowNewTagModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {tags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                isDeleting={deletingTagId === tag.id}
                onEdit={openEditTag}
                onDelete={deleteTag}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Tag Modal */}
      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground futuristic-text">{t('tags.edit-tag')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="edit-tag-name" className="text-foreground">
                {t('tags.name')} *
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-tag-name"
                  ref={editTagNameRef}
                  value={editFormData.name}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, name: e.target.value }));
                    if (editFormErrors.name) setEditFormErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder={t('tags.name-placeholder')}
                  className={`glass-card border-muted/30 ${editFormErrors.name ? 'border-red-500' : ''}`}
                  disabled={updating}
                />
                <EmojiPickerButton
                  onEmojiSelect={(emoji) =>
                    insertEmojiAtCursor(editTagNameRef, editFormData.name, (v) => setEditFormData(prev => ({ ...prev, name: v })), emoji)
                  }
                  disabled={updating}
                />
              </div>
              {editFormErrors.name && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {editFormErrors.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t('tags.color')}</Label>
              <TagColorPicker
                value={editFormData.color}
                onChange={(color) => setEditFormData(prev => ({ ...prev, color }))}
                disabled={updating}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">{t('tags.used-for')}</Label>
              <TagScopeSelector
                value={editFormData.scopes}
                onChange={(scopes) => setEditFormData(prev => ({ ...prev, scopes }))}
                disabled={updating}
              />
              <p className="text-xs text-muted-foreground">{t('tags.used-for-hint')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingTag(null)}
              disabled={updating}
              className="flex-1 glass-card border-muted/30 hover:bg-muted/20"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={updateTag}
              disabled={updating || !editFormData.name.trim()}
              className="flex-1 neon-border"
            >
              {updating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagsDashboard;
