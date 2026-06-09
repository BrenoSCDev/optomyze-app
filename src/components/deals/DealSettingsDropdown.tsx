/**
 * DEAL SETTINGS DROPDOWN
 * 
 * Non-modal dropdown for deal funnel visibility controls.
 * Mirrors FunnelSettingsDropdown but with deal-specific options.
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

interface DealSettingsDropdownProps {
  showProducts: boolean;
  showCharges: boolean;
  onShowProductsChange: (value: boolean) => void;
  onShowChargesChange: (value: boolean) => void;
}

const DealSettingsDropdown = ({
  showProducts,
  showCharges,
  onShowProductsChange,
  onShowChargesChange,
}: DealSettingsDropdownProps) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="deal-glass-card hover:bg-muted dark:hover:bg-deal/10 hover:text-foreground"
        >
          <Settings className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t('deal.page.settings')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="text-foreground">{t('deal.page.display-settings')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label 
              htmlFor="show-products" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              {t('deal.page.show-products')}
            </Label>
            <Switch
              id="show-products"
              checked={showProducts}
              onCheckedChange={onShowProductsChange}
            />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <Label 
              htmlFor="show-charges" 
              className="text-sm text-foreground cursor-pointer flex-1"
            >
              {t('deal.page.show-charges')}
            </Label>
            <Switch
              id="show-charges"
              checked={showCharges}
              onCheckedChange={onShowChargesChange}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DealSettingsDropdown;
