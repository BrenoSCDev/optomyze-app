import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2 } from 'lucide-react';

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRoles: string[];
  onCreateRole: (name: string, copyFrom: string | null) => Promise<void>;
}

const ROLE_NAME_PATTERN = /^[a-z_]+$/;

const CreateRoleModal = ({ open, onOpenChange, existingRoles, onCreateRole }: CreateRoleModalProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [copyFrom, setCopyFrom] = useState<string>('scratch');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const validate = (val: string) => {
    if (!val.trim()) return t('roles.create.name-required');
    if (!ROLE_NAME_PATTERN.test(val)) return t('roles.create.name-invalid');
    if (existingRoles.includes(val)) return t('roles.create.name-exists');
    return '';
  };

  const handleCreate = async () => {
    const err = validate(name);
    if (err) { setError(err); return; }
    setSaving(true);
    try {
      await onCreateRole(name, copyFrom === 'scratch' ? null : copyFrom);
      setName('');
      setCopyFrom('scratch');
      setError('');
      onOpenChange(false);
    } catch {
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('roles.create.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>{t('roles.create.name-label')}</Label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value.toLowerCase()); setError(''); }}
              placeholder="e.g. supervisor"
              className="font-mono"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-[11px] text-muted-foreground">{t('roles.create.name-hint')}</p>
          </div>

          <div className="grid gap-2">
            <Label>{t('roles.create.template-label')}</Label>
            <Select value={copyFrom} onValueChange={setCopyFrom}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scratch">{t('roles.create.from-scratch')}</SelectItem>
                <SelectItem value="agent">{t('roles.create.copy-agent')}</SelectItem>
                <SelectItem value="manager">{t('roles.create.copy-manager')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {t('roles.create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoleModal;
