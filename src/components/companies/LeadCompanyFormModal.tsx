/**
 * LEAD COMPANY FORM MODAL
 * 
 * Modal for creating and editing lead companies
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeadCompany, COMPANY_STATUSES, COMPANY_SIZES } from '@/types/leadCompany';
import { API_STORAGE_URL } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

const formSchema = z.object({
  legal_name: z.string().min(1, 'Legal name is required').max(255),
  trade_name: z.string().min(1, 'Trade name is required').max(255),
  tax_id: z.string().max(50).optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  company_size: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  secondary_phone: z.string().max(30).optional().or(z.literal('')),
  street: z.string().max(255).optional().or(z.literal('')),
  number: z.string().max(20).optional().or(z.literal('')),
  complement: z.string().max(100).optional().or(z.literal('')),
  neighborhood: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  postal_code: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['prospect', 'lead', 'customer', 'partner', 'inactive']),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface LeadCompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: LeadCompany | null;
  onSubmit: (data: FormData, logo: File | null) => Promise<void>;
  isLoading?: boolean;
}

export function LeadCompanyFormModal({
  open,
  onOpenChange,
  company,
  onSubmit,
  isLoading,
}: LeadCompanyFormModalProps) {
  const { t } = useLanguage();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      legal_name: '',
      trade_name: '',
      tax_id: '',
      industry: '',
      company_size: '',
      website: '',
      email: '',
      phone: '',
      secondary_phone: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      source: '',
      status: 'prospect',
      notes: '',
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        legal_name: company.legal_name || '',
        trade_name: company.trade_name || '',
        tax_id: company.tax_id || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
        website: company.website || '',
        email: company.email || '',
        phone: company.phone || '',
        secondary_phone: company.secondary_phone || '',
        street: company.street || '',
        number: company.number || '',
        complement: company.complement || '',
        neighborhood: company.neighborhood || '',
        city: company.city || '',
        state: company.state || '',
        postal_code: company.postal_code || '',
        country: company.country || '',
        source: company.source || '',
        status: company.status || 'prospect',
        notes: company.notes || '',
      });
      if (company.logo_path) {
        setLogoPreview(`${API_STORAGE_URL}/${company.logo_path}`);
      }
    } else {
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [company, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data, logoFile);
  };

  const isEditing = !!company;
  const initials = form.watch('trade_name')
    ?.split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase() || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditing ? t('companies.edit') : t('companies.create')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <Tabs defaultValue="identification" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="identification">{t('companies.tab.identification')}</TabsTrigger>
                  <TabsTrigger value="contact">{t('companies.tab.contact')}</TabsTrigger>
                  <TabsTrigger value="address">{t('companies.tab.address')}</TabsTrigger>
                  <TabsTrigger value="crm">{t('companies.tab.crm')}</TabsTrigger>
                </TabsList>

                <TabsContent value="identification" className="space-y-6 mt-0 pb-4">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-lg border-2 border-dashed border-border">
                      {logoPreview ? (
                        <AvatarImage src={logoPreview} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xl">
                        {initials || <Building2 className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {t('companies.upload-logo')}
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeLogo}
                          >
                            <X className="h-4 w-4" />
                            {t('companies.remove')}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('companies.logo-hint')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="legal_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.legal-name')} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.legal-name')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trade_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.trade-name')} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.trade-name')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tax_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.tax-id')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.tax-id')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.industry')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.industry')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.company-size')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('companies.field.company-size')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPANY_SIZES.map((size) => (
                                <SelectItem key={size.value} value={size.value}>
                                  {size.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.website')}</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-6 mt-0 pb-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('companies.field.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondary_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.secondary-phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 987-6543" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-6 mt-0 pb-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('companies.field.street')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('companies.field.street')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.number')}</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.complement')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.complement')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.neighborhood')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.neighborhood')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.city')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.city')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.state')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.state')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.postal-code')}</FormLabel>
                          <FormControl>
                            <Input placeholder="12345-678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.country')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.country')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="crm" className="space-y-6 mt-0 pb-4">
                  <div className="grid grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.source')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('companies.field.source')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('companies.field.status')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('companies.field.status')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COMPANY_STATUSES.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('companies.field.notes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('companies.field.notes')}
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('companies.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('companies.saving') : isEditing ? t('companies.save-changes') : t('companies.create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
