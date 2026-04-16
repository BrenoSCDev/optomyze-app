/**
 * LEAD COMPANY VIEW MODAL
 * 
 * Read-only modal displaying full company details
 */

import { Building2, Mail, Phone, Globe, MapPin, FileText, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LeadCompany } from '@/types/leadCompany';
import { API_STORAGE_URL } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeadCompanyViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: LeadCompany | null;
}

const statusColors: Record<string, string> = {
  prospect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  lead: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  customer: 'bg-green-500/20 text-green-400 border-green-500/30',
  partner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function InfoItem({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

export function LeadCompanyViewModal({
  open,
  onOpenChange,
  company,
}: LeadCompanyViewModalProps) {
  const { t } = useLanguage();
  if (!company) return null;

  const logoUrl = company.logo_path ? `${API_STORAGE_URL}/${company.logo_path}` : null;
  const initials = company.trade_name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  const fullAddress = [
    company.street,
    company.number,
    company.complement,
    company.neighborhood,
    company.city,
    company.state,
    company.postal_code,
    company.country,
  ].filter(Boolean).join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-lg border border-border">
              {logoUrl ? (
                <AvatarImage src={logoUrl} alt={company.trade_name} className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xl">
                {initials || <Building2 className="h-7 w-7" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{company.trade_name}</DialogTitle>
                  {company.legal_name !== company.trade_name && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {company.legal_name}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={`${statusColors[company.status]} capitalize`}
                >
                  {company.status}
                </Badge>
              </div>
              {company.industry && (
                <p className="text-sm text-muted-foreground mt-2">{company.industry}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[calc(90vh-200px)] px-6 py-4">
          <div className="space-y-6">
            <Section title={t('companies.section.identification')}>
              <InfoItem label={t('companies.field.tax-id')} value={company.tax_id} />
              <InfoItem label={t('companies.field.industry')} value={company.industry} />
              <InfoItem label={t('companies.field.company-size')} value={company.company_size} />
              <InfoItem label={t('companies.field.website')} value={company.website} icon={Globe} />
            </Section>

            <Separator />

            <Section title={t('companies.section.contact')}>
              <InfoItem label={t('companies.field.email')} value={company.email} icon={Mail} />
              <InfoItem label={t('companies.field.phone')} value={company.phone} icon={Phone} />
              <InfoItem label={t('companies.field.secondary-phone')} value={company.secondary_phone} icon={Phone} />
            </Section>

            {fullAddress && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{t('companies.section.address')}</h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{fullAddress}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <Section title={t('companies.section.crm-info')}>
              <InfoItem label={t('companies.field.source')} value={company.source} />
              <InfoItem label={t('companies.field.status')} value={company.status} />
            </Section>

            {company.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{t('companies.section.notes')}</h4>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
                  </div>
                </div>
              </>
            )}

            {(company.created_at || company.updated_at) && (
              <>
                <Separator />
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  {company.created_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{t('companies.created-at')}: {new Date(company.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {company.updated_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{t('companies.updated-at')}: {new Date(company.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
