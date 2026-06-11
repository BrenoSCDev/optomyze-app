import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InputMask from 'react-input-mask';
import { useAuth } from '@/contexts/AuthContext';
import { leadService } from '@/services/leadApi';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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
  { value: "whatsapp", label: "WhatsApp", icon: "📱" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "meta_ads", label: "Meta Ads", icon: "📣" },
  { value: "google_ads", label: "Google Ads", icon: "🔍" },
  { value: "telegram", label: "Telegram", icon: "✈️" },
  { value: "phone", label: "Phone", icon: "☎️" },
  { value: "sms", label: "SMS", icon: "💬" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "website", label: "Website", icon: "🌐" },
  { value: "api", label: "API", icon: "🔌" },
  { value: "other", label: "Other", icon: "🔗" }
];

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('lead.create-new')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">{t('lead.personal-information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.first-name')} *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder={t('lead.enter-first-name')}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.first_name ? 'border-red-400' : 'border-white/10'
                      } text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400 transition-colors`}
                      disabled={isSubmitting}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-400">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.last-name')} *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder={t('lead.enter-last-name')}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.last_name ? 'border-red-400' : 'border-white/10'
                      } text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400 transition-colors`}
                      disabled={isSubmitting}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-400">{errors.last_name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    {t('lead.email-address')} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('lead.enter-email')}
                    className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                      errors.email ? 'border-red-400' : 'border-white/10'
                    } text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400 transition-colors`}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">{t('lead.contact-information')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.country-code')} *
                    </label>
                    <select
                      value={formData.ddi}
                      onChange={(e) => handleDdiChange(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.ddi ? 'border-red-400' : 'border-white/10'
                      } text-white focus:outline-none focus:border-purple-400 transition-colors`}
                      disabled={isSubmitting}
                    >
                      {ddiOptions.map((option, index) => (
                        <option key={index} value={option.value} className="bg-gray-800">
                          {option.flag} {option.value} ({option.country})
                        </option>
                      ))}
                    </select>
                    {errors.ddi && (
                      <p className="mt-1 text-sm text-red-400">{errors.ddi}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.phone-number')} *
                    </label>
                    <InputMask
                      mask={phoneMasks[formData.ddi] || "999999999999"}
                      value={formData.phone}
                      onChange={handleInputChange}
                      name="phone"
                      placeholder={t('lead.enter-phone')}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.phone ? 'border-red-400' : 'border-white/10'
                      } text-white placeholder:text-white/50 focus:outline-none focus:border-purple-400 transition-colors`}
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform and Assignment */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">{t('lead.platform-assignment')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.source-platform')} *
                    </label>
                    <select
                      name="source_platform"
                      value={formData.source_platform}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.source_platform ? 'border-red-400' : 'border-white/10'
                      } text-white focus:outline-none focus:border-purple-400 transition-colors`}
                      disabled={isSubmitting}
                    >
                      {platformOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                    {errors.source_platform && (
                      <p className="mt-1 text-sm text-red-400">{errors.source_platform}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t('lead.initial-stage')} *
                      {selectedStageId && (
                        <span className="text-xs text-purple-400 ml-2">
                          {t('lead.pre-selected-column')}
                        </span>
                      )}
                    </label>
                    <select
                      name="stage_id"
                      value={formData.stage_id}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                        errors.stage_id ? 'border-red-400' : 'border-white/10'
                      } text-white focus:outline-none focus:border-purple-400 transition-colors ${
                        selectedStageId ? 'ring-2 ring-purple-400/30' : ''
                      }`}
                      disabled={isSubmitting}
                    >
                      <option value="" className="bg-gray-800">{t('lead.select-stage')}</option>
                      {stageOptions.map((stage) => (
                        <option key={stage.value} value={stage.value} className="bg-gray-800">
                          {stage.label} {selectedStageId === stage.value ? t('lead.selected-from-column') : ''}
                        </option>
                      ))}
                    </select>
                    {errors.stage_id && (
                      <p className="mt-1 text-sm text-red-400">{errors.stage_id}</p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-white text-gray-900 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Lead...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};