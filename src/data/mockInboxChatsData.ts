/**
 * MOCK WHATSAPP & OPTOMYZE INBOX DATA
 * Temporary - remove when restoring API calls
 */

import { WhatsAppChat } from '@/types/whatsappChat';
import { ChatConversation, ChatContact, ChatMessage } from '@/services/inboxChatApi';

// ─── Mock WhatsApp Chats ─────────────────────────────────────────

const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000).toISOString();
const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();

export const mockWhatsAppChats: WhatsAppChat[] = [
  {
    id: 1, company_id: 1, whatsapp_instance_id: 1, lead_id: 1, remote_jid: '5511999990001@s.whatsapp.net',
    phone_number: '+55 11 99999-0001', is_group: 0, is_archived: 0,
    last_message_at: h(0.5), created_at: d(15), updated_at: h(0.5),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 1, company_id: 1, first_name: 'Michael', last_name: 'Chen', phone: '+5511999990001', funnel_id: 1, stage_id: 101, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 101, name: 'New Leads' } },
    messages: [
      { id: 1, whatsapp_evo_chat_id: 1, direction: 'incoming', type: 'text', text: 'Hi, I saw your ad and I\'m interested in the enterprise plan.', metadata: null, status: 'read', sent_at: h(3), message_mode: 'external' },
      { id: 2, whatsapp_evo_chat_id: 1, direction: 'outgoing', type: 'text', text: 'Hello Michael! Great to hear from you. Let me send you our pricing details.', metadata: null, status: 'delivered', sent_at: h(2.5), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 3, whatsapp_evo_chat_id: 1, direction: 'outgoing', type: 'document', text: null, metadata: null, media_url: '/docs/pricing.pdf', media_mime: 'application/pdf', media_size: 245000, status: 'delivered', sent_at: h(2.4), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 4, whatsapp_evo_chat_id: 1, direction: 'incoming', type: 'text', text: 'Thanks! I\'ll review it and get back to you. Can we schedule a call for tomorrow?', metadata: null, status: 'read', sent_at: h(1), message_mode: 'external' },
      { id: 5, whatsapp_evo_chat_id: 1, direction: 'outgoing', type: 'text', text: 'Absolutely! How about 2pm? I\'ll send you a calendar invite.', metadata: null, status: 'delivered', sent_at: h(0.5), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
    ],
  },
  {
    id: 2, company_id: 1, whatsapp_instance_id: 1, lead_id: 2, remote_jid: '5511999990002@s.whatsapp.net',
    phone_number: '+55 11 99999-0002', is_group: 0, is_archived: 0,
    last_message_at: h(2), created_at: d(10), updated_at: h(2),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 2, company_id: 1, first_name: 'Sarah', last_name: 'Williams', phone: '+5511999990002', funnel_id: 1, stage_id: 103, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 103, name: 'Qualified' } },
    messages: [
      { id: 10, whatsapp_evo_chat_id: 2, direction: 'incoming', type: 'text', text: 'Good morning! Following up on the proposal we discussed last week.', metadata: null, status: 'read', sent_at: h(24), message_mode: 'external' },
      { id: 11, whatsapp_evo_chat_id: 2, direction: 'outgoing', type: 'text', text: 'Hi Sarah! Yes, the proposal is ready. Let me share it with you.', metadata: null, status: 'delivered', sent_at: h(23), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 12, whatsapp_evo_chat_id: 2, direction: 'incoming', type: 'text', text: 'Perfect! Also, could you include the API integration costs?', metadata: null, status: 'read', sent_at: h(5), message_mode: 'external' },
      { id: 13, whatsapp_evo_chat_id: 2, direction: 'outgoing', type: 'text', text: 'Sure thing! I\'ll update the proposal and send it by EOD.', metadata: null, status: 'delivered', sent_at: h(4), user_id: 2, user: { id: 2, name: 'Mike Peters' }, message_mode: 'external' },
      { id: 14, whatsapp_evo_chat_id: 2, direction: 'outgoing', type: 'text', text: 'Internal note: Sarah is decision maker, budget approved by their CFO.', metadata: null, status: 'delivered', sent_at: h(3.5), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'internal' },
      { id: 15, whatsapp_evo_chat_id: 2, direction: 'incoming', type: 'text', text: 'Great, looking forward to it! 🙂', metadata: null, status: 'read', sent_at: h(2), message_mode: 'external' },
    ],
  },
  {
    id: 3, company_id: 1, whatsapp_instance_id: 1, lead_id: 3, remote_jid: '5511999990003@s.whatsapp.net',
    phone_number: '+55 11 99999-0003', is_group: 0, is_archived: 0,
    last_message_at: h(6), created_at: d(5), updated_at: h(6),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 3, company_id: 1, first_name: 'David', last_name: 'Rodriguez', phone: '+5511999990003', funnel_id: 1, stage_id: 104, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 104, name: 'Proposal Sent' } },
    messages: [
      { id: 20, whatsapp_evo_chat_id: 3, direction: 'incoming', type: 'text', text: 'Hey, we reviewed the proposal internally and have some questions.', metadata: null, status: 'read', sent_at: h(48), message_mode: 'external' },
      { id: 21, whatsapp_evo_chat_id: 3, direction: 'outgoing', type: 'text', text: 'Of course David! What would you like to know?', metadata: null, status: 'delivered', sent_at: h(47), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 22, whatsapp_evo_chat_id: 3, direction: 'incoming', type: 'audio', text: null, metadata: null, media_url: '/audio/question.ogg', media_mime: 'audio/ogg', media_size: 85000, status: 'read', sent_at: h(10), message_mode: 'external' },
      { id: 23, whatsapp_evo_chat_id: 3, direction: 'outgoing', type: 'text', text: 'Great question! Yes, we support multi-tenant architecture. I\'ll prepare a technical doc for your team.', metadata: null, status: 'delivered', sent_at: h(8), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 24, whatsapp_evo_chat_id: 3, direction: 'incoming', type: 'text', text: 'That would be very helpful. Our CTO wants to review it before we proceed.', metadata: null, status: 'read', sent_at: h(6), message_mode: 'external' },
    ],
  },
  {
    id: 4, company_id: 1, whatsapp_instance_id: 1, lead_id: 4, remote_jid: '5511999990004@s.whatsapp.net',
    phone_number: '+55 11 99999-0004', is_group: 0, is_archived: 0,
    last_message_at: h(12), created_at: d(20), updated_at: h(12),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 4, company_id: 1, first_name: 'Emma', last_name: 'Thompson', phone: '+5511999990004', funnel_id: 1, stage_id: 105, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 105, name: 'Negotiation' } },
    messages: [
      { id: 30, whatsapp_evo_chat_id: 4, direction: 'incoming', type: 'text', text: 'We\'re ready to move forward! Can you send the contract?', metadata: null, status: 'read', sent_at: h(24), message_mode: 'external' },
      { id: 31, whatsapp_evo_chat_id: 4, direction: 'outgoing', type: 'text', text: 'Wonderful news Emma! 🎉 I\'ll have the contract ready by tomorrow morning.', metadata: null, status: 'delivered', sent_at: h(23), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 32, whatsapp_evo_chat_id: 4, direction: 'incoming', type: 'location', text: null, metadata: null, latitude: 40.7128, longitude: -74.0060, status: 'read', sent_at: h(15), message_mode: 'external' },
      { id: 33, whatsapp_evo_chat_id: 4, direction: 'incoming', type: 'text', text: 'That\'s our office location for the signing meeting. Can we meet Thursday at 10am?', metadata: null, status: 'read', sent_at: h(14), message_mode: 'external' },
      { id: 34, whatsapp_evo_chat_id: 4, direction: 'outgoing', type: 'text', text: 'Thursday works! I\'ll be there at 10am sharp. Looking forward to it!', metadata: null, status: 'delivered', sent_at: h(12), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
    ],
  },
  {
    id: 5, company_id: 1, whatsapp_instance_id: 1, lead_id: 5, remote_jid: '5511999990005@s.whatsapp.net',
    phone_number: '+55 11 99999-0005', is_group: 0, is_archived: 0,
    last_message_at: d(1), created_at: d(30), updated_at: d(1),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 5, company_id: 1, first_name: 'James', last_name: 'Wilson', phone: '+5511999990005', funnel_id: 1, stage_id: 102, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 102, name: 'Contacted' } },
    messages: [
      { id: 40, whatsapp_evo_chat_id: 5, direction: 'outgoing', type: 'text', text: 'Hi James! This is Sarah from Optomyze. We noticed you downloaded our whitepaper. Would you like to learn more about our platform?', metadata: null, status: 'delivered', sent_at: d(3), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 41, whatsapp_evo_chat_id: 5, direction: 'incoming', type: 'text', text: 'Hey Sarah! Yes, the whitepaper was very informative. What plans do you offer?', metadata: null, status: 'read', sent_at: d(2), message_mode: 'external' },
      { id: 42, whatsapp_evo_chat_id: 5, direction: 'outgoing', type: 'text', text: 'We have three tiers: Starter, Pro, and Enterprise. I\'d recommend Pro based on your company size. Want me to set up a quick demo?', metadata: null, status: 'delivered', sent_at: d(1.5), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 43, whatsapp_evo_chat_id: 5, direction: 'incoming', type: 'text', text: 'A demo would be great! Let me check my calendar and get back to you.', metadata: null, status: 'read', sent_at: d(1), message_mode: 'external' },
    ],
  },
  {
    id: 6, company_id: 1, whatsapp_instance_id: 1, lead_id: 6, remote_jid: '5511999990006@s.whatsapp.net',
    phone_number: '+55 11 99999-0006', is_group: 0, is_archived: 0,
    last_message_at: h(1), created_at: d(2), updated_at: h(1),
    instance: { id: 1, instance_name: 'Main Instance', company_id: 1 },
    lead: { id: 6, company_id: 1, first_name: 'Lisa', last_name: 'Anderson', phone: '+5511999990006', funnel_id: 1, stage_id: 101, funnel: { id: 1, name: 'B2B Enterprise' }, stage: { id: 101, name: 'New Leads' } },
    messages: [
      { id: 50, whatsapp_evo_chat_id: 6, direction: 'incoming', type: 'text', text: 'Hello! I was referred by a colleague who uses your CRM. Can I get more info?', metadata: null, status: 'read', sent_at: h(3), message_mode: 'external' },
      { id: 51, whatsapp_evo_chat_id: 6, direction: 'outgoing', type: 'text', text: 'Welcome Lisa! We\'d love to help. What specific features are you looking for?', metadata: null, status: 'delivered', sent_at: h(2), user_id: 1, user: { id: 1, name: 'Sarah Johnson' }, message_mode: 'external' },
      { id: 52, whatsapp_evo_chat_id: 6, direction: 'incoming', type: 'text', text: 'Mainly lead tracking, pipeline management, and WhatsApp integration — exactly like this! 😄', metadata: null, status: 'read', sent_at: h(1.5), message_mode: 'external' },
      { id: 53, whatsapp_evo_chat_id: 6, direction: 'incoming', type: 'contact', text: null, metadata: { contact_name: 'Tom Richards', contact_phone: '+5511988887777' }, status: 'read', sent_at: h(1.2), message_mode: 'external' },
      { id: 54, whatsapp_evo_chat_id: 6, direction: 'incoming', type: 'text', text: 'That\'s my colleague Tom who also wants a demo!', metadata: null, status: 'read', sent_at: h(1), message_mode: 'external' },
    ],
  },
];

// ─── Mock Optomyze Inbox Conversations ──────────────────────────

const sender = (id: number, name: string): { id: number; name: string; profile_pic_url: string | null } => ({
  id, name, profile_pic_url: null,
});

const participant = (id: number, name: string, email: string, role: string): ChatConversation['participants'][0] => ({
  id, name, email, role, profile_pic_url: null,
});

export const mockOptomyzeContacts: ChatContact[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@optomyze.com', role: 'Sales Manager', profile_pic_url: null },
  { id: 2, name: 'Mike Peters', email: 'mike@optomyze.com', role: 'Sales Rep', profile_pic_url: null },
  { id: 3, name: 'Ana Costa', email: 'ana@optomyze.com', role: 'Agent', profile_pic_url: null },
  { id: 4, name: 'Tom Richards', email: 'tom@optomyze.com', role: 'Support', profile_pic_url: null },
  { id: 5, name: 'Carla Mendes', email: 'carla@optomyze.com', role: 'Manager', profile_pic_url: null },
  { id: 6, name: 'Bruno Silva', email: 'bruno@optomyze.com', role: 'Agent', profile_pic_url: null },
];

export const mockOptomyzeConversations: ChatConversation[] = [
  {
    id: 1, type: 'private', name: 'Sarah Johnson', cover_image_url: null,
    participants: [participant(1, 'Sarah Johnson', 'sarah@optomyze.com', 'Sales Manager'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 105, conversation_id: 1, type: 'text', body: 'Great, I\'ll update the pipeline report!', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(0.3) },
    last_message_at: h(0.3), created_at: d(30),
  },
  {
    id: 2, type: 'private', name: 'Mike Peters', cover_image_url: null,
    participants: [participant(2, 'Mike Peters', 'mike@optomyze.com', 'Sales Rep'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 205, conversation_id: 2, type: 'text', body: 'The demo with StartupX went really well!', file_url: null, sender: sender(2, 'Mike Peters'), created_at: h(1) },
    last_message_at: h(1), created_at: d(20),
  },
  {
    id: 3, type: 'private', name: 'Ana Costa', cover_image_url: null,
    participants: [participant(3, 'Ana Costa', 'ana@optomyze.com', 'Agent'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 305, conversation_id: 3, type: 'text', body: 'Can you check the lead from Google Ads? Something looks off.', file_url: null, sender: sender(3, 'Ana Costa'), created_at: h(4) },
    last_message_at: h(4), created_at: d(15),
  },
  {
    id: 4, type: 'group', name: 'Sales Team', cover_image_url: null,
    participants: [participant(1, 'Sarah Johnson', 'sarah@optomyze.com', 'Sales Manager'), participant(2, 'Mike Peters', 'mike@optomyze.com', 'Sales Rep'), participant(3, 'Ana Costa', 'ana@optomyze.com', 'Agent'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 406, conversation_id: 4, type: 'text', body: 'Team meeting at 3pm. Pipeline review agenda attached.', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(2) },
    last_message_at: h(2), created_at: d(60),
  },
  {
    id: 5, type: 'private', name: 'Tom Richards', cover_image_url: null,
    participants: [participant(4, 'Tom Richards', 'tom@optomyze.com', 'Support'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 505, conversation_id: 5, type: 'text', body: 'Client ticket resolved. They were confused about the API rate limits.', file_url: null, sender: sender(4, 'Tom Richards'), created_at: h(8) },
    last_message_at: h(8), created_at: d(10),
  },
  {
    id: 6, type: 'group', name: 'Management', cover_image_url: null,
    participants: [participant(1, 'Sarah Johnson', 'sarah@optomyze.com', 'Sales Manager'), participant(5, 'Carla Mendes', 'carla@optomyze.com', 'Manager'), participant(99, 'You', 'me@optomyze.com', 'Admin')],
    last_message: { id: 605, conversation_id: 6, type: 'text', body: 'Q1 targets looking solid. Let\'s review Friday.', file_url: null, sender: sender(5, 'Carla Mendes'), created_at: d(1) },
    last_message_at: d(1), created_at: d(45),
  },
];

// Mock messages per conversation for Optomyze Inbox
export const mockOptomyzeMessages: Record<number, ChatMessage[]> = {
  1: [
    { id: 101, conversation_id: 1, type: 'text', body: 'Hey, did you finish the pipeline report?', file_url: null, sender: sender(99, 'You'), created_at: h(2) },
    { id: 102, conversation_id: 1, type: 'text', body: 'Almost! Just finalizing the Q1 numbers.', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(1.5) },
    { id: 103, conversation_id: 1, type: 'text', body: 'Our conversion rate improved 15% this month 📈', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(1) },
    { id: 104, conversation_id: 1, type: 'text', body: 'That\'s incredible! Send it over when ready.', file_url: null, sender: sender(99, 'You'), created_at: h(0.5) },
    { id: 105, conversation_id: 1, type: 'text', body: 'Great, I\'ll update the pipeline report!', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(0.3) },
  ],
  2: [
    { id: 201, conversation_id: 2, type: 'text', body: 'How did the StartupX demo go?', file_url: null, sender: sender(99, 'You'), created_at: h(3) },
    { id: 202, conversation_id: 2, type: 'text', body: 'They loved the kanban board and WhatsApp integration!', file_url: null, sender: sender(2, 'Mike Peters'), created_at: h(2.5) },
    { id: 203, conversation_id: 2, type: 'text', body: 'Their CTO asked about API rate limits and SSO.', file_url: null, sender: sender(2, 'Mike Peters'), created_at: h(2) },
    { id: 204, conversation_id: 2, type: 'text', body: 'Nice! Let\'s prepare a technical proposal for them.', file_url: null, sender: sender(99, 'You'), created_at: h(1.5) },
    { id: 205, conversation_id: 2, type: 'text', body: 'The demo with StartupX went really well!', file_url: null, sender: sender(2, 'Mike Peters'), created_at: h(1) },
  ],
  3: [
    { id: 301, conversation_id: 3, type: 'text', body: 'I noticed a lead came in from Google Ads with incomplete data.', file_url: null, sender: sender(3, 'Ana Costa'), created_at: h(6) },
    { id: 302, conversation_id: 3, type: 'text', body: 'Which campaign? I\'ll check the form configuration.', file_url: null, sender: sender(99, 'You'), created_at: h(5.5) },
    { id: 303, conversation_id: 3, type: 'text', body: 'The "Enterprise Trial" campaign. Missing phone number field.', file_url: null, sender: sender(3, 'Ana Costa'), created_at: h(5) },
    { id: 304, conversation_id: 3, type: 'text', body: 'Got it, I\'ll fix the form. Thanks for catching that!', file_url: null, sender: sender(99, 'You'), created_at: h(4.5) },
    { id: 305, conversation_id: 3, type: 'text', body: 'Can you check the lead from Google Ads? Something looks off.', file_url: null, sender: sender(3, 'Ana Costa'), created_at: h(4) },
  ],
  4: [
    { id: 401, conversation_id: 4, type: 'text', body: 'Good morning team! 🌅', file_url: null, sender: sender(99, 'You'), created_at: h(5) },
    { id: 402, conversation_id: 4, type: 'text', body: 'Morning! Ready for the pipeline review.', file_url: null, sender: sender(2, 'Mike Peters'), created_at: h(4.5) },
    { id: 403, conversation_id: 4, type: 'text', body: 'I have 3 deals moving to negotiation this week!', file_url: null, sender: sender(3, 'Ana Costa'), created_at: h(4) },
    { id: 404, conversation_id: 4, type: 'text', body: 'Amazing progress team. Let\'s keep pushing!', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(3) },
    { id: 405, conversation_id: 4, type: 'text', body: 'Reminder: we need to update our forecasts by Friday.', file_url: null, sender: sender(99, 'You'), created_at: h(2.5) },
    { id: 406, conversation_id: 4, type: 'text', body: 'Team meeting at 3pm. Pipeline review agenda attached.', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: h(2) },
  ],
  5: [
    { id: 501, conversation_id: 5, type: 'text', body: 'Hey Tom, got a support ticket about API rate limits.', file_url: null, sender: sender(99, 'You'), created_at: h(12) },
    { id: 502, conversation_id: 5, type: 'text', body: 'On it! Which client?', file_url: null, sender: sender(4, 'Tom Richards'), created_at: h(11) },
    { id: 503, conversation_id: 5, type: 'text', body: 'Global Solutions LLC. They\'re on the Pro plan.', file_url: null, sender: sender(99, 'You'), created_at: h(10) },
    { id: 504, conversation_id: 5, type: 'text', body: 'Found the issue — they were calling the leads endpoint without pagination. I helped them implement it.', file_url: null, sender: sender(4, 'Tom Richards'), created_at: h(9) },
    { id: 505, conversation_id: 5, type: 'text', body: 'Client ticket resolved. They were confused about the API rate limits.', file_url: null, sender: sender(4, 'Tom Richards'), created_at: h(8) },
  ],
  6: [
    { id: 601, conversation_id: 6, type: 'text', body: 'Q1 numbers are looking strong 💪', file_url: null, sender: sender(99, 'You'), created_at: d(2) },
    { id: 602, conversation_id: 6, type: 'text', body: 'Agreed! Revenue is up 23% compared to Q4.', file_url: null, sender: sender(1, 'Sarah Johnson'), created_at: d(1.8) },
    { id: 603, conversation_id: 6, type: 'text', body: 'We should discuss expanding the sales team next quarter.', file_url: null, sender: sender(5, 'Carla Mendes'), created_at: d(1.5) },
    { id: 604, conversation_id: 6, type: 'text', body: 'Good idea. Let\'s budget for 2 new reps.', file_url: null, sender: sender(99, 'You'), created_at: d(1.2) },
    { id: 605, conversation_id: 6, type: 'text', body: 'Q1 targets looking solid. Let\'s review Friday.', file_url: null, sender: sender(5, 'Carla Mendes'), created_at: d(1) },
  ],
};
