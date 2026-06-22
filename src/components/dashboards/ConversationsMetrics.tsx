/**
 * CONVERSATIONS METRICS DASHBOARD
 *
 * SLA / agent-performance reporting built on top of ChatSession data
 * (started/closed conversations, response times, conversion/resolution
 * rates, breakdowns by channel/agent/closing reason, and a daily report).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import KPICard from '@/components/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, CheckCircle2, Clock, Timer, Percent, Trophy, RotateCcw, Calendar,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  fetchConversationsMetrics,
  fetchConversationsDailyReport,
  ConversationsMetricsData,
  ConversationsDateRange,
  DailyReportData,
} from '@/services/conversationsMetricsApi';
import { userApi } from '@/services/userApi';
import { teamApi } from '@/services/teamApi';
import { User } from '@/types/user';
import { Team } from '@/types/team';

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E1306C',
  messenger: '#0084FF',
  sms: '#6366F1',
};

const OUTCOME_COLORS: Record<string, string> = {
  won: '#10B981',
  lost: '#EF4444',
  neutral: '#94A3B8',
};

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
};

const chartTooltipLabelStyle = { color: 'hsl(var(--foreground))', fontWeight: 600 };
const chartTooltipItemStyle = { color: 'hsl(var(--foreground))' };

const DATE_RANGE_OPTIONS: { value: ConversationsDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7_days', label: 'Last 7 Days' },
  { value: '30_days', label: 'Last 30 Days' },
  { value: '60_days', label: 'Last 60 Days' },
  { value: '90_days', label: 'Last 90 Days' },
  { value: '120_days', label: 'Last 120 Days' },
  { value: 'full', label: 'Full Period' },
];

/** Formats a duration in seconds as a clear, explicit string (e.g. "45s", "4m 12s", "2h 44m") — never a bare, unitless number. */
const formatDuration = (totalSeconds: number): string => {
  if (!totalSeconds) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const ConversationsMetrics = () => {
  const { t } = useLanguage();

  const [period, setPeriod] = useState<ConversationsDateRange>('30_days');
  const [agentId, setAgentId] = useState<string>('all');
  const [teamId, setTeamId] = useState<string>('all');
  const [channel, setChannel] = useState<string>('all');

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [metrics, setMetrics] = useState<ConversationsMetricsData | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(true);

  useEffect(() => {
    Promise.all([userApi.getUsers(), teamApi.getTeams()])
      .then(([usersData, teamsData]) => {
        setUsers(usersData);
        setTeams(teamsData);
      })
      .catch(() => {});
  }, []);

  const loadMetrics = useCallback(() => {
    setLoading(true);
    fetchConversationsMetrics({
      period,
      agent_id: agentId !== 'all' ? Number(agentId) : undefined,
      team_id: teamId !== 'all' ? Number(teamId) : undefined,
      channel: channel !== 'all' ? channel : undefined,
    })
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, [period, agentId, teamId, channel]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    setLoadingDaily(true);
    fetchConversationsDailyReport()
      .then(setDailyReport)
      .catch(() => setDailyReport(null))
      .finally(() => setLoadingDaily(false));
  }, []);

  const channelChartData = metrics
    ? Object.entries(metrics.by_channel).map(([name, value]) => ({ name, value }))
    : [];

  const closingReasonChartData = metrics?.by_closing_reason.map(r => ({
    name: r.name,
    count: r.count,
    fill: OUTCOME_COLORS[r.outcome] ?? OUTCOME_COLORS.neutral,
  })) ?? [];

  const agentChartData = metrics?.by_agent.map(a => ({ name: a.agent_name, count: a.count })) ?? [];

  const kpis = metrics ? [
    { title: t('conversations-metrics.started'), value: metrics.conversations_started, icon: <MessageSquare className="w-5 h-5" /> },
    { title: t('conversations-metrics.closed'), value: metrics.conversations_closed, icon: <CheckCircle2 className="w-5 h-5" /> },
    { title: t('conversations-metrics.active'), value: metrics.active_conversations, icon: <Clock className="w-5 h-5" /> },
    { title: t('conversations-metrics.avg-first-response'), value: formatDuration(metrics.avg_first_response_time_seconds), icon: <Timer className="w-5 h-5" />, staticValue: true },
    { title: t('conversations-metrics.avg-response'), value: formatDuration(metrics.avg_response_time_seconds), icon: <Timer className="w-5 h-5" />, staticValue: true },
    { title: t('conversations-metrics.avg-duration'), value: formatDuration(metrics.avg_conversation_duration_seconds), icon: <Clock className="w-5 h-5" />, staticValue: true },
    { title: t('conversations-metrics.conversion-rate'), value: `${metrics.conversion_rate}%`, icon: <Trophy className="w-5 h-5" /> },
    { title: t('conversations-metrics.resolution-rate'), value: `${metrics.resolution_rate}%`, icon: <Percent className="w-5 h-5" /> },
    { title: t('conversations-metrics.lead-to-sale-rate'), value: `${metrics.lead_to_sale_rate}%`, icon: <Trophy className="w-5 h-5" /> },
    { title: t('conversations-metrics.reopened'), value: metrics.reopened_conversations, icon: <RotateCcw className="w-5 h-5" /> },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('conversations-metrics.title')}</h1>
          <p className="text-muted-foreground">{t('conversations-metrics.description')}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="overview">{t('conversations-metrics.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="daily-report">{t('conversations-metrics.tabs.daily-report')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as ConversationsDateRange)}>
              <SelectTrigger className="w-[160px] h-9 glass-card text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {DATE_RANGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[150px] h-9 glass-card text-sm">
                <SelectValue placeholder={t('conversations-metrics.filter.channel')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t('conversations-metrics.filter.all-channels')}</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger className="w-[170px] h-9 glass-card text-sm">
                <SelectValue placeholder={t('conversations-metrics.filter.agent')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t('conversations-metrics.filter.all-agents')}</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger className="w-[170px] h-9 glass-card text-sm">
                <SelectValue placeholder={t('conversations-metrics.filter.team')} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">{t('conversations-metrics.filter.all-teams')}</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
              : kpis.map((kpi, i) => <KPICard key={kpi.title} {...kpi} delay={i} compact />)}
          </div>

          {/* Breakdown charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">{t('conversations-metrics.by-channel')}</h3>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : channelChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">{t('conversations-metrics.no-data')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={channelChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {channelChartData.map((entry, i) => (
                        <Cell key={i} fill={CHANNEL_COLORS[entry.name] ?? '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipLabelStyle} itemStyle={chartTooltipItemStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">{t('conversations-metrics.by-closing-reason')}</h3>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : closingReasonChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">{t('conversations-metrics.no-data')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={closingReasonChartData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                      formatter={(value: number) => [value, undefined]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {closingReasonChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-4">{t('conversations-metrics.by-agent')}</h3>
              {loading ? (
                <Skeleton className="h-56 w-full" />
              ) : agentChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-16">{t('conversations-metrics.no-data')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={agentChartData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                      formatter={(value: number) => [value, undefined]}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Agent productivity table */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">{t('conversations-metrics.agent-productivity')}</h3>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : !metrics || metrics.agent_productivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t('conversations-metrics.no-data')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">{t('conversations-metrics.filter.agent')}</th>
                      <th className="py-2 pr-4">{t('conversations-metrics.closed')}</th>
                      <th className="py-2 pr-4">{t('conversations-metrics.avg-duration')}</th>
                      <th className="py-2 pr-4">{t('conversations-metrics.messages-sent')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.agent_productivity.map(agent => (
                      <tr key={agent.agent_id} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{agent.agent_name}</td>
                        <td className="py-2 pr-4">{agent.closed_count}</td>
                        <td className="py-2 pr-4">{formatDuration(agent.avg_duration_seconds)}</td>
                        <td className="py-2 pr-4">{agent.messages_sent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily-report" className="space-y-6 mt-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{dailyReport?.date}</span>
          </div>

          {loadingDaily ? (
            <Skeleton className="h-48 w-full" />
          ) : !dailyReport ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('conversations-metrics.no-data')}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title={t('conversations-metrics.started')} value={dailyReport.conversations_started} icon={<MessageSquare className="w-5 h-5" />} compact />
                <KPICard title={t('conversations-metrics.closed')} value={dailyReport.conversations_closed} icon={<CheckCircle2 className="w-5 h-5" />} compact />
                <KPICard title={t('conversations-metrics.unanswered')} value={dailyReport.unanswered_conversations} icon={<Clock className="w-5 h-5" />} compact />
                <KPICard title={t('conversations-metrics.missed')} value={dailyReport.missed_conversations} icon={<Clock className="w-5 h-5" />} compact />
              </div>

              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4">{t('conversations-metrics.by-closing-reason')}</h3>
                {Object.keys(dailyReport.by_closing_reason).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('conversations-metrics.no-data')}</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(dailyReport.by_closing_reason).map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <span>{name}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConversationsMetrics;
