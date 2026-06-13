import { Layers } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrencyValue } from './calculations';
import SectionCard from './SectionCard';
import type { AdsetSummary } from './types';

interface AdsetTableProps {
  adsets: AdsetSummary[];
  currencySymbol: string;
  delay?: number;
}

const AdsetTable = ({ adsets, currencySymbol, delay = 0 }: AdsetTableProps) => {
  const { t } = useLanguage();

  if (adsets.length === 0) return null;

  return (
    <SectionCard title={t('meta.adset-analysis')} icon={<Layers className="h-5 w-5" />} delay={delay}>
      <Table>
        <TableHeader>
          <TableRow className="border-border/60">
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.name')}</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.campaign')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.spend')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.impressions')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.clicks')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.ctr')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.results')}</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('meta.adset.cpl')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adsets.map((adset) => (
            <TableRow key={adset.id} className="border-border/40 hover:bg-[#0081FB]/5">
              <TableCell className="font-medium max-w-[200px] truncate" title={adset.name}>{adset.name}</TableCell>
              <TableCell className="max-w-[160px] truncate text-muted-foreground" title={adset.campaignName}>{adset.campaignName}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrencyValue(adset.spend, currencySymbol)}</TableCell>
              <TableCell className="text-right tabular-nums">{adset.impressions.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{adset.clicks.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{adset.ctr.toFixed(2)}%</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{adset.results.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{adset.cpl !== null ? formatCurrencyValue(adset.cpl, currencySymbol) : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
};

export default AdsetTable;
