/**
 * LEAD EDIT MODAL
 * 
 * Tabbed modal for editing lead information
 * Tabs: Contact, Address, Tracking (notes & tags)
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import InputMask from 'react-input-mask';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, User, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ddiOptions, phoneMasks, splitPhoneNumber, combinePhoneNumber, DEFAULT_DDI } from '@/lib/phone';

interface LeadTag {
  id: number;
  name: string;
  color?: string;
}

interface LeadCompanyInfo {
  id: number;
  legal_name: string;
  industry?: string | null;
  logo_path?: string | null;
}

interface CompanyOption {
  id: number;
  legal_name: string;
}

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source_platform: string;
  value_estimated: number;
  currency: string;
  notes: string;
  priority?: string;
  is_active?: boolean;
  job_title?: string | null;
  lead_company?: LeadCompanyInfo | null;
  // Address fields
  address_line_1?: string | null;
  address_line_2?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  postal_code?: string | null;
  country?: string | null;
  // Tags
  tags?: LeadTag[];
}

interface LeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  companies?: CompanyOption[];
  onUpdate: () => void;
}

const LeadEditModal: React.FC<LeadEditModalProps> = ({
  isOpen,
  onClose,
  lead,
  companies = [],
  onUpdate
}) => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Contact fields
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ddi: DEFAULT_DDI,
    source_platform: 'Direct',
    value_estimated: '',
    currency: 'USD',
    // Address fields
    address_line_1: '',
    address_line_2: '',
    neighborhood: '',
    city: '',
    state: '',
    state_code: '',
    postal_code: '',
    country: '',
    // Tracking fields
    notes: '',
    priority: 'medium',
    is_active: true,
    job_title: '',
    lead_company_id: null as number | null
  });

  useEffect(() => {
    if (lead && isOpen) {
      const { ddi, localNumber } = splitPhoneNumber(lead.phone);
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        phone: localNumber,
        ddi,
        source_platform: lead.source_platform || 'Direct',
        value_estimated: lead.value_estimated?.toString() || '',
        currency: lead.currency || 'USD',
        address_line_1: lead.address_line_1 || '',
        address_line_2: lead.address_line_2 || '',
        neighborhood: lead.neighborhood || '',
        city: lead.city || '',
        state: lead.state || '',
        state_code: lead.state_code || '',
        postal_code: lead.postal_code || '',
        country: lead.country || '',
        notes: lead.notes || '',
        priority: lead.priority || 'medium',
        is_active: lead.is_active !== undefined ? lead.is_active : true,
        job_title: lead.job_title || '',
        lead_company_id: lead.lead_company?.id || null
      });
      setActiveTab('contact');
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { ddi, phone, ...rest } = formData;
      await api.put(`/api/leads/${lead.id}`, {
        ...rest,
        phone: combinePhoneNumber(ddi, phone),
      });
      toast.success(t('lead-details.update-success'));
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast.error(t('lead-details.update-error'));
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const modalTree = (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[70] overflow-y-auto">
        <motion.div 
          className="w-full max-w-2xl sm:mx-4 max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">{t('lead-details.edit-modal-title')}</h3>
              <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-accent">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full min-h-0">
                <div className="px-4 sm:px-6 pt-4 shrink-0">
                  <TabsList className="grid w-full grid-cols-3 bg-muted">
                    <TabsTrigger 
                      value="contact" 
                      className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    >
                      <User className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">{t('lead-details.edit.contact')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="address" 
                      className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    >
                      <MapPin className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">{t('lead-details.edit.address')}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="tracking" 
                      className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                    >
                      <Tag className="w-3.5 h-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">{t('lead-details.edit.tracking')}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0 scrollbar-dark">
                  {/* Contact Tab */}
                  <TabsContent value="contact" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-foreground">
                          {t('lead-details.first-name')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => updateField('first_name', e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-foreground">
                          {t('lead-details.last-name')} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => updateField('last_name', e.target.value)}
                          required
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">
                        {t('lead-details.email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ddi" className="text-foreground">
                          {t('lead-details.country-code')}
                        </Label>
                        <Select
                          value={formData.ddi}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, ddi: value, phone: '' }))}
                        >
                          <SelectTrigger id="ddi" className="bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ddiOptions.map((option, index) => (
                              <SelectItem key={index} value={option.value}>
                                {option.flag} {option.label} ({option.country})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="phone" className="text-foreground">
                          {t('lead-details.phone')}
                        </Label>
                        <InputMask
                          mask={phoneMasks[formData.ddi] || "999999999999"}
                          value={formData.phone}
                          onChange={(e) => updateField('phone', e.target.value)}
                          id="phone"
                          className={cn(
                            "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency" className="text-foreground">
                        {t('lead-details.currency')}
                      </Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => updateField('currency', value)}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder={t('lead-details.currency')} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="USD" className="text-popover-foreground hover:bg-accent focus:bg-accent">$ USD - US Dollar</SelectItem>
                          <SelectItem value="EUR" className="text-popover-foreground hover:bg-accent focus:bg-accent">€ EUR - Euro</SelectItem>
                          <SelectItem value="GBP" className="text-popover-foreground hover:bg-accent focus:bg-accent">£ GBP - British Pound</SelectItem>
                          <SelectItem value="BRL" className="text-popover-foreground hover:bg-accent focus:bg-accent">R$ BRL - Brazilian Real</SelectItem>
                          <SelectItem value="CAD" className="text-popover-foreground hover:bg-accent focus:bg-accent">C$ CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD" className="text-popover-foreground hover:bg-accent focus:bg-accent">A$ AUD - Australian Dollar</SelectItem>
                          <SelectItem value="JPY" className="text-popover-foreground hover:bg-accent focus:bg-accent">¥ JPY - Japanese Yen</SelectItem>
                          <SelectItem value="CNY" className="text-popover-foreground hover:bg-accent focus:bg-accent">¥ CNY - Chinese Yuan</SelectItem>
                          <SelectItem value="INR" className="text-popover-foreground hover:bg-accent focus:bg-accent">₹ INR - Indian Rupee</SelectItem>
                          <SelectItem value="MXN" className="text-popover-foreground hover:bg-accent focus:bg-accent">$ MXN - Mexican Peso</SelectItem>
                          <SelectItem value="CHF" className="text-popover-foreground hover:bg-accent focus:bg-accent">CHF CHF - Swiss Franc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Address Tab */}
                  <TabsContent value="address" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_line_1" className="text-foreground">
                        {t('lead-details.address-line-1')}
                      </Label>
                      <Input
                        id="address_line_1"
                        value={formData.address_line_1}
                        onChange={(e) => updateField('address_line_1', e.target.value)}
                        placeholder={t('lead-details.address-line-1-placeholder')}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_line_2" className="text-foreground">
                        {t('lead-details.address-line-2')}
                      </Label>
                      <Input
                        id="address_line_2"
                        value={formData.address_line_2}
                        onChange={(e) => updateField('address_line_2', e.target.value)}
                        placeholder={t('lead-details.address-line-2-placeholder')}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="neighborhood" className="text-foreground">
                          {t('lead-details.neighborhood')}
                        </Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(e) => updateField('neighborhood', e.target.value)}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-foreground">
                          {t('lead-details.city')}
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-foreground">
                          {t('lead-details.state')}
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => updateField('state', e.target.value)}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state_code" className="text-foreground">
                          {t('lead-details.state-code')}
                        </Label>
                        <Input
                          id="state_code"
                          value={formData.state_code}
                          onChange={(e) => updateField('state_code', e.target.value)}
                          maxLength={3}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code" className="text-foreground">
                          {t('lead-details.postal-code')}
                        </Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => updateField('postal_code', e.target.value)}
                          className="bg-background border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-foreground">
                        {t('lead-details.country')}
                      </Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => updateField('country', e.target.value)}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </TabsContent>

                  {/* Tracking Tab */}
                  <TabsContent value="tracking" className="mt-0 space-y-4">
                    {/* Company Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="lead_company_id" className="text-foreground">
                        {t('lead-details.company')}
                      </Label>
                      <Select
                        value={formData.lead_company_id?.toString() || '_none'}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          lead_company_id: value === '_none' ? null : Number(value) 
                        }))}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder={t('lead-details.select-company')} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="_none" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <span className="text-muted-foreground">{t('lead-details.no-company')}</span>
                          </SelectItem>
                          {companies.map((company) => (
                            <SelectItem 
                              key={company.id} 
                              value={company.id.toString()} 
                              className="text-popover-foreground hover:bg-accent focus:bg-accent"
                            >
                              {company.legal_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Job Title */}
                    <div className="space-y-2">
                      <Label htmlFor="job_title" className="text-foreground">
                        {t('lead-details.job-title')}
                      </Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => updateField('job_title', e.target.value)}
                        placeholder={t('lead-details.job-title-placeholder')}
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    {/* Active Status */}
                    <div className="space-y-2">
                      <Label htmlFor="is_active" className="text-foreground">
                        {t('lead-details.status-label')}
                      </Label>
                      <Select
                        value={formData.is_active ? 'active' : 'inactive'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder={t('lead-details.status-select')} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="active" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                              {t('lead-details.active')}
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                              {t('lead-details.inactive')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-foreground">
                        {t('lead-details.priority-label')}
                      </Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => updateField('priority', value)}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder={t('lead-details.priority-select')} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="low" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                              {t('lead-details.priority-low')}
                            </div>
                          </SelectItem>
                          <SelectItem value="medium" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                              {t('lead-details.priority-medium')}
                            </div>
                          </SelectItem>
                          <SelectItem value="high" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                              {t('lead-details.priority-high')}
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent" className="text-popover-foreground hover:bg-accent focus:bg-accent">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                              {t('lead-details.priority-urgent')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tags Display */}
                    {lead.tags && lead.tags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('lead-details.tags')}</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border border-border">
                          {lead.tags.map((tag) => (
                            <Badge 
                              key={tag.id} 
                              variant="outline"
                              className="text-xs"
                              style={{ 
                                borderColor: tag.color || '#8B5CF6',
                                color: tag.color || '#8B5CF6',
                                backgroundColor: `${tag.color || '#8B5CF6'}20`
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('lead-details.tags-manage-hint')}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-foreground">
                        {t('lead-details.notes')}
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        rows={6}
                        placeholder={t('lead-details.notes-placeholder')}
                        className="bg-background border-border text-foreground resize-none"
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-border shrink-0">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                disabled={loading}
              >
                {t('lead-details.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/80"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('lead-details.saving')}
                  </>
                ) : (
                  t('lead-details.save-changes')
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalTree, document.body);
};

export default LeadEditModal;
