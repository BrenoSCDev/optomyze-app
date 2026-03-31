/**
 * OPTOMYZE INBOX - MOCK DATA
 * Structured to mirror the expected backend schema for easy future replacement.
 */

export type UserStatus = 'online' | 'away' | 'offline';

export interface InboxUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  role: string;
  status: UserStatus;
  last_seen: string | null;
}

export interface InboxGroup {
  id: string;
  name: string;
  avatar: string | null;
  description: string;
  member_ids: string[];
  created_by: string;
  created_at: string;
}

export type MessageType = 'text' | 'audio' | 'file' | 'image';

export interface InboxMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  file_name?: string;
  file_size?: string;
  file_mime?: string;
  audio_duration?: string;
  created_at: string;
  read_by: string[];
}

export interface InboxConversation {
  id: string;
  type: 'direct' | 'group';
  participant_ids: string[];
  group_id?: string;
  last_message: InboxMessage | null;
  unread_count: number;
  created_at: string;
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export const MOCK_CURRENT_USER_ID = 'u1';

export const MOCK_USERS: InboxUser[] = [
  { id: 'u1',  name: 'You (Alex Torres)',  email: 'alex@optomyze.com',     avatar: null, initials: 'AT', role: 'Admin',         status: 'online',  last_seen: null },
  { id: 'u2',  name: 'Carla Mendes',       email: 'carla@optomyze.com',    avatar: null, initials: 'CM', role: 'Sales Manager', status: 'online',  last_seen: null },
  { id: 'u3',  name: 'Bruno Silva',        email: 'bruno@optomyze.com',    avatar: null, initials: 'BS', role: 'Agent',         status: 'away',    last_seen: '2 min ago' },
  { id: 'u4',  name: 'Isabela Costa',      email: 'isabela@optomyze.com',  avatar: null, initials: 'IC', role: 'Agent',         status: 'offline', last_seen: '1h ago' },
  { id: 'u5',  name: 'Rafael Nunes',       email: 'rafael@optomyze.com',   avatar: null, initials: 'RN', role: 'Sales Rep',     status: 'online',  last_seen: null },
  { id: 'u6',  name: 'Fernanda Lima',      email: 'fernanda@optomyze.com', avatar: null, initials: 'FL', role: 'Manager',       status: 'offline', last_seen: '3h ago' },
  { id: 'u7',  name: 'Diego Martins',      email: 'diego@optomyze.com',    avatar: null, initials: 'DM', role: 'Agent',         status: 'away',    last_seen: '10 min ago' },
  { id: 'u8',  name: 'Juliana Rocha',      email: 'juliana@optomyze.com',  avatar: null, initials: 'JR', role: 'Finance',       status: 'online',  last_seen: null },
  { id: 'u9',  name: 'Pedro Alves',        email: 'pedro@optomyze.com',    avatar: null, initials: 'PA', role: 'Agent',         status: 'offline', last_seen: 'Yesterday' },
  { id: 'u10', name: 'Mariana Souza',      email: 'mariana@optomyze.com',  avatar: null, initials: 'MS', role: 'Sales Rep',     status: 'online',  last_seen: null },
];

// ─── GROUPS ──────────────────────────────────────────────────────────────────

export const MOCK_GROUPS: InboxGroup[] = [
  {
    id: 'g1',
    name: 'Sales Team',
    avatar: null,
    description: 'Main sales team channel for daily updates',
    member_ids: ['u1', 'u2', 'u3', 'u5', 'u7', 'u10'],
    created_by: 'u2',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 'g2',
    name: 'Management',
    avatar: null,
    description: 'Leadership & strategic discussions',
    member_ids: ['u1', 'u2', 'u6', 'u8'],
    created_by: 'u1',
    created_at: '2026-01-15T14:30:00Z',
  },
  {
    id: 'g3',
    name: 'CRM Project',
    avatar: null,
    description: 'Coordination for CRM implementation rollout',
    member_ids: ['u1', 'u2', 'u4', 'u5', 'u8', 'u9'],
    created_by: 'u1',
    created_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'g4',
    name: 'Support Agents',
    avatar: null,
    description: 'Internal support team coordination',
    member_ids: ['u3', 'u4', 'u7', 'u9'],
    created_by: 'u3',
    created_at: '2026-01-20T08:00:00Z',
  },
  {
    id: 'g5',
    name: 'Q1 Targets',
    avatar: null,
    description: 'Q1 2026 goals and tracking',
    member_ids: ['u1', 'u2', 'u5', 'u6', 'u10'],
    created_by: 'u6',
    created_at: '2026-01-02T07:00:00Z',
  },
];

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

const today = new Date();
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

function ts(base: Date, h: number, m: number): string {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

const msgs_c1: InboxMessage[] = [
  { id: 'm1_1', conversation_id: 'c1', sender_id: 'u2', type: 'text',  content: 'Hey Alex, did you check the Q1 report?',                                                    created_at: ts(twoDaysAgo, 9,  10), read_by: ['u1', 'u2'] },
  { id: 'm1_2', conversation_id: 'c1', sender_id: 'u1', type: 'text',  content: 'Yes! Numbers look solid. Closing rate is up 12%',                                           created_at: ts(twoDaysAgo, 9,  15), read_by: ['u1', 'u2'] },
  { id: 'm1_3', conversation_id: 'c1', sender_id: 'u2', type: 'text',  content: "Exactly. I'll present it tomorrow morning. Can you send me the raw file?",                  created_at: ts(yesterday,  10, 5),  read_by: ['u1', 'u2'] },
  { id: 'm1_4', conversation_id: 'c1', sender_id: 'u1', type: 'file',  content: '', file_name: 'Q1_Report_2026.xlsx', file_size: '1.4 MB', file_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', created_at: ts(yesterday, 10, 8),  read_by: ['u1', 'u2'] },
  { id: 'm1_5', conversation_id: 'c1', sender_id: 'u2', type: 'text',  content: 'Perfect, thanks!',                                                                           created_at: ts(yesterday,  10, 10), read_by: ['u1', 'u2'] },
  { id: 'm1_6', conversation_id: 'c1', sender_id: 'u1', type: 'audio', content: '', audio_duration: '0:23',                                                                   created_at: ts(today,       8, 30), read_by: ['u2'] },
  { id: 'm1_7', conversation_id: 'c1', sender_id: 'u2', type: 'text',  content: "Got it. I'll call you after the presentation.",                                              created_at: ts(today,       8, 45), read_by: [] },
];

const msgs_c2: InboxMessage[] = [
  { id: 'm2_1', conversation_id: 'c2', sender_id: 'u3', type: 'text',  content: 'Bruno here. Need help with a lead that went cold.',         created_at: ts(yesterday, 14,  0), read_by: ['u1', 'u3'] },
  { id: 'm2_2', conversation_id: 'c2', sender_id: 'u1', type: 'text',  content: 'Which one? Do you have their contact info?',                 created_at: ts(yesterday, 14, 10), read_by: ['u1', 'u3'] },
  { id: 'm2_3', conversation_id: 'c2', sender_id: 'u3', type: 'file',  content: '', file_name: 'Lead_Oliveira.pdf', file_size: '320 KB', file_mime: 'application/pdf', created_at: ts(yesterday, 14, 15), read_by: ['u1', 'u3'] },
  { id: 'm2_4', conversation_id: 'c2', sender_id: 'u1', type: 'text',  content: 'Let me check his funnel history and get back to you.',       created_at: ts(yesterday, 14, 20), read_by: ['u1', 'u3'] },
  { id: 'm2_5', conversation_id: 'c2', sender_id: 'u3', type: 'text',  content: 'Sounds good, thanks!',                                       created_at: ts(today,      9,  0), read_by: [] },
];

const msgs_c3: InboxMessage[] = [
  { id: 'm3_1', conversation_id: 'c3', sender_id: 'u5', type: 'text',  content: 'Rafael here! Quick update: closed 3 deals this morning!', created_at: ts(today, 10,  0), read_by: ['u1', 'u5'] },
  { id: 'm3_2', conversation_id: 'c3', sender_id: 'u1', type: 'text',  content: 'Incredible! Keep it up Rafael!',                          created_at: ts(today, 10,  5), read_by: ['u1', 'u5'] },
  { id: 'm3_3', conversation_id: 'c3', sender_id: 'u5', type: 'audio', content: '', audio_duration: '0:45',                                created_at: ts(today, 10, 10), read_by: [] },
];

const msgs_c4: InboxMessage[] = [
  { id: 'm4_1', conversation_id: 'c4', sender_id: 'u8', type: 'text', content: 'Juliana here - can you approve the invoice before EOD?', created_at: ts(today, 11, 30), read_by: [] },
  { id: 'm4_2', conversation_id: 'c4', sender_id: 'u8', type: 'file', content: '', file_name: 'Invoice_Feb2026.pdf', file_size: '215 KB', file_mime: 'application/pdf', created_at: ts(today, 11, 31), read_by: [] },
];

const msgs_c5: InboxMessage[] = [
  { id: 'm5_1', conversation_id: 'c5', sender_id: 'u1',  type: 'text', content: "Hey Mariana, how's the onboarding going?",                   created_at: ts(yesterday, 16,  0), read_by: ['u1', 'u10'] },
  { id: 'm5_2', conversation_id: 'c5', sender_id: 'u10', type: 'text', content: 'Going great! The CRM is super intuitive.',                   created_at: ts(yesterday, 16, 10), read_by: ['u1', 'u10'] },
  { id: 'm5_3', conversation_id: 'c5', sender_id: 'u10', type: 'text', content: 'I do have a question about the funnel stages though.',        created_at: ts(yesterday, 16, 11), read_by: ['u1', 'u10'] },
  { id: 'm5_4', conversation_id: 'c5', sender_id: 'u1',  type: 'text', content: 'Sure! Ask away.',                                             created_at: ts(yesterday, 16, 15), read_by: ['u1', 'u10'] },
  { id: 'm5_5', conversation_id: 'c5', sender_id: 'u10', type: 'text', content: 'Never mind, figured it out! Thanks anyway!',                  created_at: ts(today,      7, 55), read_by: ['u1', 'u10'] },
];

const msgs_c6: InboxMessage[] = [
  { id: 'm6_1', conversation_id: 'c6', sender_id: 'u2',  type: 'text',  content: 'Team meeting at 3pm today. Please be on time!',              created_at: ts(today, 8,  0),  read_by: ['u1', 'u2', 'u3', 'u5'] },
  { id: 'm6_2', conversation_id: 'c6', sender_id: 'u3',  type: 'text',  content: 'Confirmed!',                                                  created_at: ts(today, 8,  5),  read_by: ['u1', 'u2', 'u3'] },
  { id: 'm6_3', conversation_id: 'c6', sender_id: 'u5',  type: 'text',  content: "I'll be there. Should I prepare anything?",                   created_at: ts(today, 8, 10),  read_by: ['u1', 'u2', 'u5'] },
  { id: 'm6_4', conversation_id: 'c6', sender_id: 'u2',  type: 'text',  content: 'Just bring your pipeline update from last week.',             created_at: ts(today, 8, 15),  read_by: ['u1', 'u2'] },
  { id: 'm6_5', conversation_id: 'c6', sender_id: 'u7',  type: 'audio', content: '', audio_duration: '1:02',                                   created_at: ts(today, 9,  0),  read_by: ['u2'] },
  { id: 'm6_6', conversation_id: 'c6', sender_id: 'u10', type: 'file',  content: '', file_name: 'Pipeline_Week7.xlsx', file_size: '890 KB', file_mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', created_at: ts(today, 9, 30), read_by: [] },
];

const msgs_c7: InboxMessage[] = [
  { id: 'm7_1', conversation_id: 'c7', sender_id: 'u6', type: 'text', content: "Board review next Monday. Let's align our KPIs before then.", created_at: ts(yesterday, 11,  0), read_by: ['u1', 'u2', 'u6', 'u8'] },
  { id: 'm7_2', conversation_id: 'c7', sender_id: 'u8', type: 'text', content: 'Finance report will be ready by Friday.',                      created_at: ts(yesterday, 11, 30), read_by: ['u1', 'u2', 'u6', 'u8'] },
  { id: 'm7_3', conversation_id: 'c7', sender_id: 'u1', type: 'text', content: "Great. I'll prepare the growth slides.",                        created_at: ts(yesterday, 12,  0), read_by: ['u1', 'u2', 'u6', 'u8'] },
  { id: 'm7_4', conversation_id: 'c7', sender_id: 'u2', type: 'text', content: 'Should we invite the sales leads to the review?',              created_at: ts(today,      9,  0), read_by: ['u1'] },
];

const msgs_c8: InboxMessage[] = [
  { id: 'm8_1', conversation_id: 'c8', sender_id: 'u4', type: 'text', content: 'Sprint 3 is done. Ready to demo tomorrow?',  created_at: ts(today, 13, 0), read_by: [] },
  { id: 'm8_2', conversation_id: 'c8', sender_id: 'u9', type: 'file', content: '', file_name: 'Sprint3_Notes.pdf', file_size: '540 KB', file_mime: 'application/pdf', created_at: ts(today, 13, 5), read_by: [] },
];

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────

export const MOCK_CONVERSATIONS: InboxConversation[] = [
  { id: 'c1', type: 'direct', participant_ids: ['u1', 'u2'],                        last_message: msgs_c1[msgs_c1.length - 1], unread_count: 0, created_at: ts(twoDaysAgo, 9, 10) },
  { id: 'c2', type: 'direct', participant_ids: ['u1', 'u3'],                        last_message: msgs_c2[msgs_c2.length - 1], unread_count: 1, created_at: ts(yesterday, 14, 0) },
  { id: 'c3', type: 'direct', participant_ids: ['u1', 'u5'],                        last_message: msgs_c3[msgs_c3.length - 1], unread_count: 1, created_at: ts(today, 10, 0) },
  { id: 'c4', type: 'direct', participant_ids: ['u1', 'u8'],                        last_message: msgs_c4[msgs_c4.length - 1], unread_count: 2, created_at: ts(today, 11, 30) },
  { id: 'c5', type: 'direct', participant_ids: ['u1', 'u10'],                       last_message: msgs_c5[msgs_c5.length - 1], unread_count: 0, created_at: ts(yesterday, 16, 0) },
  { id: 'c6', type: 'group',  participant_ids: ['u1','u2','u3','u5','u7','u10'],   group_id: 'g1', last_message: msgs_c6[msgs_c6.length - 1], unread_count: 3, created_at: ts(today, 8, 0) },
  { id: 'c7', type: 'group',  participant_ids: ['u1', 'u2', 'u6', 'u8'],           group_id: 'g2', last_message: msgs_c7[msgs_c7.length - 1], unread_count: 1, created_at: ts(yesterday, 11, 0) },
  { id: 'c8', type: 'group',  participant_ids: ['u1','u2','u4','u5','u8','u9'],    group_id: 'g3', last_message: msgs_c8[msgs_c8.length - 1], unread_count: 2, created_at: ts(today, 13, 0) },
];

// Map conversation ID -> messages
export const MOCK_MESSAGES: Record<string, InboxMessage[]> = {
  c1: msgs_c1,
  c2: msgs_c2,
  c3: msgs_c3,
  c4: msgs_c4,
  c5: msgs_c5,
  c6: msgs_c6,
  c7: msgs_c7,
  c8: msgs_c8,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getUserById(id: string): InboxUser | undefined {
  return MOCK_USERS.find(u => u.id === id);
}

export function getGroupById(id: string): InboxGroup | undefined {
  return MOCK_GROUPS.find(g => g.id === id);
}

export function getConversationDisplayName(conv: InboxConversation, currentUserId: string): string {
  if (conv.type === 'group' && conv.group_id) {
    return getGroupById(conv.group_id)?.name ?? 'Group';
  }
  const otherId = conv.participant_ids.find(id => id !== currentUserId);
  return getUserById(otherId ?? '')?.name ?? 'Unknown';
}

export function getConversationInitials(conv: InboxConversation, currentUserId: string): string {
  if (conv.type === 'group' && conv.group_id) {
    const name = getGroupById(conv.group_id)?.name ?? 'G';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  const otherId = conv.participant_ids.find(id => id !== currentUserId);
  return getUserById(otherId ?? '')?.initials ?? '??';
}

export function getConversationStatus(conv: InboxConversation, currentUserId: string): UserStatus | null {
  if (conv.type === 'group') return null;
  const otherId = conv.participant_ids.find(id => id !== currentUserId);
  return getUserById(otherId ?? '')?.status ?? null;
}

export function formatMessageTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterdayDate.toDateString();
  if (isToday) {
    const match = isoString.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatDaySeparator(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterdayDate.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export function getLastMessagePreview(msg: InboxMessage | null): string {
  if (!msg) return 'No messages yet';
  switch (msg.type) {
    case 'audio': return 'Voice message';
    case 'file':  return msg.file_name ?? 'File attachment';
    case 'image': return 'Image';
    default:      return msg.content;
  }
}

export function getFileMimeIcon(mime: string): string {
  if (mime.includes('pdf'))         return 'pdf';
  if (mime.includes('sheet') || mime.includes('excel')) return 'sheet';
  if (mime.includes('word') || mime.includes('document')) return 'doc';
  if (mime.includes('image'))       return 'image';
  return 'file';
}
