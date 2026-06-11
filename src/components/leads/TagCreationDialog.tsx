import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { tagService } from "@/services/tagApi";
import { Tags } from "lucide-react";

interface TagCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated?: (newTag: any) => void;
}

export const TagCreationDialog = ({ open, onOpenChange, onTagCreated }: TagCreationDialogProps) => {
  const [tagName, setTagName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.company_id) {
      toast({
        title: "Error",
        description: "Company information not found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const newTag = await tagService.createTag(tagName.trim(), user.company_id);
      
      toast({
        title: "Tag created",
        description: `Tag "${tagName}" has been created successfully.`,
      });
      
      // Notify parent component about new tag
      if (onTagCreated && newTag) {
        onTagCreated(newTag);
      }
      
      setTagName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Error creating tag",
        description: "Failed to create the tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreateTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-modal sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Create New Tag
          </DialogTitle>
          <DialogDescription>
            Create a new tag to organize and categorize your leads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tagName">
              Tag Name
            </Label>
            <Input
              id="tagName"
              placeholder="e.g., hot-leads, follow-up, qualified"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTag}
            disabled={isLoading || !tagName.trim()}
            className="bg-gradient-primary hover:opacity-90 text-white"
          >
            {isLoading ? "Creating..." : "Create Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};