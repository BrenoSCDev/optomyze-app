/**
 * LEAD COMPANY TABLE COMPONENT
 * 
 * Displays lead companies in a table view
 */

import { Building2, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeadCompany } from '@/types/leadCompany';
import { API_STORAGE_URL } from '@/lib/constants';

interface LeadCompanyTableProps {
  companies: LeadCompany[];
  onView: (company: LeadCompany) => void;
  onEdit: (company: LeadCompany) => void;
  onDelete: (company: LeadCompany) => void;
}

const statusColors: Record<string, string> = {
  prospect: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  lead: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  customer: 'bg-green-500/20 text-green-400 border-green-500/30',
  partner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function LeadCompanyTable({ companies, onView, onEdit, onDelete }: LeadCompanyTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border">
            <TableHead className="w-12"></TableHead>
            <TableHead>Trade Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => {
            const logoUrl = company.logo_path ? `${API_STORAGE_URL}/${company.logo_path}` : null;
            const initials = company.trade_name
              .split(' ')
              .slice(0, 2)
              .map(word => word[0])
              .join('')
              .toUpperCase();

            return (
              <TableRow 
                key={company.id} 
                className="hover:bg-muted/30 border-border cursor-pointer"
                onClick={() => onView(company)}
              >
                <TableCell>
                  <Avatar className="h-9 w-9 rounded-md border border-border">
                    {logoUrl ? (
                      <AvatarImage src={logoUrl} alt={company.trade_name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="rounded-md bg-primary/10 text-primary font-medium text-xs">
                      {initials || <Building2 className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{company.trade_name}</TableCell>
                <TableCell className="text-muted-foreground">{company.industry || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{company.email || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{company.phone || '-'}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${statusColors[company.status]} text-xs capitalize`}
                  >
                    {company.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(company)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(company)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(company)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
