/**
 * MOCK METRICS DATA for Demo Dashboard
 */

export const mockPeriodicData = {
  data: {
    lead_statistics: {
      total_leads: 1247,
      qualified_leads: 438,
      total_leads_lost: 189,
      converted_leads: 312,
      in_service: 296,
      breakdown: { entry: 402, normal: 345 },
    },
    conversion_rate: 25.02,
    performance_comparison: {
      total_leads: { percentage_change: 12.4, performance_indicator: 'improvement' },
      total_leads_lost: { percentage_change: -3.2, performance_indicator: 'improvement' },
      converted_leads: { percentage_change: 8.7, performance_indicator: 'improvement' },
      conversion_rate: { percentage_change: 2.1, performance_indicator: 'improvement' },
    },
    deal_statistics: {
      total_deals: 587,
      closed_deals: 214,
      lost_deals: 73,
      deal_conversion_rate: 36.5,
      revenue: 892450.00,
    },
    revenue_metrics: {
      metrics: {
        total_annual_revenue: 892450,
        total_monthly_revenue: 74370,
        average_deal_value: 4170,
      },
    },
    leads_by_funnel_stage: {
      funnels: [
        {
          funnel_id: 1,
          funnel_name: 'B2B Enterprise',
          total_leads: 347,
          stages: [
            { stage_id: 1, stage_name: 'New Leads', stage_type: 'entry', leads: 85, percentage: 24.5 },
            { stage_id: 2, stage_name: 'Contacted', stage_type: 'normal', leads: 67, percentage: 19.3 },
            { stage_id: 3, stage_name: 'Qualified', stage_type: 'normal', leads: 89, percentage: 25.6 },
            { stage_id: 4, stage_name: 'Proposal Sent', stage_type: 'negotiation', leads: 42, percentage: 12.1 },
            { stage_id: 5, stage_name: 'Negotiation', stage_type: 'negotiation', leads: 34, percentage: 9.8 },
            { stage_id: 6, stage_name: 'Won', stage_type: 'won', leads: 18, percentage: 5.2 },
            { stage_id: 7, stage_name: 'Lost', stage_type: 'lost', leads: 12, percentage: 3.5 },
          ],
        },
        {
          funnel_id: 2,
          funnel_name: 'SaaS Inbound',
          total_leads: 512,
          stages: [
            { stage_id: 8, stage_name: 'Trial Signup', stage_type: 'entry', leads: 198, percentage: 38.7 },
            { stage_id: 9, stage_name: 'Activated', stage_type: 'normal', leads: 134, percentage: 26.2 },
            { stage_id: 10, stage_name: 'Engaged', stage_type: 'normal', leads: 89, percentage: 17.4 },
            { stage_id: 11, stage_name: 'Converted', stage_type: 'won', leads: 56, percentage: 10.9 },
            { stage_id: 12, stage_name: 'Churned', stage_type: 'lost', leads: 35, percentage: 6.8 },
          ],
        },
      ],
    },
    deals_by_funnel_stage: {
      available: true,
      total_funnels: 2,
      funnels: [
        {
          funnel_id: 1,
          funnel_name: 'Enterprise Sales',
          total_sales: 214,
          stages: [
            { stage_id: 1, stage_name: 'Discovery', stage_type: 'entry', sales: 45, percentage: 21.0 },
            { stage_id: 2, stage_name: 'Proposal', stage_type: 'negotiation', sales: 38, percentage: 17.8 },
            { stage_id: 3, stage_name: 'Approval', stage_type: 'approval', sales: 29, percentage: 13.6 },
            { stage_id: 4, stage_name: 'Contract', stage_type: 'contract', sales: 22, percentage: 10.3 },
            { stage_id: 5, stage_name: 'Closed Won', stage_type: 'won', sales: 56, percentage: 26.2 },
            { stage_id: 6, stage_name: 'Closed Lost', stage_type: 'lost', sales: 24, percentage: 11.2 },
          ],
        },
        {
          funnel_id: 2,
          funnel_name: 'SMB Pipeline',
          total_sales: 373,
          stages: [
            { stage_id: 7, stage_name: 'Lead In', stage_type: 'entry', sales: 98, percentage: 26.3 },
            { stage_id: 8, stage_name: 'Demo Booked', stage_type: 'normal', sales: 87, percentage: 23.3 },
            { stage_id: 9, stage_name: 'Negotiation', stage_type: 'negotiation', sales: 64, percentage: 17.2 },
            { stage_id: 10, stage_name: 'Won', stage_type: 'won', sales: 78, percentage: 20.9 },
            { stage_id: 11, stage_name: 'Lost', stage_type: 'lost', sales: 46, percentage: 12.3 },
          ],
        },
      ],
    },
    estimated_vs_closed_value: {
      funnels: [
        { funnel_id: 1, funnel_name: 'Enterprise Sales', estimated_value: 1450000, closed_value: 892450, conversion_percentage: 61.5, gap_percentage: 38.5 },
        { funnel_id: 2, funnel_name: 'SMB Pipeline', estimated_value: 680000, closed_value: 412300, conversion_percentage: 60.6, gap_percentage: 39.4 },
        { funnel_id: 3, funnel_name: 'Partner Channel', estimated_value: 320000, closed_value: 198700, conversion_percentage: 62.1, gap_percentage: 37.9 },
      ],
    },
    product_sales_performance: [
      { product_id: 1, product_name: 'Premium Plan', sales_count: 45, quantity_sold: 67, revenue: 134500.00 },
      { product_id: 2, product_name: 'Enterprise Suite', sales_count: 23, quantity_sold: 23, revenue: 287500.00 },
      { product_id: 3, product_name: 'Starter Pack', sales_count: 89, quantity_sold: 134, revenue: 93800.00 },
      { product_id: 4, product_name: 'Add-on: Analytics', sales_count: 56, quantity_sold: 78, revenue: 46800.00 },
      { product_id: 5, product_name: 'Add-on: API Access', sales_count: 34, quantity_sold: 42, revenue: 29400.00 },
    ],
    agent_sales_performance: [
      { user_id: 1, user_name: 'Sarah Johnson', sales_count: 42, revenue: 245800.00 },
      { user_id: 2, user_name: 'Michael Chen', sales_count: 38, revenue: 218400.00 },
      { user_id: 3, user_name: 'Emily Davis', sales_count: 35, revenue: 189200.00 },
      { user_id: 4, user_name: 'James Wilson', sales_count: 29, revenue: 142500.00 },
      { user_id: 5, user_name: 'Ana Martinez', sales_count: 24, revenue: 96550.00 },
    ],
  },
};

export const mockMonthlyChartsData = {
  data: {
    year: 2026,
    monthly_overview: [
      { month: 'Jan', leads: 89, deals: 12 },
      { month: 'Feb', leads: 112, deals: 18 },
      { month: 'Mar', leads: 134, deals: 22 },
      { month: 'Apr', leads: 98, deals: 15 },
      { month: 'May', leads: 156, deals: 28 },
      { month: 'Jun', leads: 143, deals: 24 },
      { month: 'Jul', leads: 167, deals: 31 },
      { month: 'Aug', leads: 178, deals: 35 },
      { month: 'Sep', leads: 145, deals: 27 },
      { month: 'Oct', leads: 189, deals: 38 },
      { month: 'Nov', leads: 201, deals: 42 },
      { month: 'Dec', leads: 165, deals: 33 },
    ],
    revenue_metrics: {
      metrics: {
        monthly_deals_analysis: {
          monthly_data: {
            january:   { closed: { count: 12, total: 48200 },  lost: { count: 4, total: 15600 } },
            february:  { closed: { count: 18, total: 72400 },  lost: { count: 6, total: 22800 } },
            march:     { closed: { count: 22, total: 91300 },  lost: { count: 5, total: 19500 } },
            april:     { closed: { count: 15, total: 58700 },  lost: { count: 7, total: 28400 } },
            may:       { closed: { count: 28, total: 118500 }, lost: { count: 4, total: 16200 } },
            june:      { closed: { count: 24, total: 98200 },  lost: { count: 8, total: 34500 } },
            july:      { closed: { count: 31, total: 134800 }, lost: { count: 6, total: 24100 } },
            august:    { closed: { count: 35, total: 148600 }, lost: { count: 5, total: 21300 } },
            september: { closed: { count: 27, total: 112400 }, lost: { count: 9, total: 38700 } },
            october:   { closed: { count: 38, total: 167200 }, lost: { count: 7, total: 29800 } },
            november:  { closed: { count: 42, total: 189500 }, lost: { count: 3, total: 12400 } },
            december:  { closed: { count: 33, total: 142600 }, lost: { count: 6, total: 25100 } },
          },
        },
      },
    },
  },
};
