/**
 * QUICKSTART PANEL
 *
 * The onboarding checklist a company works through after signing up. Steps and
 * their order come from the API; this file owns only how each key is labelled
 * and where it sends the user.
 *
 * Ticking is manual rather than inferred from the data. "Connect your
 * messaging app" is done when the user says it is — auto-ticking from, say,
 * the existence of an integration row would check boxes nobody visited and
 * make the list feel like it was happening to them.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Building2, CalendarDays, Check, GitBranch,
  MessageCircle, MessageSquare, RotateCcw, Rocket, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuickstart } from '@/contexts/QuickstartContext';
import { QuickstartStep } from '@/services/quickstartApi';
import { cn } from '@/lib/utils';

/**
 * Where each step sends the user, and the icon that stands for it.
 *
 * Destinations are `?section=` links because that is how this app switches
 * screens — `Index` reads the param and swaps the panel. `crm-panel` also
 * takes a `tab`, which is what lets a step land on Funnels or Conversations
 * rather than the settings default.
 */
const STEP_TARGETS: Record<QuickstartStep, { to: string; icon: React.ElementType }> = {
  create_funnel:     { to: '/?section=crm-panel&tab=funnels',       icon: GitBranch },
  connect_messaging: { to: '/?section=integrations',                icon: MessageCircle },
  welcome_message:   { to: '/?section=crm-panel&tab=conversations', icon: MessageSquare },
  add_team_member:   { to: '/?section=manage-users',                icon: Users },
  first_appointment: { to: '/?section=optomyze-calendar',           icon: CalendarDays },
  chat_widget:       { to: '/?section=integrations',                icon: Building2 },
};

const QuickstartPanel = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { quickstart, loading, setStepCompleted, dismiss, restore } = useQuickstart();
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (loading && !quickstart) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quickstart) return null;

  const { steps, completed_steps: done, completed_count: completedCount, total_steps: total } = quickstart;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleDismiss = async () => {
    try {
      setDismissing(true);
      await dismiss();
      setConfirmDismiss(false);
      // The menu entry is gone now, so staying here would strand the user on a
      // screen they can no longer navigate back to.
      navigate('/?section=optomyze-metrics');
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('quickstart.title')}
          </h1>
          <p className="text-muted-foreground">{t('quickstart.description')}</p>
        </div>

        {/* Reachable through menu search once dismissed, so this screen has to
            offer the way back — otherwise dismissing is a one-way door. */}
        {quickstart.dismissed ? (
          <Button variant="outline" size="sm" onClick={() => void restore()} className="shrink-0">
            <RotateCcw className="h-4 w-4" />
            {t('quickstart.restore')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmDismiss(true)} className="shrink-0">
            <X className="h-4 w-4" />
            {t('quickstart.dismiss')}
          </Button>
        )}
      </motion.div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Rocket className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {quickstart.is_complete ? t('quickstart.all-done') : t('quickstart.progress-label')}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                {t('quickstart.progress-count')
                  .replace('{done}', String(completedCount))
                  .replace('{total}', String(total))}
              </span>
            </div>
            <Progress value={percent} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        {steps.map(step => {
          const target = STEP_TARGETS[step];
          const Icon = target?.icon ?? Check;
          const isDone = done.includes(step);

          return (
            <Card key={step} className={cn('transition-colors duration-base ease-standard', isDone && 'bg-muted/40')}>
              <CardContent className="flex items-center gap-3 p-4">
                {/* The box is the only thing that ticks a step; the rest of the
                    row navigates, so neither action can trigger the other. */}
                <Checkbox
                  checked={isDone}
                  onCheckedChange={checked => void setStepCompleted(step, checked === true)}
                  aria-label={t(`quickstart.step.${step}`)}
                  className="shrink-0"
                />

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-medium text-foreground',
                    isDone && 'line-through text-muted-foreground'
                  )}>
                    {t(`quickstart.step.${step}`)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`quickstart.step.${step}.description`)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(target.to)}
                >
                  {t('quickstart.go')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Dismiss confirmation — this removes the checklist from the menu. */}
      <AlertDialog open={confirmDismiss} onOpenChange={(open) => !open && setConfirmDismiss(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('quickstart.dismiss-title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('quickstart.dismiss-confirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dismissing}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismiss} disabled={dismissing}>
              {t('quickstart.dismiss')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuickstartPanel;
