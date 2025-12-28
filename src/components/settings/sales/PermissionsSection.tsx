import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SalesSettings, SalesPermissions, ROLES } from '@/services/settingsApi';

interface Props {
  settings: SalesSettings;
  onUpdate: (updates: Partial<SalesSettings>) => void;
}

const PermissionsSection = ({ settings, onUpdate }: Props) => {
  const { t } = useLanguage();
  const { permissions } = settings;

  const updatePermission = (key: keyof SalesPermissions, roleId: string, checked: boolean) => {
    const current = permissions[key] as string[];
    const updated = checked
      ? [...current, roleId]
      : current.filter(r => r !== roleId);
    onUpdate({
      permissions: { ...permissions, [key]: updated },
    });
  };

  const renderRoleCheckboxes = (key: keyof SalesPermissions) => (
    <div className="flex flex-wrap gap-4 mt-2">
      {ROLES.map(role => (
        <div key={role.id} className="flex items-center space-x-2">
          <Checkbox
            id={`${key}-${role.id}`}
            checked={(permissions[key] as string[]).includes(role.id)}
            onCheckedChange={(checked) => updatePermission(key, role.id, !!checked)}
          />
          <label htmlFor={`${key}-${role.id}`} className="text-sm">{role.name}</label>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t('settings.sales.can-create-products')}</Label>
        {renderRoleCheckboxes('canCreateProducts')}
      </div>

      <div className="space-y-2">
        <Label>{t('settings.sales.can-edit-prices')}</Label>
        {renderRoleCheckboxes('canEditPrices')}
      </div>

      <div className="space-y-2">
        <Label>{t('settings.sales.can-apply-discounts')}</Label>
        {renderRoleCheckboxes('canApplyDiscounts')}
      </div>

      <div className="space-y-2">
        <Label>{t('settings.sales.can-view-commissions')}</Label>
        {renderRoleCheckboxes('canViewCommissions')}
      </div>
    </div>
  );
};

export default PermissionsSection;
