import React, { useState } from 'react';
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

interface UserCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: User) => void;
}

const UserCreationDialog: React.FC<UserCreationDialogProps> = ({
  open,
  onOpenChange,
  onUserCreated,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        variant: "destructive",
        title: t('users.create.validation-error'),
        description: t('users.create.fill-required-fields'),
      });
      return;
    }

    try {
      setLoading(true);
      const newUser = await userApi.createUser(formData);
      onUserCreated(newUser);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'agent',
        is_active: true,
      });

      toast({
        title: t('users.create.success'),
        description: `${newUser.name} ${t('users.create.success-description')}`,
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        variant: "destructive",
        title: t('users.create.error'),
        description: t('users.errors.try-again'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('users.create.title')}</DialogTitle>
          <DialogDescription>
            {t('users.create.description')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('users.create.name')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
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
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('users.create.email-placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('users.create.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t('users.create.phone-placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">{t('users.create.role')}</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('users.create.role-placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">{t('users.roles.agent')}</SelectItem>
                <SelectItem value="manager">{t('users.roles.manager')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
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
              {loading ? t('users.create.creating') : t('users.create.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreationDialog;