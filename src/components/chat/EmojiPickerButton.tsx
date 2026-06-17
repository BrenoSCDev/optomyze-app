import { useState } from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EmojiPickerButtonProps {
  /** Called with the selected emoji character (e.g. "😀"). */
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/**
 * Toolbar button that opens an emoji picker popover. Shared by the Lead
 * Conversation / Global Inbox composer and the Teams Chat message input.
 */
const EmojiPickerButton = ({ onEmojiSelect, disabled, label, className }: EmojiPickerButtonProps) => {
  const [open, setOpen] = useState(false);
  const { mode } = useTheme();
  const { t } = useLanguage();
  const resolvedLabel = label ?? t('chat.composer.insert-emoji');

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-label={resolvedLabel}
              className={cn(
                "h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                className
              )}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{resolvedLabel}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none" align="start">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={mode === 'dark' ? Theme.DARK : Theme.LIGHT}
          autoFocusSearch={false}
          previewConfig={{ showPreview: false }}
          width={320}
          height={360}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPickerButton;
