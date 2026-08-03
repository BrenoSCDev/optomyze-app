import React, { useState } from 'react';
import { Building2, Loader2, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';

/**
 * Step two of signing in, shown only when the person holds accounts in more
 * than one company.
 *
 * Choosing here is what creates the session — until a company is picked there
 * is no token, because a token is issued against one company account and can
 * never see another. Accounts are separate per company, so the role shown
 * beside each one is the role there, not a single global role.
 */
const CompanyPicker = () => {
  const { pendingSelection, selectCompany, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(null);

  const companies = pendingSelection?.companies ?? [];
  const from = location.state?.from?.pathname || '/';

  const choose = async (companyId) => {
    setSubmitting(companyId);

    try {
      await selectCompany(companyId);
      navigate(from, { replace: true });
    } catch (error) {
      const expired = error.response?.status === 401;

      toast({
        title: expired ? 'Sign-in expired' : 'Could not open that company',
        description: expired
          ? 'Your sign-in took too long. Please enter your details again.'
          : error.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });

      if (expired) {
        await logout();
      }
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Choose a company</h1>
        <p className="text-sm text-muted-foreground">
          You have an account at more than one company. Pick the one to work in —
          you can switch at any time.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {companies.map((company) => (
          <li key={company.company_id}>
            <button
              type="button"
              onClick={() => choose(company.company_id)}
              disabled={submitting !== null}
              className="group flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{company.name}</span>
                <span className="block text-xs capitalize text-muted-foreground">{company.role}</span>
              </span>

              {submitting === company.company_id ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <Button variant="ghost" className="w-full" onClick={logout} disabled={submitting !== null}>
        Use a different account
      </Button>
    </div>
  );
};

export default CompanyPicker;
