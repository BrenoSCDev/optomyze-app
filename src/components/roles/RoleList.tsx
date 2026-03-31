import { Shield, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { SYSTEM_ROLES, ROLE_COLORS } from '@/services/roleApi';

interface RoleListProps {
  roles: Record<string, string[]>;
  totalPermissions: number;
  selectedRole: string;
  unsavedRoles: Set<string>;
  onSelectRole: (role: string) => void;
  onCreateRole: () => void;
  canEdit: boolean;
}

const RoleList = ({ roles, totalPermissions, selectedRole, unsavedRoles, onSelectRole, onCreateRole, canEdit }: RoleListProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('roles.list.title')}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Object.entries(roles).map(([role, perms]) => {
          const isSystem = SYSTEM_ROLES.includes(role);
          const colorClass = ROLE_COLORS[role] || 'bg-muted text-muted-foreground border-border';
          const isSelected = selectedRole === role;
          const hasUnsaved = unsavedRoles.has(role);

          return (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-accent border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs capitalize ${colorClass}`}>
                  {role}
                </Badge>
                {isSystem && <Lock className="h-3 w-3 text-muted-foreground" />}
                {hasUnsaved && <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />}
              </div>
              <div className="mt-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{perms.length} / {totalPermissions}</span>
                  <span className="text-[10px]">{Math.round((perms.length / Math.max(totalPermissions, 1)) * 100)}%</span>
                </div>
                <div className="h-1 w-full bg-muted rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all"
                    style={{ width: `${(perms.length / Math.max(totalPermissions, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {canEdit && (
        <div className="p-3 border-t">
          <Button variant="outline" size="sm" className="w-full" onClick={onCreateRole}>
            <Plus className="h-4 w-4 mr-1" />
            {t('roles.new-role')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoleList;
