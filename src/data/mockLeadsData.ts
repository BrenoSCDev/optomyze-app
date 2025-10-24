/**
 * MOCK LEADS DATA
 * 
 * Comprehensive mock data for different sales funnels with realistic lead distributions
 */

import { Lead, SalesFunnel } from '@/types/leads';

// Generate mock leads for different funnels
const generateLeads = (count: number, funnel: string): Lead[] => {
  const leads: Lead[] = [];
  const names = [
    'Michael Chen', 'Sarah Williams', 'David Rodriguez', 'Emma Thompson', 'James Wilson',
    'Lisa Anderson', 'Robert Davis', 'Jennifer Brown', 'Christopher Lee', 'Amanda Johnson',
    'Mark Garcia', 'Jessica Martinez', 'Daniel Miller', 'Ashley Taylor', 'Matthew White',
    'Lauren Harris', 'Andrew Clark', 'Nicole Lewis', 'Kevin Young', 'Stephanie Walker'
  ];
  
  const companies = [
    'Tech Innovations Inc.', 'Digital Solutions LLC', 'StartupX', 'Global Corp',
    'Future Systems', 'Smart Analytics', 'Cloud Dynamics', 'Data Insights',
    'Innovation Labs', 'Growth Partners', 'Venture Capital', 'Enterprise Solutions',
    'Marketing Pro', 'Sales Force', 'Business Intelligence', 'Strategy Group'
  ];
  
  const titles = [
    'CEO', 'CTO', 'Marketing Director', 'Sales Manager', 'VP of Sales',
    'Founder', 'Head of Marketing', 'Business Development', 'Product Manager',
    'Director of Operations', 'Chief Marketing Officer', 'VP of Business Development'
  ];
  
  const sources = ['Meta Ads', 'Google Ads', 'Organic', 'Referral', 'Direct'] as const;
  
  const tags = [
    'Hot Lead', 'Enterprise', 'Mid-Market', 'Startup', 'Follow-up',
    'Demo Scheduled', 'Proposal Sent', 'High Value', 'Quick Win', 'Long Term'
  ];

  for (let i = 0; i < count; i++) {
    leads.push({
      id: `${funnel}-lead-${i + 1}`,
      name: names[i % names.length],
      email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@${companies[i % companies.length].toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company: companies[i % companies.length],
      title: titles[i % titles.length],
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      value: Math.floor(Math.random() * 90000) + 10000, // $10k-$100k
      source: sources[Math.floor(Math.random() * sources.length)],
      tags: tags.slice(0, Math.floor(Math.random() * 3) + 1),
      lastActivity: `${Math.floor(Math.random() * 5) + 1} ${Math.random() > 0.5 ? 'hours' : 'days'} ago`,
      priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
      stage: '',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Sarah Johnson'
    });
  }
  
  return leads;
};

// B2B Enterprise Sales Funnel
export const b2bEnterpriseFunnel: SalesFunnel = {
  id: 'b2b-enterprise',
  name: 'B2B Enterprise Sales',
  totalLeads: 347,
  columns: [
    {
      id: 'new-leads',
      title: 'New Leads',
      leads: generateLeads(45, 'b2b').map(lead => ({ ...lead, stage: 'new-leads' })),
    },
    {
      id: 'contacted',
      title: 'Contacted',
      leads: generateLeads(67, 'b2b').map(lead => ({ ...lead, stage: 'contacted' })),
    },
    {
      id: 'qualified',
      title: 'Qualified',
      leads: generateLeads(89, 'b2b').map(lead => ({ ...lead, stage: 'qualified' })),
    },
    {
      id: 'proposal-sent',
      title: 'Proposal Sent',
      leads: generateLeads(34, 'b2b').map(lead => ({ ...lead, stage: 'proposal-sent' })),
    },
    {
      id: 'negotiation',
      title: 'Negotiation',
      leads: generateLeads(23, 'b2b').map(lead => ({ ...lead, stage: 'negotiation' })),
    },
    {
      id: 'closed-won',
      title: 'Closed Won',
      leads: generateLeads(12, 'b2b').map(lead => ({ ...lead, stage: 'closed-won' })),
      color: 'green'
    },
    {
      id: 'lost',
      title: 'Lost',
      leads: generateLeads(77, 'b2b').map(lead => ({ ...lead, stage: 'lost' })),
      color: 'red'
    }
  ]
};

// E-commerce Conversion Funnel
export const ecommerceFunnel: SalesFunnel = {
  id: 'ecommerce-conversion',
  name: 'E-commerce Conversion',
  totalLeads: 892,
  columns: [
    {
      id: 'visitor',
      title: 'Visitor',
      leads: generateLeads(234, 'ecom').map(lead => ({ ...lead, stage: 'visitor' })),
    },
    {
      id: 'added-to-cart',
      title: 'Added to Cart',
      leads: generateLeads(156, 'ecom').map(lead => ({ ...lead, stage: 'added-to-cart' })),
    },
    {
      id: 'started-checkout',
      title: 'Started Checkout',
      leads: generateLeads(89, 'ecom').map(lead => ({ ...lead, stage: 'started-checkout' })),
    },
    {
      id: 'payment-info',
      title: 'Payment Info',
      leads: generateLeads(45, 'ecom').map(lead => ({ ...lead, stage: 'payment-info' })),
    },
    {
      id: 'purchase',
      title: 'Purchase',
      leads: generateLeads(67, 'ecom').map(lead => ({ ...lead, stage: 'purchase' })),
      color: 'green'
    },
    {
      id: 'upsell',
      title: 'Upsell Opportunity',
      leads: generateLeads(23, 'ecom').map(lead => ({ ...lead, stage: 'upsell' })),
    },
    {
      id: 'churned',
      title: 'Churned',
      leads: generateLeads(278, 'ecom').map(lead => ({ ...lead, stage: 'churned' })),
      color: 'red'
    }
  ]
};

// SaaS Trial to Paid Funnel
export const saasFunnel: SalesFunnel = {
  id: 'saas-trial',
  name: 'SaaS Trial to Paid',
  totalLeads: 156,
  columns: [
    {
      id: 'trial-signup',
      title: 'Trial Signup',
      leads: generateLeads(45, 'saas').map(lead => ({ ...lead, stage: 'trial-signup' })),
    },
    {
      id: 'activated',
      title: 'Activated',
      leads: generateLeads(34, 'saas').map(lead => ({ ...lead, stage: 'activated' })),
    },
    {
      id: 'engaged',
      title: 'Engaged',
      leads: generateLeads(28, 'saas').map(lead => ({ ...lead, stage: 'engaged' })),
    },
    {
      id: 'converted',
      title: 'Converted',
      leads: generateLeads(21, 'saas').map(lead => ({ ...lead, stage: 'converted' })),
      color: 'green'
    },
    {
      id: 'churned',
      title: 'Churned',
      leads: generateLeads(28, 'saas').map(lead => ({ ...lead, stage: 'churned' })),
      color: 'red'
    }
  ]
};

// Real Estate Prospects Funnel
export const realEstateFunnel: SalesFunnel = {
  id: 'real-estate',
  name: 'Real Estate Prospects',
  totalLeads: 234,
  columns: [
    {
      id: 'inquiry',
      title: 'Inquiry',
      leads: generateLeads(67, 'realestate').map(lead => ({ ...lead, stage: 'inquiry' })),
    },
    {
      id: 'viewing-scheduled',
      title: 'Viewing Scheduled',
      leads: generateLeads(45, 'realestate').map(lead => ({ ...lead, stage: 'viewing-scheduled' })),
    },
    {
      id: 'viewed',
      title: 'Viewed',
      leads: generateLeads(56, 'realestate').map(lead => ({ ...lead, stage: 'viewed' })),
    },
    {
      id: 'offer-made',
      title: 'Offer Made',
      leads: generateLeads(23, 'realestate').map(lead => ({ ...lead, stage: 'offer-made' })),
    },
    {
      id: 'sold',
      title: 'Sold',
      leads: generateLeads(15, 'realestate').map(lead => ({ ...lead, stage: 'sold' })),
      color: 'green'
    },
    {
      id: 'not-interested',
      title: 'Not Interested',
      leads: generateLeads(28, 'realestate').map(lead => ({ ...lead, stage: 'not-interested' })),
      color: 'red'
    }
  ]
};

// Digital Marketing Leads Funnel
export const digitalMarketingFunnel: SalesFunnel = {
  id: 'digital-marketing',
  name: 'Digital Marketing Leads',
  totalLeads: 567,
  columns: [
    {
      id: 'lead-magnet',
      title: 'Lead Magnet',
      leads: generateLeads(123, 'digital').map(lead => ({ ...lead, stage: 'lead-magnet' })),
    },
    {
      id: 'email-sequence',
      title: 'Email Sequence',
      leads: generateLeads(89, 'digital').map(lead => ({ ...lead, stage: 'email-sequence' })),
    },
    {
      id: 'consultation-booked',
      title: 'Consultation Booked',
      leads: generateLeads(67, 'digital').map(lead => ({ ...lead, stage: 'consultation-booked' })),
    },
    {
      id: 'proposal-sent',
      title: 'Proposal Sent',
      leads: generateLeads(45, 'digital').map(lead => ({ ...lead, stage: 'proposal-sent' })),
    },
    {
      id: 'client',
      title: 'Client',
      leads: generateLeads(34, 'digital').map(lead => ({ ...lead, stage: 'client' })),
      color: 'green'
    },
    {
      id: 'declined',
      title: 'Declined',
      leads: generateLeads(209, 'digital').map(lead => ({ ...lead, stage: 'declined' })),
      color: 'red'
    }
  ]
};

export const salesFunnels = {
  'b2b-enterprise': b2bEnterpriseFunnel,
  'ecommerce-conversion': ecommerceFunnel,
  'saas-trial': saasFunnel,
  'real-estate': realEstateFunnel,
  'digital-marketing': digitalMarketingFunnel
};