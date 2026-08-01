/**
 * FUNNEL SETTINGS DROPDOWN
 * 
 * Non-modal dropdown for funnel visibility controls
 */

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface FunnelSettingsDropdownProps {
  showEstimatedValues: boolean;
  showAssignedUser: boolean;
  onShowEstimatedValuesChange: (value: boolean) => void;
  onShowAssignedUserChange: (value: boolean) => void;
}

const FunnelSettingsDropdown = ({
  showEstimatedValues,
  showAssignedUser,
  onShowEstimatedValuesChange,
  onShowAssignedUserChange,
}: FunnelSettingsDropdownProps) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="glass-card hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('funnel.page.settings')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-foreground">{t('funnel.page.display-settings')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-4">
          {/* Show Estimated Values Toggle */}
          <div className="flex items-center justify-between gap-4">
            <Label 
              htmlFor="show-kpis" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              {t('funnel.page.show-estimated-values')}
            </Label>
            <Switch
              id="show-kpis"
              checked={showEstimatedValues}
              onCheckedChange={onShowEstimatedValuesChange}
            />
          </div>
          
          {/* Show Assigned User Toggle */}
          <div className="flex items-center justify-between gap-4">
            <Label 
              htmlFor="show-assigned-user" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              {t('funnel.page.show-assigned-user')}
            </Label>
            <Switch
              id="show-assigned-user"
              checked={showAssignedUser}
              onCheckedChange={onShowAssignedUserChange}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FunnelSettingsDropdown;
