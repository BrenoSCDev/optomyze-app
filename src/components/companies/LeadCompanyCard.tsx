/**
 * LEAD COMPANY CARD COMPONENT
 * 
 * Displays a single lead company in card view
 */

import { Building2, Mail, Phone, Eye, Pencil, Trash2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeadCompany } from '@/types/leadCompany';
import { API_STORAGE_URL } from '@/lib/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeadCompanyCardProps {
  company: LeadCompany;
  onView: (company: LeadCompany) => void;
  onEdit: (company: LeadCompany) => void;
  onDelete: (company: LeadCompany) => void;
}

const statusColors: Record<string, string> = {
  prospect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  lead: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  customer: 'bg-green-500/20 text-green-400 border-green-500/30',
  partner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  inactive: 'bg-muted text-muted-foreground border-border-strong',
};

export function LeadCompanyCard({ company, onView, onEdit, onDelete }: LeadCompanyCardProps) {
  const { t } = useLanguage();
  const logoUrl = company.logo_path ? `${API_STORAGE_URL}/${company.logo_path}` : null;
  const initials = company.trade_name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="group hover:border-primary/50 transition-colors duration-fast ease-standard bg-card/50 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 rounded-lg border border-border">
            {logoUrl ? (
              <AvatarImage src={logoUrl} alt={company.trade_name} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-lg">
              {initials || <Building2 className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {company.trade_name}
                </h3>
                {company.industry && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {company.industry}
                  </p>
                )}
              </div>
              <Badge 
                variant="outline" 
                className={`${statusColors[company.status]} text-xs capitalize shrink-0`}
              >
                {company.status}
              </Badge>
            </div>

            <div className="mt-3 space-y-1.5">
              {company.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{company.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onView(company)}
          >
            <Eye className="h-3.5 w-3.5" />
            {t('companies.view')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => onEdit(company)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(company)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
