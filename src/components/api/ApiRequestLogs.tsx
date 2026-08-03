/**
 * API REQUEST LOGS DASHBOARD
 *
 * Real-time observability view over the centralized api_request_logs table:
 * search/filter/paginate historical requests, and stream new ones live over
 * the company's private WebSocket channel (api-log.started / api-log.logged).
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ChevronDown, ChevronRight, Loader2, RefreshCw, Search,
  CheckCircle2, XCircle, Clock, Wifi,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getEcho } from '@/services/echo';
import api from '@/services/api';
import {
  fetchApiLogs, fetchApiLogFilterOptions, fetchApiLogDetail,
  type ApiRequestLogEntry, type ApiLogFilters, type ApiLogFilterOptions,
} from '@/services/apiLogsApi';

interface PendingLiveRequest {
  request_id: string;
  method: string;
  endpoint: string;
  started_at: string;
}

interface ApiTokenOption {
  id: number;
  name: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  POST: 'bg-green-500/10 text-green-600 border-green-500/20',
  PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PATCH: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const ApiRequestLogs = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [logs, setLogs] = useState<ApiRequestLogEntry[]>([]);
  const [pendingLive, setPendingLive] = useState<PendingLiveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ApiLogFilters>({ page: 1, per_page: 25 });
  const [filterOptions, setFilterOptions] = useState<ApiLogFilterOptions>({ endpoints: [], methods: [] });
  const [tokens, setTokens] = useState<ApiTokenOption[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 25, total: 0 });

  // Debounce free-text search into the filters object
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApiLogs(filters);
      setLogs(response.data);
      setPagination(response.meta);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('api.logs.fetch-error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, t, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    fetchApiLogFilterOptions().then(setFilterOptions).catch(() => {});
    api.get('/api/tokens').then(res => setTokens(res.data)).catch(() => {});
  }, []);

  // Real-time stream: company-scoped private channel
  useEffect(() => {
    const companyId = user?.company_id;
    if (!companyId) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`company.${companyId}`);

    const handleStarted = (event: PendingLiveRequest) => {
      setIsLive(true);
      setPendingLive(prev => prev.some(p => p.request_id === event.request_id) ? prev : [event, ...prev]);
    };

    const handleLogged = (event: { log: ApiRequestLogEntry }) => {
      setIsLive(true);
      setPendingLive(prev => prev.filter(p => p.request_id !== event.log.request_id));

      // Only splice live entries onto the first page so pagination stays consistent
      if ((filters.page ?? 1) === 1) {
        setLogs(prev => [event.log, ...prev.filter(l => l.request_id !== event.log.request_id)]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
    };

    channel.listen('.api-log.started', handleStarted);
    channel.listen('.api-log.logged', handleLogged);

    return () => {
      channel.stopListening('.api-log.started');
      channel.stopListening('.api-log.logged');
    };
  }, [user?.company_id, filters.page]);

  const updateFilter = (key: keyof ApiLogFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return '—';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  };

  const formatTime = (dateString: string) => new Date(dateString).toLocaleString();

  // Real-time entries arrive with only a lean summary (no headers/bodies, to
  // stay under Reverb's payload size limit) - fetch full detail on first expand.
  const handleToggleExpand = async (log: ApiRequestLogEntry) => {
    if (expandedId === log.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(log.id);

    if (log.request_headers === undefined) {
      try {
        const detail = await fetchApiLogDetail(log.id);
        setLogs(prev => prev.map(l => l.id === log.id ? detail : l));
      } catch {
        // Detail fetch failed - row stays expanded with whatever summary we have.
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t('api.logs.title')}
          </h1>
          <p className="text-muted-foreground">{t('api.logs.description')}</p>
        </div>
        {/* Only the live state is worth a badge — a "connecting" chip flashed on
            every load and said nothing the user could act on. */}
        {isLive && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-green-500/40 text-green-600">
            <Wifi className="h-3.5 w-3.5" />
            {t('api.logs.live')}
          </Badge>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          {/* No card subtitle: the page header above already carries one, and a
              second line of explanatory text read as a repeat. */}
          <CardHeader>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
                {t('common.refresh')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('api.logs.search-placeholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filters.method ?? 'all'} onValueChange={(v) => updateFilter('method', v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder={t('api.logs.filter-method')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('api.logs.all-methods')}</SelectItem>
                  {filterOptions.methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.status ?? 'all'} onValueChange={(v) => updateFilter('status', v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('api.logs.filter-status')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('api.logs.all-statuses')}</SelectItem>
                  <SelectItem value="success">{t('api.logs.status-success')}</SelectItem>
                  <SelectItem value="failure">{t('api.logs.status-failure')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.endpoint ?? 'all'} onValueChange={(v) => updateFilter('endpoint', v === 'all' ? undefined : v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('api.logs.filter-endpoint')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('api.logs.all-endpoints')}</SelectItem>
                  {filterOptions.endpoints.map(e => <SelectItem key={e} value={e} className="font-mono text-xs">{e}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select
                value={filters.api_token_id ? String(filters.api_token_id) : 'all'}
                onValueChange={(v) => updateFilter('api_token_id', v === 'all' ? undefined : Number(v))}
              >
                <SelectTrigger className="w-[160px]"><SelectValue placeholder={t('api.logs.filter-token')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('api.logs.all-tokens')}</SelectItem>
                  {tokens.map(token => <SelectItem key={token.id} value={String(token.id)}>{token.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">{t('api.logs.date-from')}</span>
              <Input type="datetime-local" className="w-[200px]" value={filters.date_from ?? ''} onChange={(e) => updateFilter('date_from', e.target.value || undefined)} />
              <span className="text-xs text-muted-foreground">{t('api.logs.date-to')}</span>
              <Input type="datetime-local" className="w-[200px]" value={filters.date_to ?? ''} onChange={(e) => updateFilter('date_to', e.target.value || undefined)} />
              <span className="text-xs text-muted-foreground ml-2">{t('api.logs.response-time-ms')}</span>
              <Input type="number" placeholder={t('api.logs.min')} className="w-[90px]" value={filters.min_duration_ms ?? ''} onChange={(e) => updateFilter('min_duration_ms', e.target.value ? Number(e.target.value) : undefined)} />
              <Input type="number" placeholder={t('api.logs.max')} className="w-[90px]" value={filters.max_duration_ms ?? ''} onChange={(e) => updateFilter('max_duration_ms', e.target.value ? Number(e.target.value) : undefined)} />
            </div>

            {/* Live pending requests */}
            {pendingLive.length > 0 && (
              <div className="space-y-1">
                {pendingLive.map(p => (
                  <div key={p.request_id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5 border border-primary/20 text-sm animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <Badge variant="outline" className={cn('text-xs', METHOD_COLORS[p.method] ?? '')}>{p.method}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{p.endpoint}</span>
                    <span className="text-xs text-primary ml-auto">{t('api.logs.processing')}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Table */}
            {loading && logs.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">{t('api.logs.no-logs')}</h3>
                <p className="text-muted-foreground">{t('api.logs.no-logs-description')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>{t('api.logs.column-method')}</TableHead>
                    <TableHead>{t('api.logs.column-endpoint')}</TableHead>
                    <TableHead>{t('api.logs.column-status')}</TableHead>
                    <TableHead>{t('api.logs.column-duration')}</TableHead>
                    <TableHead>{t('api.logs.column-token')}</TableHead>
                    <TableHead>{t('api.logs.column-time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <ApiLogRow
                      key={log.id}
                      log={log}
                      expanded={expandedId === log.id}
                      onToggle={() => handleToggleExpand(log)}
                      formatDuration={formatDuration}
                      formatTime={formatTime}
                      t={t}
                    />
                  ))}
                </TableBody>
              </Table>
            )}

            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {t('api.logs.showing')} {((pagination.current_page - 1) * pagination.per_page) + 1}-{Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t('api.logs.of')} {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page === 1}>
                    {t('products.previous')}
                  </Button>
                  <span className="text-sm text-muted-foreground">{pagination.current_page} / {pagination.last_page}</span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page}>
                    {t('products.next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

interface ApiLogRowProps {
  log: ApiRequestLogEntry;
  expanded: boolean;
  onToggle: () => void;
  formatDuration: (ms: number | null) => string;
  formatTime: (dateString: string) => string;
  t: (key: string) => string;
}

const ApiLogRow = ({ log, expanded, onToggle, formatDuration, formatTime, t }: ApiLogRowProps) => {
  const isSuccess = log.status === 'success';

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
        <TableCell>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn('text-xs font-mono', METHOD_COLORS[log.method] ?? '')}>{log.method}</Badge>
        </TableCell>
        <TableCell className="font-mono text-xs max-w-[280px] truncate">{log.endpoint}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            {isSuccess ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
            <span className={cn('text-sm font-medium', isSuccess ? 'text-green-600' : 'text-red-600')}>{log.response_status ?? '—'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(log.duration_ms)}
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{log.api_token?.name ?? '—'}</TableCell>
        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatTime(log.created_at)}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-muted/30 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              <DetailBlock title={t('api.logs.detail-request')}>
                <DetailField label={t('api.logs.detail-method')} value={log.method} />
                <DetailField label={t('api.logs.detail-route')} value={log.endpoint} mono />
                <DetailField label={t('api.logs.detail-url')} value={log.full_url} mono wrap />
                <DetailJson label={t('api.logs.detail-headers')} value={log.request_headers} />
                <DetailJson label={t('api.logs.detail-query')} value={log.query_params} />
                <DetailJson label={t('api.logs.detail-body')} value={log.request_body} />
              </DetailBlock>

              <DetailBlock title={t('api.logs.detail-response')}>
                <DetailField label={t('api.logs.detail-status-code')} value={String(log.response_status ?? '—')} />
                <DetailField label={t('api.logs.detail-duration')} value={formatDuration(log.duration_ms)} />
                <DetailJson label={t('api.logs.detail-headers')} value={log.response_headers} />
                <DetailJson label={t('api.logs.detail-body')} value={log.response_body} />
                {log.exception_message && (
                  <DetailField label={t('api.logs.detail-exception')} value={`${log.exception_class ?? ''}: ${log.exception_message}`} wrap />
                )}
              </DetailBlock>

              <DetailBlock title={t('api.logs.detail-metadata')}>
                <DetailField label={t('api.logs.detail-timestamp')} value={formatTime(log.created_at)} />
                <DetailField label={t('api.logs.detail-ip')} value={log.ip_address} mono />
                <DetailField label={t('api.logs.detail-user-agent')} value={log.user_agent} wrap />
                <DetailField label={t('api.logs.detail-token')} value={log.api_token?.name} />
                <DetailField label={t('api.logs.detail-user')} value={log.user?.name} />
                <DetailField label={t('api.logs.detail-request-id')} value={log.request_id} mono />
              </DetailBlock>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const DetailBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-foreground">{title}</h4>
    <div className="space-y-2">{children}</div>
  </div>
);

const DetailField = ({ label, value, mono, wrap }: { label: string; value?: string | null; mono?: boolean; wrap?: boolean }) => (
  <div>
    <p className="text-muted-foreground">{label}</p>
    <p className={cn(mono && 'font-mono', wrap ? 'break-all' : 'truncate')}>{value || '—'}</p>
  </div>
);

const DetailJson = ({ label, value }: { label: string; value: unknown }) => {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
    return (
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="text-muted-foreground/60">—</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <pre className="bg-background rounded-md border p-2 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
};

export default ApiRequestLogs;
