/**
 * MOCK DATA FOR COMPANIES, TASKS & CALENDAR
 * Temporary - remove when restoring API calls
 */

import { LeadCompany } from '@/types/leadCompany';
import { type ActivityTask } from '@/services/leadActivityApi';
import { type CalendarTask, type CalendarEvent, type CalendarEventsResponse } from '@/services/calendarApi';

// ─── Mock Lead Companies ─────────────────────────────────────────

export const mockLeadCompanies: LeadCompany[] = [
  {
    id: 1, legal_name: 'Tech Innovations Inc.', trade_name: 'TechInno', tax_id: '12-3456789',
    industry: 'Technology', company_size: '51-200', website: 'https://techinno.com',
    email: 'contact@techinno.com', phone: '+1 (415) 555-0101',
    city: 'San Francisco', state: 'CA', country: 'United States', postal_code: '94105',
    street: '123 Market St', number: '500',
    source: 'Referral', status: 'customer', notes: 'Key enterprise client since 2024',
    created_at: '2024-06-15T10:00:00Z', updated_at: '2026-02-20T14:30:00Z',
  },
  {
    id: 2, legal_name: 'Global Solutions LLC', trade_name: 'GlobalSol', tax_id: '98-7654321',
    industry: 'Consulting', company_size: '201-500', website: 'https://globalsol.io',
    email: 'info@globalsol.io', phone: '+1 (212) 555-0202',
    city: 'New York', state: 'NY', country: 'United States', postal_code: '10001',
    street: '456 Broadway', number: '12A',
    source: 'Google Ads', status: 'customer', notes: 'Multi-year consulting agreement',
    created_at: '2024-08-01T08:00:00Z', updated_at: '2026-02-18T09:15:00Z',
  },
  {
    id: 3, legal_name: 'StartupX Technologies', trade_name: 'StartupX', tax_id: '55-1234567',
    industry: 'SaaS', company_size: '11-50', website: 'https://startupx.dev',
    email: 'hello@startupx.dev', phone: '+1 (512) 555-0303',
    city: 'Austin', state: 'TX', country: 'United States', postal_code: '73301',
    street: '789 Tech Blvd',
    source: 'Meta Ads', status: 'lead', notes: 'Interested in enterprise plan',
    created_at: '2025-01-10T12:00:00Z', updated_at: '2026-02-21T16:45:00Z',
  },
  {
    id: 4, legal_name: 'Cloud Dynamics GmbH', trade_name: 'CloudDyn', tax_id: 'DE123456789',
    industry: 'Cloud Computing', company_size: '501-1000', website: 'https://clouddyn.de',
    email: 'sales@clouddyn.de', phone: '+49 30 55512345',
    city: 'Berlin', state: 'Berlin', country: 'Germany', postal_code: '10115',
    street: 'Friedrichstraße', number: '42',
    source: 'Organic', status: 'partner', notes: 'European distribution partner',
    created_at: '2024-11-20T09:00:00Z', updated_at: '2026-02-19T11:20:00Z',
  },
  {
    id: 5, legal_name: 'Data Insights Corp', trade_name: 'DataIns', tax_id: '33-9876543',
    industry: 'Data Analytics', company_size: '51-200', website: 'https://datainsights.co',
    email: 'team@datainsights.co', phone: '+1 (617) 555-0505',
    city: 'Boston', state: 'MA', country: 'United States', postal_code: '02101',
    street: '321 Analytics Way', number: '8',
    source: 'Direct', status: 'prospect', notes: 'Evaluating analytics platform',
    created_at: '2025-06-05T14:00:00Z', updated_at: '2026-02-22T08:00:00Z',
  },
  {
    id: 6, legal_name: 'Marketing Pro Ltda', trade_name: 'MktPro', tax_id: '44.555.666/0001-77',
    industry: 'Digital Marketing', company_size: '11-50', website: 'https://mktpro.com.br',
    email: 'contato@mktpro.com.br', phone: '+55 11 98765-4321',
    city: 'São Paulo', state: 'SP', country: 'Brazil', postal_code: '01310-100',
    street: 'Av. Paulista', number: '1500',
    source: 'Referral', status: 'customer', notes: 'LATAM marketing agency',
    created_at: '2025-03-12T10:00:00Z', updated_at: '2026-02-20T17:30:00Z',
  },
  {
    id: 7, legal_name: 'Innovation Labs SA', trade_name: 'InnoLabs',
    industry: 'R&D', company_size: '1-10', website: 'https://innolabs.es',
    email: 'info@innolabs.es', phone: '+34 91 555 0707',
    city: 'Madrid', state: 'Madrid', country: 'Spain', postal_code: '28001',
    street: 'Calle Gran Vía', number: '28',
    source: 'Google Ads', status: 'lead',
    created_at: '2025-09-01T11:00:00Z', updated_at: '2026-02-21T13:00:00Z',
  },
  {
    id: 8, legal_name: 'Apex Ventures Capital', trade_name: 'Apex VC', tax_id: '77-1112233',
    industry: 'Finance', company_size: '51-200', website: 'https://apexvc.com',
    email: 'invest@apexvc.com', phone: '+1 (305) 555-0808',
    city: 'Miami', state: 'FL', country: 'United States', postal_code: '33101',
    street: '100 Brickell Ave', number: '2200',
    source: 'Direct', status: 'partner', notes: 'Investment partner for Series B',
    created_at: '2024-07-25T09:00:00Z', updated_at: '2026-02-22T10:00:00Z',
  },
  {
    id: 9, legal_name: 'NovaTech Systems', trade_name: 'NovaTech',
    industry: 'IT Services', company_size: '201-500', website: 'https://novatech.io',
    email: 'support@novatech.io', phone: '+1 (404) 555-0909',
    city: 'Atlanta', state: 'GA', country: 'United States', postal_code: '30301',
    street: 'Peachtree St NE', number: '600',
    source: 'Organic', status: 'inactive', notes: 'Contract ended Q4 2025',
    created_at: '2024-03-15T08:00:00Z', updated_at: '2025-12-30T10:00:00Z',
  },
  {
    id: 10, legal_name: 'Synergy Digital Ltd', trade_name: 'SynergyD', tax_id: 'GB123456789',
    industry: 'E-commerce', company_size: '11-50', website: 'https://synergyd.co.uk',
    email: 'hello@synergyd.co.uk', phone: '+44 20 7946 0958',
    city: 'London', state: 'England', country: 'United Kingdom', postal_code: 'EC2A 1NT',
    street: 'Shoreditch High St', number: '75',
    source: 'Meta Ads', status: 'prospect', notes: 'Interested in e-commerce integration',
    created_at: '2025-11-08T12:00:00Z', updated_at: '2026-02-15T14:00:00Z',
  },
];

// ─── Mock Tasks (for TasksDashboard) ─────────────────────────────

const mockLead = (id: number, first: string, last: string) => ({
  id, first_name: first, last_name: last, email: `${first.toLowerCase()}@example.com`, funnel_id: 1, company_id: 1,
});

const mockUser = (id: number, name: string) => ({
  id, name, email: `${name.toLowerCase().replace(/ /g, '.')}@optomyze.com`,
});

export const mockActivityTasks: ActivityTask[] = [
  { id: 1, lead_id: 1, title: 'Follow up on proposal', description: 'Review pricing and send updated proposal', priority: 'high', status: 'pending', due_date: '2026-02-24', completed_at: null, assigned_to: 1, created_by: 2, reminder: 1, created_at: '2026-02-20T10:00:00Z', updated_at: '2026-02-20T10:00:00Z', lead: mockLead(1, 'Michael', 'Chen'), creator: mockUser(2, 'Ana Costa'), assignee: mockUser(1, 'Sarah Johnson') },
  { id: 2, lead_id: 2, title: 'Schedule product demo', description: 'Set up demo for enterprise suite', priority: 'urgent', status: 'in_progress', due_date: '2026-02-23', completed_at: null, assigned_to: 2, created_by: 1, reminder: 1, created_at: '2026-02-19T09:00:00Z', updated_at: '2026-02-22T14:00:00Z', lead: mockLead(2, 'Sarah', 'Williams'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(2, 'Mike Peters') },
  { id: 3, lead_id: 3, title: 'Send contract for review', description: 'Final contract draft needs approval', priority: 'high', status: 'pending', due_date: '2026-02-25', completed_at: null, assigned_to: 1, created_by: 1, reminder: 0, created_at: '2026-02-21T11:00:00Z', updated_at: '2026-02-21T11:00:00Z', lead: mockLead(3, 'David', 'Rodriguez'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(1, 'Sarah Johnson') },
  { id: 4, lead_id: 4, title: 'Collect payment information', description: null, priority: 'medium', status: 'pending', due_date: '2026-02-26', completed_at: null, assigned_to: 3, created_by: 2, reminder: 0, created_at: '2026-02-18T08:00:00Z', updated_at: '2026-02-18T08:00:00Z', lead: mockLead(4, 'Emma', 'Thompson'), creator: mockUser(2, 'Ana Costa'), assignee: mockUser(3, 'Tom Richards') },
  { id: 5, lead_id: 5, title: 'Onboarding call', description: 'Walk through platform setup and integrations', priority: 'medium', status: 'in_progress', due_date: '2026-02-24', completed_at: null, assigned_to: 2, created_by: 2, reminder: 1, created_at: '2026-02-17T10:00:00Z', updated_at: '2026-02-22T10:00:00Z', lead: mockLead(5, 'James', 'Wilson'), creator: mockUser(2, 'Ana Costa'), assignee: mockUser(2, 'Mike Peters') },
  { id: 6, lead_id: 6, title: 'Prepare quarterly report', description: 'Generate Q1 performance report for client', priority: 'low', status: 'pending', due_date: '2026-03-01', completed_at: null, assigned_to: 1, created_by: 1, reminder: 0, created_at: '2026-02-20T14:00:00Z', updated_at: '2026-02-20T14:00:00Z', lead: mockLead(6, 'Lisa', 'Anderson'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(1, 'Sarah Johnson') },
  { id: 7, lead_id: 7, title: 'Technical requirements review', description: 'Review API integration requirements', priority: 'high', status: 'in_progress', due_date: '2026-02-23', completed_at: null, assigned_to: 3, created_by: 1, reminder: 1, created_at: '2026-02-15T09:00:00Z', updated_at: '2026-02-22T16:00:00Z', lead: mockLead(7, 'Robert', 'Davis'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(3, 'Tom Richards') },
  { id: 8, lead_id: 8, title: 'Negotiate pricing terms', description: 'Discuss volume discount for annual plan', priority: 'urgent', status: 'pending', due_date: '2026-02-24', completed_at: null, assigned_to: 1, created_by: 2, reminder: 1, created_at: '2026-02-21T08:00:00Z', updated_at: '2026-02-21T08:00:00Z', lead: mockLead(8, 'Jennifer', 'Brown'), creator: mockUser(2, 'Ana Costa'), assignee: mockUser(1, 'Sarah Johnson') },
  { id: 9, lead_id: 9, title: 'Update CRM records', description: 'Sync latest contact info from LinkedIn', priority: 'low', status: 'completed', due_date: '2026-02-20', completed_at: '2026-02-20T15:00:00Z', assigned_to: 2, created_by: 2, reminder: 0, created_at: '2026-02-18T10:00:00Z', updated_at: '2026-02-20T15:00:00Z', lead: mockLead(9, 'Christopher', 'Lee'), creator: mockUser(2, 'Ana Costa'), assignee: mockUser(2, 'Mike Peters') },
  { id: 10, lead_id: 10, title: 'Send welcome package', description: 'Email onboarding materials and credentials', priority: 'medium', status: 'completed', due_date: '2026-02-19', completed_at: '2026-02-19T11:00:00Z', assigned_to: 3, created_by: 1, reminder: 0, created_at: '2026-02-17T09:00:00Z', updated_at: '2026-02-19T11:00:00Z', lead: mockLead(10, 'Amanda', 'Johnson'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(3, 'Tom Richards') },
  { id: 11, lead_id: 1, title: 'Renewal reminder call', description: 'Contract renewal in 30 days', priority: 'medium', status: 'cancelled', due_date: '2026-02-22', completed_at: null, assigned_to: 1, created_by: 1, reminder: 1, created_at: '2026-02-10T08:00:00Z', updated_at: '2026-02-22T09:00:00Z', lead: mockLead(1, 'Michael', 'Chen'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(1, 'Sarah Johnson') },
  { id: 12, lead_id: 3, title: 'Competitor analysis', description: 'Prepare comparison document for client meeting', priority: 'low', status: 'completed', due_date: '2026-02-18', completed_at: '2026-02-18T16:00:00Z', assigned_to: 2, created_by: 1, reminder: 0, created_at: '2026-02-14T10:00:00Z', updated_at: '2026-02-18T16:00:00Z', lead: mockLead(3, 'David', 'Rodriguez'), creator: mockUser(1, 'Sarah Johnson'), assignee: mockUser(2, 'Mike Peters') },
];

// ─── Mock Calendar Events & Tasks ────────────────────────────────

export const mockCalendarData: CalendarEventsResponse = {
  tasks: [
    { id: 1, lead_id: 1, title: 'Follow up on proposal', description: 'Review pricing and send updated proposal', priority: 'high', status: 'pending', due_date: '2026-02-24', completed_at: null, assigned_to: 1, created_by: 2, created_at: '2026-02-20T10:00:00Z', updated_at: '2026-02-20T10:00:00Z', reminder: 1, lead: { id: 1, first_name: 'Michael', last_name: 'Chen', email: 'michael@tech.com', funnel_id: 1 }, assignee: { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com' }, creator: { id: 2, name: 'Ana Costa', email: 'ana@optomyze.com' } },
    { id: 2, lead_id: 2, title: 'Schedule product demo', description: 'Enterprise suite demo', priority: 'urgent', status: 'in_progress', due_date: '2026-02-23', completed_at: null, assigned_to: 2, created_by: 1, created_at: '2026-02-19T09:00:00Z', updated_at: '2026-02-22T14:00:00Z', reminder: 1, lead: { id: 2, first_name: 'Sarah', last_name: 'Williams', email: 'sarah@global.com', funnel_id: 1 }, assignee: { id: 2, name: 'Mike Peters', email: 'mike@optomyze.com' }, creator: { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com' } },
    { id: 3, lead_id: 3, title: 'Send contract for review', description: 'Final contract needs approval', priority: 'high', status: 'pending', due_date: '2026-02-25', completed_at: null, assigned_to: 1, created_by: 1, created_at: '2026-02-21T11:00:00Z', updated_at: '2026-02-21T11:00:00Z', reminder: 0, lead: { id: 3, first_name: 'David', last_name: 'Rodriguez', email: 'david@startup.com', funnel_id: 1 }, assignee: { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com' }, creator: { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com' } },
    { id: 4, lead_id: 5, title: 'Onboarding call', description: 'Platform setup walkthrough', priority: 'medium', status: 'in_progress', due_date: '2026-02-26', completed_at: null, assigned_to: 2, created_by: 2, created_at: '2026-02-17T10:00:00Z', updated_at: '2026-02-22T10:00:00Z', reminder: 1, lead: { id: 5, first_name: 'James', last_name: 'Wilson', email: 'james@future.com', funnel_id: 1 }, assignee: { id: 2, name: 'Mike Peters', email: 'mike@optomyze.com' }, creator: { id: 2, name: 'Ana Costa', email: 'ana@optomyze.com' } },
    { id: 5, lead_id: 8, title: 'Negotiate pricing terms', description: 'Volume discount discussion', priority: 'urgent', status: 'pending', due_date: '2026-02-27', completed_at: null, assigned_to: 1, created_by: 2, created_at: '2026-02-21T08:00:00Z', updated_at: '2026-02-21T08:00:00Z', reminder: 1, lead: { id: 8, first_name: 'Jennifer', last_name: 'Brown', email: 'jen@cloud.com', funnel_id: 1 }, assignee: { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com' }, creator: { id: 2, name: 'Ana Costa', email: 'ana@optomyze.com' } },
  ],
  events: [
    { id: 1, company_id: 1, title: 'Team Standup', description: 'Daily engineering standup', type: 'meeting', start_at: '2026-02-23T09:00:00Z', end_at: '2026-02-23T09:30:00Z', all_day: false, reminder: 1, created_at: '2026-02-01T10:00:00Z', updated_at: '2026-02-01T10:00:00Z' },
    { id: 2, company_id: 1, title: 'Client Discovery Call', description: 'Initial requirements gathering with TechInno', type: 'call', start_at: '2026-02-24T14:00:00Z', end_at: '2026-02-24T15:00:00Z', all_day: false, reminder: 1, created_at: '2026-02-18T09:00:00Z', updated_at: '2026-02-18T09:00:00Z' },
    { id: 3, company_id: 1, title: 'Q1 Planning Session', description: 'Quarterly goals and OKR review', type: 'meeting', start_at: '2026-02-25T10:00:00Z', end_at: '2026-02-25T12:00:00Z', all_day: false, reminder: 1, created_at: '2026-02-10T08:00:00Z', updated_at: '2026-02-10T08:00:00Z' },
    { id: 4, company_id: 1, title: 'Proposal Deadline', description: 'Enterprise package proposal due', type: 'deadline', start_at: '2026-02-26T17:00:00Z', end_at: null, all_day: false, reminder: 1, created_at: '2026-02-15T10:00:00Z', updated_at: '2026-02-15T10:00:00Z' },
    { id: 5, company_id: 1, title: 'Product Launch Day', description: 'V2.0 platform launch', type: 'other', start_at: '2026-02-28T00:00:00Z', end_at: '2026-02-28T23:59:59Z', all_day: true, reminder: 1, created_at: '2026-01-15T10:00:00Z', updated_at: '2026-01-15T10:00:00Z' },
    { id: 6, company_id: 1, title: 'Invoice Payment Reminder', description: 'Outstanding invoice for GlobalSol', type: 'reminder', start_at: '2026-02-27T09:00:00Z', end_at: null, all_day: false, reminder: 1, created_at: '2026-02-20T08:00:00Z', updated_at: '2026-02-20T08:00:00Z' },
    { id: 7, company_id: 1, title: 'Board Meeting', description: 'Monthly board review', type: 'meeting', start_at: '2026-02-23T15:00:00Z', end_at: '2026-02-23T17:00:00Z', all_day: false, reminder: 1, created_at: '2026-02-05T10:00:00Z', updated_at: '2026-02-05T10:00:00Z' },
    { id: 8, company_id: 1, title: 'Sales Pipeline Review', description: 'Weekly pipeline check-in', type: 'call', start_at: '2026-02-24T10:00:00Z', end_at: '2026-02-24T10:45:00Z', all_day: false, reminder: 0, created_at: '2026-02-19T12:00:00Z', updated_at: '2026-02-19T12:00:00Z' },
  ],
};
