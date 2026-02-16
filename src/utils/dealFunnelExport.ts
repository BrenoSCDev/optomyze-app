/**
 * DEAL FUNNEL EXPORT UTILITY
 * 
 * Exports deal funnel data to Excel (.xlsx) format
 */

import * as XLSX from 'xlsx';

interface ExportDeal {
  id: string;
  name: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  stage: string;
  assignedUser: string;
  createdAt: string;
  subtotal: number;
  chargesTotal: number;
  discountTotal: number;
  finalTotal: number;
  itemCount: number;
  currency: string;
  notes: string;
}

interface DealFunnelExportData {
  funnelName: string;
  deals: ExportDeal[];
}

export const exportDealFunnelToExcel = (data: DealFunnelExportData): void => {
  const { funnelName, deals } = data;

  const excelData = deals.map((deal) => ({
    'Deal ID': deal.id,
    'Deal Name': deal.name,
    'Lead': deal.leadName || 'N/A',
    'Email': deal.leadEmail || 'N/A',
    'Phone': deal.leadPhone || 'N/A',
    'Stage': deal.stage,
    'Assigned User': deal.assignedUser || 'Unassigned',
    'Created At': deal.createdAt ? new Date(deal.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A',
    'Subtotal': deal.subtotal || 0,
    'Charges': deal.chargesTotal || 0,
    'Discounts': deal.discountTotal || 0,
    'Final Total': deal.finalTotal || 0,
    'Items': deal.itemCount || 0,
    'Notes': deal.notes || '',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Deals');

  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = funnelName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `${sanitizedName}_Deals_${date}.xlsx`);
};

export const prepareDealFunnelExportData = (funnel: any): DealFunnelExportData => {
  const deals: ExportDeal[] = [];

  funnel.stages?.forEach((stage: any) => {
    (stage.deals || []).forEach((deal: any) => {
      const leadName = deal.lead ? `${deal.lead.first_name} ${deal.lead.last_name || ''}`.trim() : '';
      deals.push({
        id: deal.id?.toString() || '',
        name: deal.name || '',
        leadName,
        leadEmail: deal.lead?.email || '',
        leadPhone: deal.lead?.phone || '',
        stage: stage.name || 'Unknown Stage',
        assignedUser: deal.user?.name || '',
        createdAt: deal.created_at || '',
        subtotal: parseFloat(deal.subtotal || '0'),
        chargesTotal: parseFloat(deal.charges_total || '0'),
        discountTotal: parseFloat(deal.discount_total || '0'),
        finalTotal: deal.final_total || 0,
        itemCount: deal.items?.length || 0,
        currency: deal.currency || funnel.currency || 'USD',
        notes: deal.notes || '',
      });
    });
  });

  return { funnelName: funnel.name || 'Deal Funnel', deals };
};
