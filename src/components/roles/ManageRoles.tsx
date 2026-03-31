import { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { roleApi, PermissionGroups, RolePermissions } from '@/services/roleApi';
import RoleList from './RoleList';
import PermissionMatrix from './PermissionMatrix';
import CreateRoleModal from './CreateRoleModal';

const ManageRoles = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<PermissionGroups>({});
  const [roles, setRoles] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [editedPerms, setEditedPerms] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // TODO: wire to real permission check from auth context
  const canEdit = true;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [permsData, rolesData] = await Promise.all([
        roleApi.getPermissions(),
        roleApi.getRoles(),
      ]);
      setPermissions(permsData);
      setRoles(rolesData);
      // Select first role if current selection doesn't exist
      const roleKeys = Object.keys(rolesData);
      if (roleKeys.length > 0 && !rolesData[selectedRole]) {
        setSelectedRole(roleKeys[0]);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast({ title: t('common.error'), description: t('roles.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t, selectedRole]);

  useEffect(() => { loadData(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const totalPermissions = useMemo(
    () => Object.values(permissions).reduce((sum, arr) => sum + arr.length, 0),
    [permissions]
  );

  const savedKeysForRole = useMemo(
    () => new Set(roles[selectedRole] || []),
    [roles, selectedRole]
  );

  const checkedKeysForRole = useMemo(
    () => editedPerms[selectedRole] ?? savedKeysForRole,
    [editedPerms, selectedRole, savedKeysForRole]
  );

  const unsavedRoles = useMemo(() => {
    const s = new Set<string>();
    for (const [role, edited] of Object.entries(editedPerms)) {
      const saved = new Set(roles[role] || []);
      if (edited.size !== saved.size || [...edited].some(k => !saved.has(k))) {
        s.add(role);
      }
    }
    return s;
  }, [editedPerms, roles]);

  const handleToggle = (key: string) => {
    setEditedPerms(prev => {
      const current = new Set(prev[selectedRole] ?? savedKeysForRole);
      if (current.has(key)) current.delete(key); else current.add(key);

      // If unchecking a menu.* key, auto-uncheck child group keys
      if (key.startsWith('menu.') && !current.has(key)) {
        const parts = key.replace('menu.', '').split('.');
        const groupKey = parts[0];
        if (permissions[groupKey]) {
          permissions[groupKey].forEach(p => current.delete(p.key));
        }
      }

      return { ...prev, [selectedRole]: current };
    });
  };

  const handleToggleGroup = (group: string, checked: boolean) => {
    setEditedPerms(prev => {
      const current = new Set(prev[selectedRole] ?? savedKeysForRole);
      const groupKeys = (permissions[group] || []).map(p => p.key);
      groupKeys.forEach(k => checked ? current.add(k) : current.delete(k));
      return { ...prev, [selectedRole]: current };
    });
  };

  const handleSave = async () => {
    const keys = [...checkedKeysForRole];
    try {
      setSaving(true);
      await roleApi.updateRolePermissions(selectedRole, keys);
      setRoles(prev => ({ ...prev, [selectedRole]: keys }));
      setEditedPerms(prev => {
        const next = { ...prev };
        delete next[selectedRole];
        return next;
      });
      toast({ title: t('common.success'), description: t('roles.save-success') });
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast({ title: t('common.error'), description: t('roles.no-edit-permission'), variant: 'destructive' });
      } else {
        toast({ title: t('common.error'), description: t('roles.save-error'), variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (name: string, copyFrom: string | null) => {
    const initialPerms = copyFrom && roles[copyFrom] ? [...roles[copyFrom]] : [];
    await roleApi.updateRolePermissions(name, initialPerms);
    setRoles(prev => ({ ...prev, [name]: initialPerms }));
    setSelectedRole(name);
  };

  if (loading) {
    return (
      <div className="glass-card m-6 p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card m-6 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t('roles.manage.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('roles.manage.permission-desc')}</p>
      </div>

      {/* Two-column layout */}
      <div className="flex min-h-[600px]">
        {/* Left panel */}
        <div className="w-64 shrink-0 border-r">
          <RoleList
            roles={roles}
            totalPermissions={totalPermissions}
            selectedRole={selectedRole}
            unsavedRoles={unsavedRoles}
            onSelectRole={setSelectedRole}
            onCreateRole={() => setCreateOpen(true)}
            canEdit={canEdit}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0">
          <PermissionMatrix
            role={selectedRole}
            permissions={permissions}
            checkedKeys={checkedKeysForRole}
            savedKeys={savedKeysForRole}
            onToggle={handleToggle}
            onToggleGroup={handleToggleGroup}
            onSave={handleSave}
            saving={saving}
            canEdit={canEdit}
          />
        </div>
      </div>

      <CreateRoleModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingRoles={Object.keys(roles)}
        onCreateRole={handleCreateRole}
      />
    </div>
  );
};

export default ManageRoles;
