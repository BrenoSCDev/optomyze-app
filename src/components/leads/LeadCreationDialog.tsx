import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import InputMask from 'react-input-mask';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/leadApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import SourcePlatformIcon from './SourcePlatformIcon';

interface LeadCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  funnelId: string;
  funnelData: any;
  selectedStageId?: string; // Pre-selected stage ID from column
  onLeadCreated: () => void;
}

const ddiOptions = [
  { value: "+1", label: "+1", country: "United States", flag: "🇺🇸" },
  { value: "+1", label: "+1", country: "Canada", flag: "🇨🇦" },
  { value: "+44", label: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { value: "+353", label: "+353", country: "Ireland", flag: "🇮🇪" },
  { value: "+33", label: "+33", country: "France", flag: "🇫🇷" },
  { value: "+34", label: "+34", country: "Spain", flag: "🇪🇸" },
  { value: "+49", label: "+49", country: "Germany", flag: "🇩🇪" },
  { value: "+41", label: "+41", country: "Switzerland", flag: "🇨🇭" },
  { value: "+351", label: "+351", country: "Portugal", flag: "🇵🇹" },
  { value: "+47", label: "+47", country: "Norway", flag: "🇳🇴" },
  { value: "+39", label: "+39", country: "Italy", flag: "🇮🇹" },
  { value: "+7", label: "+7", country: "Russia", flag: "🇷🇺" },
  { value: "+55", label: "+55", country: "Brazil", flag: "🇧🇷" },
  { value: "+54", label: "+54", country: "Argentina", flag: "🇦🇷" }
];

const phoneMasks = {
  "+1": "(999) 999-9999",
  "+44": "9999 999 9999",
  "+353": "99 999 9999",
  "+33": "99 99 99 99 99",
  "+34": "999 999 999",
  "+49": "999 999 9999",
  "+41": "99 999 99 99",
  "+351": "999 999 999",
  "+47": "999 99 999",
  "+39": "999 999 9999",
  "+7": "999 999-99-99",
  "+55": "(99) 99999-9999",
  "+54": "99 9999-9999"
};

const platformOptions = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "telegram", label: "Telegram" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "api", label: "API" },
  { value: "other", label: "Other" }
];

const selectClasses = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

export const LeadCreationDialog: React.FC<LeadCreationDialogProps> = ({
  isOpen,
  onClose,
  funnelId,
  funnelData,
  selectedStageId,
  onLeadCreated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ddi: '+55',
    source_platform: 'other',
    company_id: user?.company_id || '1',
    funnel_id: funnelId,
    stage_id: ''
  });

  // Set default stage when funnel data loads or selectedStageId changes
  useEffect(() => {
    if (funnelData?.funnel?.stages) {
      let defaultStageId = '';

      if (selectedStageId) {
        // Use the pre-selected stage from column
        defaultStageId = selectedStageId;
      } else {
        // Use the first stage as default
        const firstStage = funnelData.funnel.stages
          .filter(stage => stage.is_active)
          .sort((a, b) => a.order - b.order)[0];
        defaultStageId = firstStage?.id.toString() || '';
      }

      setFormData(prev => ({ ...prev, stage_id: defaultStageId }));
    }
  }, [funnelData, selectedStageId]);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'first_name':
      case 'last_name':
        if (!value.trim()) {
          newErrors[name] = t('lead.required-field');
        } else if (value.length < 2) {
          newErrors[name] = t('lead.min-characters');
        } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) {
          newErrors[name] = t('lead.letters-only');
        } else {
          delete newErrors[name];
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors[name] = t('lead.email-required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[name] = t('lead.valid-email');
        } else {
          delete newErrors[name];
        }
        break;
      case 'phone':
        if (!value.trim()) {
          newErrors[name] = t('lead.phone-required');
        } else {
          delete newErrors[name];
        }
        break;
      default:
        if (!value.trim()) {
          newErrors[name] = t('lead.required-field');
        } else {
          delete newErrors[name];
        }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleDdiChange = (value: string) => {
    setFormData(prev => ({ ...prev, ddi: value, phone: '' }));
  };

  const validateForm = () => {
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'ddi', 'source_platform', 'stage_id'];
    const newErrors: Record<string, string> = {};

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = t('lead.required-field');
      }
    });

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('lead.valid-email');
    }

    // Validate name fields
    if (formData.first_name && !/^[A-Za-zÀ-ÿ\s]+$/.test(formData.first_name)) {
      newErrors.first_name = t('lead.letters-only');
    }
    if (formData.last_name && !/^[A-Za-zÀ-ÿ\s]+$/.test(formData.last_name)) {
      newErrors.last_name = t('lead.letters-only');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: t('lead.validation-error'),
        description: t('lead.fix-errors'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await leadService.createLead(formData);

      toast({
        title: t('lead.success'),
        description: t('lead.created-successfully'),
      });

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        ddi: '+55',
        source_platform: 'other',
        company_id: user?.company_id || '1',
        funnel_id: funnelId,
        stage_id: formData.stage_id
      });

      onLeadCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating lead:', error);

      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      }

      toast({
        title: t('lead.error'),
        description: t('lead.failed-to-create'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stage options from funnel data
  const stageOptions = funnelData?.funnel?.stages
    ?.filter(stage => stage.is_active)
    ?.sort((a, b) => a.order - b.order)
    ?.map(stage => ({
      value: stage.id.toString(),
      label: stage.name,
      description: stage.description,
      order: stage.order
    })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <UserPlus className="h-5 w-5 text-primary-foreground" />
            </div>
            {t('lead.create-new')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('lead.personal-information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('lead.first-name')} *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder={t('lead.enter-first-name')}
                    className={cn(errors.first_name && "border-destructive")}
                    disabled={isSubmitting}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('lead.last-name')} *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder={t('lead.enter-last-name')}
                    className={cn(errors.last_name && "border-destructive")}
                    disabled={isSubmitting}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('lead.email-address')} *</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t('lead.enter-email')}
                  className={cn(errors.email && "border-destructive")}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('lead.contact-information')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ddi">{t('lead.country-code')} *</Label>
                  <select
                    id="ddi"
                    value={formData.ddi}
                    onChange={(e) => handleDdiChange(e.target.value)}
                    className={cn(selectClasses, errors.ddi && "border-destructive")}
                    disabled={isSubmitting}
                  >
                    {ddiOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.flag} {option.value} ({option.country})
                      </option>
                    ))}
                  </select>
                  {errors.ddi && (
                    <p className="text-sm text-destructive">{errors.ddi}</p>
                  )}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="phone">{t('lead.phone-number')} *</Label>
                  <InputMask
                    mask={phoneMasks[formData.ddi] || "999999999999"}
                    value={formData.phone}
                    onChange={handleInputChange}
                    name="phone"
                    id="phone"
                    placeholder={t('lead.enter-phone')}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
                      errors.phone && "border-destructive"
                    )}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Platform and Assignment */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('lead.platform-assignment')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_platform">{t('lead.source-platform')} *</Label>
                  <Select
                    value={formData.source_platform}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, source_platform: value }));
                      validateField('source_platform', value);
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="source_platform" className={cn(errors.source_platform && "border-destructive")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <SourcePlatformIcon source={option.value} className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source_platform && (
                    <p className="text-sm text-destructive">{errors.source_platform}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage_id" className="flex items-center gap-2">
                    {t('lead.initial-stage')} *
                    {selectedStageId && (
                      <span className="text-xs leading-none text-primary">
                        {t('lead.pre-selected-column')}
                      </span>
                    )}
                  </Label>
                  <select
                    id="stage_id"
                    name="stage_id"
                    value={formData.stage_id}
                    onChange={handleInputChange}
                    className={cn(
                      selectClasses,
                      errors.stage_id && "border-destructive",
                      selectedStageId && "ring-2 ring-primary/30"
                    )}
                    disabled={isSubmitting}
                  >
                    <option value="">{t('lead.select-stage')}</option>
                    {stageOptions.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label} {selectedStageId === stage.value ? t('lead.selected-from-column') : ''}
                      </option>
                    ))}
                  </select>
                  {errors.stage_id && (
                    <p className="text-sm text-destructive">{errors.stage_id}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Lead...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
