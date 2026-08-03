import { useState } from 'react';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CompanySwitcherProps {
  /** Rail mode: the label is hidden and only the icon shows. */
  collapsed?: boolean;
}

/**
 * Company switcher for the sidebar's settings menu.
 *
 * Switching is a session change, not a filter: the current token is revoked
 * server-side and a new one issued against the account in the target company,
 * and every cached response is dropped. The hard reload afterwards is
 * deliberate — React state still holds the previous company's records, and
 * there is no reliable way to prove every context and query cache has been
 * emptied. Reloading is the one approach that cannot leave something behind.
 *
 * Renders nothing for people who belong to a single company, which is most.
 */
const CompanySwitcher = ({ collapsed = false }: CompanySwitcherProps) => {
  const { companies, activeCompanyId, switchCompany } = useAuth();
  const [switching, setSwitching] = useState<number | null>(null);

  if (!companies || companies.length < 2) {
    return null;
  }

  const active = companies.find(
    (company: any) => Number(company.company_id) === Number(activeCompanyId)
  );

  const handleSwitch = async (companyId: number) => {
    if (Number(companyId) === Number(activeCompanyId) || switching !== null) {
      return;
    }

    setSwitching(companyId);

    try {
      await switchCompany(companyId);
      window.location.assign('/');
    } catch (error: any) {
      setSwitching(null);
      toast.error('Could not switch company', {
        description: error?.response?.data?.message || 'Please try again.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={collapsed ? active?.name : undefined}
          className={`nav-item w-full ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <div className="flex min-w-0 items-center gap-3 [&>svg]:shrink-0">
            <span className="flex h-5 w-5 items-center justify-center">
              {switching !== null ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Building2 size={16} />
              )}
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="min-w-0 flex-1 truncate text-left"
                >
                  {active?.name || 'Switch company'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-60" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="right"
        sideOffset={8}
        className="w-56 glass-card backdrop-blur-md bg-background/95 border border-border-strong"
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch company
        </DropdownMenuLabel>

        {companies.map((company: any) => {
          const isActive = Number(company.company_id) === Number(activeCompanyId);

          return (
            <DropdownMenuItem
              key={company.company_id}
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onSelect={(event) => {
                event.preventDefault();
                handleSwitch(company.company_id);
              }}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{company.name}</span>
              {switching === company.company_id ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : isActive ? (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanySwitcher;
