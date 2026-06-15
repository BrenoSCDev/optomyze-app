import React, { useState, useEffect } from 'react';
import InputMask from 'react-input-mask';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@/types/user';
import { userApi } from '@/services/userApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ddiOptions, phoneMasks, splitPhoneNumber, combinePhoneNumber, DEFAULT_DDI } from '@/lib/phone';

interface UserCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: User) => void;
  onUserUpdated?: (user: User) => void;
  editUser?: User | null;
}

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  ddi: DEFAULT_DDI,
  role: 'agent',
  is_active: true,
};

const UserCreationDialog: React.FC<UserCreationDialogProps> = ({
  open,
  onOpenChange,
  onUserCreated,
  onUserUpdated,
  editUser = null,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isEditMode = !!editUser;

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  // Pre-fill form when opening in edit mode
  useEffect(() => {
    if (open) {
      if (editUser) {
        const { ddi, localNumber } = splitPhoneNumber(editUser.phone);
        setFormData({
          name: editUser.name,
          email: editUser.email,
          phone: localNumber,
          ddi,
          role: editUser.role,
          is_active: editUser.is_active,
        });
      } else {
        setFormData(EMPTY_FORM);
      }
    }
  }, [open, editUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        variant: "destructive",
        title: t('users.create.validation-error'),
        description: t('users.create.fill-required-fields'),
      });
      return;
    }

    try {
      setLoading(true);

      const { ddi, phone, ...rest } = formData;
      const payload = {
        ...rest,
        phone: combinePhoneNumber(ddi, phone),
      };

      if (isEditMode && editUser) {
        const updated = await userApi.updateUser(editUser.id, payload);
        onUserUpdated?.(updated);
        toast({
          title: t('users.edit.success') || 'User updated',
          description: `${updated.name} ${t('users.edit.success-description') || 'was updated successfully.'}`,
        });
      } else {
        const newUser = await userApi.createUser(payload);
        onUserCreated(newUser);
        toast({
          title: t('users.create.success'),
          description: `${newUser.name} ${t('users.create.success-description')}`,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({
        variant: "destructive",
        title: isEditMode ? (t('users.edit.error') || 'Update failed') : t('users.create.error'),
        description: t('users.errors.try-again'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? (t('users.edit.title') || 'Edit User') : t('users.create.title')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? (t('users.edit.description') || 'Update the user information below.')
              : t('users.create.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('users.create.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('users.create.name-placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('users.create.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={t('users.create.email-placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('users.create.phone')}</Label>
            <div className="flex gap-2">
              <Select value={formData.ddi} onValueChange={(v) => handleChange('ddi', v)}>
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ddiOptions.map((option, index) => (
                    <SelectItem key={index} value={option.value}>
                      {option.flag} {option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputMask
                mask={phoneMasks[formData.ddi] || "999999999999"}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                id="phone"
                placeholder={t('users.create.phone-placeholder')}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('users.create.role')}</Label>
            <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.create.role-placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('users.roles.admin') || 'Admin'}</SelectItem>
                <SelectItem value="manager">{t('users.roles.manager')}</SelectItem>
                <SelectItem value="agent">{t('users.roles.agent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">{t('users.create.active')}</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('users.create.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEditMode ? 'Saving...' : t('users.create.creating'))
                : (isEditMode ? (t('users.edit.save') || 'Save changes') : t('users.create.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreationDialog;
