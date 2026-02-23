/**
 * MOCK FUNNEL DATA FOR SCREENSHOTS
 * 
 * Realistic mock data for sales and deal funnels with leads/deals
 * Temporary - remove when restoring API calls
 */

const names = [
  'Michael Chen', 'Sarah Williams', 'David Rodriguez', 'Emma Thompson', 'James Wilson',
  'Lisa Anderson', 'Robert Davis', 'Jennifer Brown', 'Christopher Lee', 'Amanda Johnson',
  'Mark Garcia', 'Jessica Martinez', 'Daniel Miller', 'Ashley Taylor', 'Matthew White',
  'Lauren Harris', 'Andrew Clark', 'Nicole Lewis', 'Kevin Young', 'Stephanie Walker',
  'Ryan Mitchell', 'Megan Scott', 'Brandon Hall', 'Samantha King', 'Tyler Wright',
];

const companies = [
  'Tech Innovations Inc.', 'Digital Solutions LLC', 'StartupX', 'Global Corp',
  'Future Systems', 'Smart Analytics', 'Cloud Dynamics', 'Data Insights',
  'Innovation Labs', 'Growth Partners', 'Apex Ventures', 'NovaTech',
  'Synergy Digital', 'Quantum Solutions', 'BlueWave Media',
];

const titles = [
  'CEO', 'CTO', 'Marketing Director', 'Sales Manager', 'VP of Sales',
  'Founder', 'Head of Marketing', 'Business Development', 'Product Manager',
  'Director of Operations', 'CMO', 'VP of BD',
];

const sources = ['Meta Ads', 'Google Ads', 'Organic', 'Referral', 'Direct'];

const tagPool = [
  { id: 1, name: 'Hot Lead', color: '#EF4444' },
  { id: 2, name: 'Enterprise', color: '#3B82F6' },
  { id: 3, name: 'Mid-Market', color: '#8B5CF6' },
  { id: 4, name: 'Follow-up', color: '#F59E0B' },
  { id: 5, name: 'High Value', color: '#10B981' },
  { id: 6, name: 'Quick Win', color: '#06B6D4' },
  { id: 7, name: 'Demo Scheduled', color: '#EC4899' },
  { id: 8, name: 'Proposal Sent', color: '#6366F1' },
];

const assignedUsers = [
  { id: 1, name: 'Sarah Johnson' },
  { id: 2, name: 'Mike Peters' },
  { id: 3, name: 'Ana Costa' },
  { id: 4, name: 'Tom Richards' },
];

function generateLead(index: number, stageId: number) {
  const name = names[index % names.length];
  const [first, ...rest] = name.split(' ');
  const last = rest.join(' ');
  const company = companies[index % companies.length];
  const assigned = assignedUsers[index % assignedUsers.length];
  const numTags = (index % 3) + 1;
  const leadTags = tagPool.slice(index % tagPool.length, (index % tagPool.length) + numTags);

  return {
    id: stageId * 1000 + index + 1,
    first_name: first,
    last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace(/ /g, '')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    phone: `+1 (${400 + index}) 555-${String(1000 + index).slice(-4)}`,
    source_platform: sources[index % sources.length],
    ai_score: String(60 + (index * 7) % 40),
    value_estimated: String((10000 + index * 5500) % 95000 + 5000),
    currency: 'USD',
    priority: (['high', 'medium', 'low'] as const)[index % 3],
    tags: leadTags,
    notes: null,
    assigned_to: assigned.id,
    assigned_user: assigned,
    custom_fields: { industry: company, title: titles[index % titles.length] },
    created_at: new Date(Date.now() - (index + 1) * 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - (index % 5) * 3600000).toISOString(),
    platform_data: null,
    initial_message: null,
    contact_methods: ['email', 'phone'],
    preferred_contact_method: 'email',
  };
}

// ─── Sales Funnel Mock ───────────────────────────────────────────

export function getMockSalesFunnelData(funnelId: string) {
  const stages = [
    { id: 101, name: 'New Leads', order: 1, color: '#3B82F6', type: 'open', leadCount: 12 },
    { id: 102, name: 'Contacted', order: 2, color: '#8B5CF6', type: 'open', leadCount: 8 },
    { id: 103, name: 'Qualified', order: 3, color: '#F59E0B', type: 'open', leadCount: 6 },
    { id: 104, name: 'Proposal Sent', order: 4, color: '#EC4899', type: 'open', leadCount: 4 },
    { id: 105, name: 'Negotiation', order: 5, color: '#06B6D4', type: 'open', leadCount: 3 },
    { id: 106, name: 'Closed Won', order: 6, color: '#10B981', type: 'won', leadCount: 5 },
    { id: 107, name: 'Lost', order: 7, color: '#EF4444', type: 'lost', leadCount: 4 },
  ];

  return {
    funnel: {
      id: funnelId,
      name: 'B2B Enterprise Sales',
      description: 'High-value enterprise deals pipeline',
      currency: 'USD',
      stages: stages.map(stage => ({
        ...stage,
        value_estimated: stage.leadCount * (15000 + Math.floor(Math.random() * 30000)),
        active_leads: Array.from({ length: stage.leadCount }, (_, i) => generateLead(i + stage.order * 10, stage.id)),
      })),
    },
    tags: tagPool,
  };
}

// ─── Deal Funnel Mock ────────────────────────────────────────────

function generateDeal(index: number, stageId: number) {
  const lead = generateLead(index, stageId);
  const dealNames = [
    'Annual SaaS License', 'Cloud Migration Project', 'Data Analytics Suite',
    'Enterprise Security Package', 'Digital Transformation', 'API Platform License',
    'Marketing Automation', 'Custom Integration', 'Support & Maintenance',
    'Infrastructure Upgrade', 'AI/ML Implementation', 'Staff Training Program',
  ];

  return {
    ...lead,
    deal_name: dealNames[index % dealNames.length],
    value_estimated: String((25000 + index * 12000) % 200000 + 15000),
    products: index % 3 === 0 ? [
      { id: 1, name: 'Pro License', quantity: 1, unit_price: 5000 },
      { id: 2, name: 'Support Plan', quantity: 1, unit_price: 2000 },
    ] : [],
    charges: index % 4 === 0 ? [
      { id: 1, description: 'Setup fee', amount: 3000 },
    ] : [],
  };
}

export function getMockDealFunnelData(funnelId: string) {
  const stages = [
    { id: 201, name: 'Discovery', order: 1, color: '#3B82F6', type: 'open', dealCount: 8 },
    { id: 202, name: 'Proposal', order: 2, color: '#8B5CF6', type: 'open', dealCount: 5 },
    { id: 203, name: 'Negotiation', order: 3, color: '#F59E0B', type: 'open', dealCount: 4 },
    { id: 204, name: 'Contract Review', order: 4, color: '#EC4899', type: 'open', dealCount: 3 },
    { id: 205, name: 'Closed Won', order: 5, color: '#10B981', type: 'won', dealCount: 6 },
    { id: 206, name: 'Lost', order: 6, color: '#EF4444', type: 'lost', dealCount: 2 },
  ];

  return {
    funnel: {
      id: funnelId,
      name: 'Enterprise Deals',
      description: 'Large contract negotiations pipeline',
      currency: 'USD',
      stages: stages.map(stage => ({
        ...stage,
        value_estimated: stage.dealCount * (20000 + Math.floor(Math.random() * 50000)),
        active_leads: Array.from({ length: stage.dealCount }, (_, i) => generateDeal(i + stage.order * 10, stage.id)),
      })),
    },
    tags: tagPool,
  };
}
