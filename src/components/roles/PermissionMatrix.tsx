import { useState, useMemo } from 'react';
import { Search, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { PermissionGroups, PERMISSION_GROUP_ORDER, SYSTEM_ROLES, ROLE_COLORS } from '@/services/roleApi';

interface PermissionMatrixProps {
  role: string;
  permissions: PermissionGroups;
  checkedKeys: Set<string>;
  savedKeys: Set<string>;
  onToggle: (key: string) => void;
  onToggleGroup: (group: string, checked: boolean) => void;
  onSave: () => void;
  saving: boolean;
  canEdit: boolean;
}

const PermissionMatrix = ({ role, permissions, checkedKeys, savedKeys, onToggle, onToggleGroup, onSave, saving, canEdit }: PermissionMatrixProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasChanges = useMemo(() => {
    if (checkedKeys.size !== savedKeys.size) return true;
    for (const k of checkedKeys) if (!savedKeys.has(k)) return true;
    return false;
  }, [checkedKeys, savedKeys]);

  const orderedGroups = useMemo(() => {
    const allGroupKeys = Object.keys(permissions);
    const ordered = PERMISSION_GROUP_ORDER.filter(g => allGroupKeys.includes(g));
    allGroupKeys.forEach(g => { if (!ordered.includes(g)) ordered.push(g); });
    return ordered;
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return orderedGroups.map(g => ({ group: g, perms: permissions[g] || [] }));
    const q = search.toLowerCase();
    return orderedGroups
      .map(g => ({
        group: g,
        perms: (permissions[g] || []).filter(p => p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
      }))
      .filter(g => g.perms.length > 0);
  }, [orderedGroups, permissions, search]);

  const handleSaveClick = () => {
    if (role === 'admin') {
      setConfirmOpen(true);
    } else {
      onSave();
    }
  };

  // Menu-child auto-uncheck hint
  const getMenuChildHint = (key: string): string | null => {
    if (!key.startsWith('menu.')) return null;
    // e.g. menu.leads -> leads group
    const parts = key.replace('menu.', '').split('.');
    const groupKey = parts[0];
    if (permissions[groupKey] && checkedKeys.has(key)) return null; // currently checked, no hint needed
    if (permissions[groupKey]) return t('roles.menu-hint');
    return null;
  };

  const colorClass = ROLE_COLORS[role] || 'bg-muted text-muted-foreground border-border';
  const totalPerms = Object.values(permissions).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-sm capitalize ${colorClass}`}>{role}</Badge>
          <span className="text-xs text-muted-foreground">{checkedKeys.size} / {totalPerms} {t('roles.permissions-label')}</span>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleSaveClick} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {t('roles.save')}
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="mx-4 mt-3 p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t('roles.read-only-banner')}
        </div>
      )}

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('roles.search-permissions')}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 mt-3">
        {checkedKeys.size === 0 && !search && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {t('roles.empty-permissions')}
          </div>
        )}

        <Accordion type="multiple" defaultValue={['menu']} className="space-y-2">
          {filteredGroups.map(({ group, perms }) => {
            const allGroupKeys = (permissions[group] || []).map(p => p.key);
            const checkedCount = allGroupKeys.filter(k => checkedKeys.has(k)).length;
            const allChecked = checkedCount === allGroupKeys.length;

            return (
              <AccordionItem key={group} value={group} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium capitalize text-sm">{group}</span>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {checkedCount}/{allGroupKeys.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  {canEdit && (
                    <div className="flex gap-2 mb-3">
                      <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={() => onToggleGroup(group, true)} disabled={allChecked}>
                        {t('roles.select-all')}
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-[11px] px-2" onClick={() => onToggleGroup(group, false)} disabled={checkedCount === 0}>
                        {t('roles.select-none')}
                      </Button>
                    </div>
                  )}
                  <div className="space-y-1">
                    {perms.map(perm => {
                      const isChecked = checkedKeys.has(perm.key);
                      const wasChecked = savedKeys.has(perm.key);
                      const changed = isChecked !== wasChecked;
                      const hint = getMenuChildHint(perm.key);

                      return (
                        <label
                          key={perm.key}
                          className={`flex items-start gap-3 py-2 px-3 rounded-md transition-colors cursor-pointer hover:bg-accent/50 ${
                            changed
                              ? isChecked
                                ? 'bg-green-500/5 border-l-2 border-green-500'
                                : 'bg-red-500/5 border-l-2 border-red-500'
                              : 'border-l-2 border-transparent'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => canEdit && onToggle(perm.key)}
                            disabled={!canEdit}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-mono text-muted-foreground">{perm.key}</code>
                              {changed && (
                                <span className={`text-[10px] font-medium ${isChecked ? 'text-green-500' : 'text-red-500'}`}>
                                  {isChecked ? t('roles.added') : t('roles.removed')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/80 mt-0.5">{perm.description}</p>
                            {hint && !isChecked && (
                              <p className="text-[11px] text-orange-500 mt-0.5">{hint}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Admin confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('roles.admin-confirm-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('roles.admin-confirm-desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmOpen(false); onSave(); }}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PermissionMatrix;
