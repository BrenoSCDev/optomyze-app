/**
 * FUNNEL EXPORT UTILITY
 * 
 * Exports funnel leads to Excel (.xlsx) format
 */

import * as XLSX from 'xlsx';

interface ExportLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  assignedUserName?: string;
  assignedUserEmail?: string;
  createdAt: string;
  estimatedValue: number;
  numberOfProducts?: number;
  totalQuantity?: number;
  currency?: string;
}

interface FunnelExportData {
  funnelName: string;
  leads: ExportLead[];
}

export const exportFunnelToExcel = (data: FunnelExportData): void => {
  const { funnelName, leads } = data;

  // Transform leads to Excel row format
  const excelData = leads.map((lead) => ({
    'Lead ID': lead.id,
    'Lead Name': lead.name,
    'Email': lead.email || 'N/A',
    'Phone': lead.phone || 'N/A',
    'Status / Stage': lead.stage,
    'Assigned User': lead.assignedUserName || 'Unassigned',
    'Assigned User Email': lead.assignedUserEmail || 'N/A',
    'Created At': lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A',
    'Estimated Value': lead.estimatedValue || 0,
    'Number of Products': lead.numberOfProducts || 0,
    'Total Quantity': lead.totalQuantity || 0,
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 10 },  // Lead ID
    { wch: 25 },  // Lead Name
    { wch: 30 },  // Email
    { wch: 18 },  // Phone
    { wch: 20 },  // Status / Stage
    { wch: 20 },  // Assigned User
    { wch: 30 },  // Assigned User Email
    { wch: 22 },  // Created At
    { wch: 15 },  // Estimated Value
    { wch: 18 },  // Number of Products
    { wch: 15 },  // Total Quantity
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Funnel Leads');

  // Generate filename with funnel name and date
  const date = new Date().toISOString().split('T')[0];
  const sanitizedFunnelName = funnelName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedFunnelName}_Leads_${date}.xlsx`;

  // Trigger download
  XLSX.writeFile(workbook, filename);
};

export const prepareFunnelExportData = (funnel: any): FunnelExportData => {
  const leads: ExportLead[] = [];

  // Iterate through all stages and collect leads
  funnel.stages?.forEach((stage: any) => {
    stage.active_leads?.forEach((lead: any) => {
      // Calculate product totals if available
      const products = lead.products || [];
      const numberOfProducts = products.length;
      const totalQuantity = products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0);

      leads.push({
        id: lead.id?.toString() || '',
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
        email: lead.email || '',
        phone: lead.phone || '',
        stage: stage.name || 'Unknown Stage',
        assignedUserName: lead.assigned_user?.name || '',
        assignedUserEmail: lead.assigned_user?.email || '',
        createdAt: lead.created_at || '',
        estimatedValue: parseFloat(lead.value_estimated || lead.estimated_value || '0'),
        numberOfProducts,
        totalQuantity,
        currency: lead.currency || funnel.currency || 'USD',
      });
    });
  });

  return {
    funnelName: funnel.name || 'Funnel',
    leads,
  };
};
