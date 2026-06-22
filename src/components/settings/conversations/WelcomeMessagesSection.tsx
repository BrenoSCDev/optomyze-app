import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';
import { fetchWelcomeMessageAccounts, upsertWelcomeMessageConfig } from '@/services/welcomeMessageApi';
import { WelcomeMessageAccount } from '@/types/inbox';

const PLACEHOLDERS = ['{lead_name}', '{company_name}', '{agent_name}'];

const AccountRow = ({ account, onSaved }: { account: WelcomeMessageAccount; onSaved: (a: WelcomeMessageAccount) => void }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(account.is_enabled);
  const [message, setMessage] = useState(account.message ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = enabled !== account.is_enabled || message !== (account.message ?? '');

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await upsertWelcomeMessageConfig({
        channelable_type: account.channelable_type,
        channelable_id: account.channelable_id,
        channel: account.channel,
        is_enabled: enabled,
        message,
      });
      onSaved(updated);
      toast({ title: t('common.success'), description: t('settings.conversations.welcome.save-success') });
    } catch (error) {
      console.error('Failed to save welcome message config:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.welcome.save-error'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="shrink-0 capitalize">{account.channel}</Badge>
            <span className="font-medium truncate">{account.label}</span>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={t('settings.conversations.welcome.message-placeholder')}
          rows={3}
          disabled={!enabled}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {PLACEHOLDERS.map(p => (
              <Button
                key={p}
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px] font-mono"
                disabled={!enabled}
                onClick={() => setMessage(prev => `${prev}${p}`)}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WelcomeMessagesSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<WelcomeMessageAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWelcomeMessageAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load connected accounts:', error);
      toast({ title: t('common.error'), description: t('settings.conversations.welcome.load-error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSaved = (updated: WelcomeMessageAccount) => {
    setAccounts(prev => prev.map(a =>
      a.channelable_type === updated.channelable_type && a.channelable_id === updated.channelable_id
        ? updated
        : a
    ));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg bg-background/50">
        <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('settings.conversations.welcome.no-accounts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t('settings.conversations.welcome.description')}</p>
      {accounts.map(account => (
        <AccountRow
          key={`${account.channelable_type}:${account.channelable_id}`}
          account={account}
          onSaved={handleSaved}
        />
      ))}
    </div>
  );
};

export default WelcomeMessagesSection;
