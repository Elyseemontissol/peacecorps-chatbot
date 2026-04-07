/**
 * In-memory database for Vercel serverless compatibility.
 * In production, this would use a real database (PostgreSQL, DynamoDB, etc.)
 * The data persists for the lifetime of the serverless function instance.
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  source_url: string | null;
  tags: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  language: string;
  status: string;
  escalated: number;
  agent_id: string | null;
  user_satisfaction: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  sources: string | null;
  is_emergency: number;
  created_at: string;
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  conversation_id: string | null;
  metadata: string | null;
  created_at: string;
}

export interface AgentQueueEntry {
  id: string;
  conversation_id: string;
  user_name: string | null;
  user_email: string | null;
  reason: string;
  status: string;
  position: number;
  estimated_wait: number;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackEntry {
  id: number;
  message_id: string;
  conversation_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature' | 'performance' | 'security' | 'integration' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  submitter_name: string;
  submitter_email: string;
  submitter_org: string;
  assigned_to: string | null;
  responses: TicketResponse[];
  created_at: string;
  updated_at: string;
}

export interface TicketResponse {
  id: string;
  author: string;
  author_role: 'client' | 'support' | 'engineer';
  content: string;
  created_at: string;
}

interface Store {
  knowledge_documents: KnowledgeDocument[];
  conversations: Conversation[];
  messages: ChatMessage[];
  analytics_events: AnalyticsEvent[];
  agent_queue: AgentQueueEntry[];
  feedback: FeedbackEntry[];
  tickets: Ticket[];
}

let store: Store | null = null;
let eventIdCounter = 1;
let feedbackIdCounter = 1;

function now(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function getStore(): Store {
  if (!store) {
    store = {
      knowledge_documents: [],
      conversations: [],
      messages: [],
      analytics_events: [],
      agent_queue: [],
      feedback: [],
      tickets: [],
    };
    seedKnowledgeBase(store);
    seedTickets(store);
  }
  return store;
}

// ---- Compatibility layer that mimics the old SQLite API ----

export function getDb() {
  const s = getStore();

  return {
    // Knowledge documents
    getAllDocuments(opts?: { category?: string; search?: string; limit?: number; offset?: number }) {
      let docs = s.knowledge_documents;
      if (opts?.category) docs = docs.filter(d => d.category === opts.category);
      if (opts?.search) {
        const q = opts.search.toLowerCase();
        docs = docs.filter(d =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          (d.tags || '').toLowerCase().includes(q)
        );
      }
      const total = docs.length;
      docs = docs.sort((a, b) => b.priority - a.priority);
      if (opts?.offset) docs = docs.slice(opts.offset);
      if (opts?.limit) docs = docs.slice(0, opts.limit);
      return { docs, total };
    },

    getActiveDocuments(): (KnowledgeDocument & { tags: string })[] {
      return s.knowledge_documents
        .filter(d => d.is_active === 1)
        .map(d => ({ ...d, tags: d.tags || '' }));
    },

    insertDocument(doc: Omit<KnowledgeDocument, 'is_active' | 'created_at' | 'updated_at'>) {
      s.knowledge_documents.push({
        ...doc,
        is_active: 1,
        created_at: now(),
        updated_at: now(),
      });
    },

    updateDocument(id: string, fields: Partial<KnowledgeDocument>) {
      const idx = s.knowledge_documents.findIndex(d => d.id === id);
      if (idx >= 0) {
        const doc = s.knowledge_documents[idx];
        s.knowledge_documents[idx] = { ...doc, ...fields, updated_at: now() };
      }
    },

    deleteDocument(id: string) {
      s.knowledge_documents = s.knowledge_documents.filter(d => d.id !== id);
    },

    // Conversations
    insertConversation(conv: { id: string; session_id: string; language: string }) {
      s.conversations.push({
        ...conv,
        status: 'active',
        escalated: 0,
        agent_id: null,
        user_satisfaction: null,
        created_at: now(),
        updated_at: now(),
      });
    },

    updateConversation(id: string, fields: Partial<Conversation>) {
      const idx = s.conversations.findIndex(c => c.id === id);
      if (idx >= 0) {
        s.conversations[idx] = { ...s.conversations[idx], ...fields, updated_at: now() };
      }
    },

    getConversation(id: string) {
      return s.conversations.find(c => c.id === id) || null;
    },

    // Messages
    insertMessage(msg: Omit<ChatMessage, 'created_at'>) {
      s.messages.push({ ...msg, created_at: now() });
    },

    // Analytics
    insertEvent(event: { event_type: string; conversation_id: string | null; metadata: string | null }) {
      s.analytics_events.push({
        id: eventIdCounter++,
        ...event,
        created_at: now(),
      });
    },

    getAnalytics(periodDays: number) {
      const since = new Date(Date.now() - periodDays * 86400000).toISOString();
      const convs = s.conversations.filter(c => c.created_at >= since);
      const msgs = s.messages.filter(m => m.created_at >= since);
      const events = s.analytics_events.filter(e => e.created_at >= since);

      const escalated = convs.filter(c => c.escalated === 1).length;
      const totalConversations = convs.length;
      const totalMessages = msgs.length;
      const escalationRate = totalConversations > 0 ? parseFloat((escalated / totalConversations * 100).toFixed(1)) : 0;
      const containmentRate = totalConversations > 0 ? parseFloat(((1 - escalated / totalConversations) * 100).toFixed(1)) : 100;

      const satisfactions = convs.filter(c => c.user_satisfaction !== null).map(c => c.user_satisfaction!);
      const avgSatisfaction = satisfactions.length > 0
        ? parseFloat((satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length).toFixed(1))
        : null;

      const emergencyCount = events.filter(e => e.event_type === 'emergency_detected').length;

      // Messages per day
      const dayMap: Record<string, number> = {};
      msgs.forEach(m => {
        const day = m.created_at.substring(0, 10);
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
      const messagesPerDay = Object.entries(dayMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Language breakdown
      const langMap: Record<string, number> = {};
      convs.forEach(c => { langMap[c.language] = (langMap[c.language] || 0) + 1; });
      const languageBreakdown = Object.entries(langMap)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

      // Recent conversations
      const recentConversations = convs
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20)
        .map(c => ({
          ...c,
          message_count: s.messages.filter(m => m.conversation_id === c.id).length,
        }));

      return {
        summary: { totalConversations, totalMessages, escalationRate, containmentRate, avgSatisfaction, emergencyCount },
        messagesPerDay,
        topTopics: [],
        languageBreakdown,
        recentConversations,
      };
    },

    // Agent queue
    insertQueueEntry(entry: Omit<AgentQueueEntry, 'created_at' | 'updated_at'>) {
      s.agent_queue.push({ ...entry, created_at: now(), updated_at: now() });
    },

    getQueueLength() {
      return s.agent_queue.filter(q => q.status === 'waiting').length;
    },

    getQueueEntry(id: string) {
      return s.agent_queue.find(q => q.id === id) || null;
    },

    getActiveQueue() {
      return s.agent_queue
        .filter(q => q.status === 'waiting' || q.status === 'active')
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map(q => ({
          ...q,
          message_count: s.messages.filter(m => m.conversation_id === q.conversation_id).length,
        }));
    },

    updateQueueEntry(id: string, fields: Partial<AgentQueueEntry>) {
      const idx = s.agent_queue.findIndex(q => q.id === id);
      if (idx >= 0) {
        s.agent_queue[idx] = { ...s.agent_queue[idx], ...fields, updated_at: now() };
      }
    },

    // Feedback
    insertFeedback(entry: { message_id: string; conversation_id: string; rating: number | null; comment: string | null }) {
      s.feedback.push({
        id: feedbackIdCounter++,
        ...entry,
        created_at: now(),
      });
    },

    // Tickets
    getAllTickets(opts?: { status?: string; priority?: string; search?: string }) {
      let tickets = [...s.tickets];
      if (opts?.status && opts.status !== 'all') tickets = tickets.filter(t => t.status === opts.status);
      if (opts?.priority && opts.priority !== 'all') tickets = tickets.filter(t => t.priority === opts.priority);
      if (opts?.search) {
        const q = opts.search.toLowerCase();
        tickets = tickets.filter(t =>
          t.subject.toLowerCase().includes(q) ||
          t.ticket_number.toLowerCase().includes(q) ||
          t.submitter_name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return tickets.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },

    getTicket(id: string) {
      return s.tickets.find(t => t.id === id) || null;
    },

    getTicketByNumber(num: string) {
      return s.tickets.find(t => t.ticket_number === num) || null;
    },

    insertTicket(ticket: Omit<Ticket, 'responses' | 'created_at' | 'updated_at'>) {
      s.tickets.push({ ...ticket, responses: [], created_at: now(), updated_at: now() });
    },

    updateTicket(id: string, fields: Partial<Ticket>) {
      const idx = s.tickets.findIndex(t => t.id === id);
      if (idx >= 0) {
        s.tickets[idx] = { ...s.tickets[idx], ...fields, updated_at: now() };
      }
    },

    addTicketResponse(ticketId: string, response: TicketResponse) {
      const idx = s.tickets.findIndex(t => t.id === ticketId);
      if (idx >= 0) {
        s.tickets[idx].responses.push(response);
        s.tickets[idx].updated_at = now();
      }
    },

    getNextTicketNumber() {
      const count = s.tickets.length;
      return `ME-${String(count + 1001).padStart(4, '0')}`;
    },
  };
}

// ---- Seed data ----
function seedKnowledgeBase(s: Store) {
  const docs: Omit<KnowledgeDocument, 'is_active' | 'created_at' | 'updated_at'>[] = [
    {
      id: 'doc-001', title: 'What is the Peace Corps?',
      content: 'The Peace Corps is a volunteer program run by the United States government. It was established by President John F. Kennedy on March 1, 1961 with the mission to promote world peace and friendship. The Peace Corps has three goals: (1) Helping people of interested countries in meeting their needs for trained men and women, (2) Helping promote a better understanding of Americans on the part of peoples served, and (3) Helping promote a better understanding of other peoples on the part of Americans. Since 1961, over 240,000 Americans have served in 140 countries. Currently, Peace Corps has over 3,200 Volunteers working in 56 host countries across six sectors: agriculture, community economic development, education, environment, health, and youth in development.',
      category: 'about', priority: 10, source_url: 'https://www.peacecorps.gov/about/', tags: 'about,mission,history,goals',
    },
    {
      id: 'doc-002', title: 'How to Apply to Peace Corps',
      content: 'To apply to Peace Corps, you must be a U.S. citizen and at least 18 years old. There is no upper age limit. The application process includes: (1) Create an account at peacecorps.gov, (2) Complete the online application including your resume, motivation statement, and references, (3) Interview with a recruiter, (4) Receive medical and legal clearance, (5) Accept your invitation to serve. The entire process typically takes 6-12 months. Most Volunteers serve for 27 months (3 months of training plus 24 months of service). You can apply to specific programs or be open to any assignment. Visit peacecorps.gov/apply to start your application today.',
      category: 'apply', priority: 10, source_url: 'https://www.peacecorps.gov/volunteer/connect/', tags: 'apply,application,requirements,process',
    },
    {
      id: 'doc-003', title: 'Peace Corps Volunteer Programs',
      content: 'Peace Corps offers four main volunteer programs: (1) Peace Corps Volunteer (PCV) - Traditional 2-year service in a developing country. (2) Peace Corps Response (PCR) - Short-term assignments of 3-12 months for experienced professionals. (3) Global Health Service Partnership (GHSP) - For physicians, nurses, and public health professionals. (4) Virtual Service Pilot (VSP) - Remote volunteering opportunities. Each program has different eligibility requirements. Volunteers work in six sectors: Agriculture, Community Economic Development, Education, Environment, Health, and Youth in Development.',
      category: 'programs', priority: 9, source_url: 'https://www.peacecorps.gov/volunteer/', tags: 'programs,volunteer,PCV,PCR,GHSP,VSP',
    },
    {
      id: 'doc-004', title: 'Peace Corps Benefits',
      content: 'Peace Corps Volunteers receive numerous benefits including: living allowance to cover housing, food, and local transportation; complete medical and dental coverage during service; 48 vacation days over 2 years; language and technical training; student loan deferment or partial cancellation (Perkins loans); graduate school opportunities including fellowships at over 200 universities; non-competitive eligibility (NCE) for federal employment for 12 months after service; readjustment allowance of approximately $10,000 after completing service; career support and networking through the returned volunteer community. Peace Corps service also counts as qualifying employment under PSLF.',
      category: 'benefits', priority: 8, source_url: 'https://www.peacecorps.gov/volunteer/benefits/', tags: 'benefits,salary,loan,career,medical',
    },
    {
      id: 'doc-005', title: 'Where Peace Corps Volunteers Serve',
      content: 'Peace Corps Volunteers serve in approximately 56 countries across Africa, Asia, the Caribbean, Central America, South America, Europe, and the Pacific Islands. Countries include: Africa - Ghana, Kenya, Senegal, Tanzania, Uganda, Zambia and more. Asia - Cambodia, Mongolia, Nepal, Philippines, Thailand. Americas - Belize, Colombia, Costa Rica, Dominican Republic, Ecuador, Guatemala, Panama, Paraguay, Peru. Europe - Albania, Georgia, Kosovo, Moldova, North Macedonia, Ukraine.',
      category: 'countries', priority: 8, source_url: 'https://www.peacecorps.gov/countries/', tags: 'countries,locations,regions,where',
    },
    {
      id: 'doc-006', title: 'Peace Corps Eligibility Requirements',
      content: 'To be eligible for Peace Corps service, you must: be a U.S. citizen; be at least 18 years old (no upper age limit); complete a thorough application; pass medical and legal clearances; commit to 27 months of service for PCV program. While a college degree is not always required, most positions prefer candidates with a bachelor degree and relevant experience. Couples can serve together if both are selected and assigned to the same country. Peace Corps cannot accept applicants with outstanding federal loans in default, on probation or parole, or with certain criminal convictions. Knowledge of a foreign language is helpful but not always required as Volunteers receive 3 months of intensive language training.',
      category: 'eligibility', priority: 9, source_url: 'https://www.peacecorps.gov/volunteer/is-peace-corps-right-for-me/', tags: 'eligibility,requirements,qualifications,age',
    },
    {
      id: 'doc-007', title: 'Peace Corps Training',
      content: 'All Peace Corps Volunteers receive approximately 3 months of Pre-Service Training (PST) in their host country. Training includes: intensive language instruction; technical training specific to your sector; cultural integration activities; health and safety sessions; community development skills. After PST, Volunteers are sworn in and begin their 24-month service.',
      category: 'training', priority: 7, source_url: 'https://www.peacecorps.gov/volunteer/what-volunteers-do/', tags: 'training,preparation,language,PST',
    },
    {
      id: 'doc-008', title: 'Peace Corps Health and Safety',
      content: 'The safety and health of Volunteers is the agency\'s top priority. Peace Corps provides: comprehensive medical insurance during service and for 18 months after; access to Peace Corps Medical Officers (PCMOs); emergency action plans; 24/7 emergency support; mental health support and counseling. Volunteers receive detailed country-specific safety briefings.',
      category: 'safety', priority: 8, source_url: 'https://www.peacecorps.gov/volunteer/health-and-safety/', tags: 'safety,health,medical,security,insurance',
    },
    {
      id: 'doc-009', title: 'Connect with a Peace Corps Recruiter',
      content: 'You can connect with a Peace Corps recruiter: (1) Fill out the online form at peacecorps.gov/connect/recruiter/, (2) Attend a Peace Corps information event at peacecorps.gov/events, (3) Call Peace Corps at 1-855-855-1961. Office hours are Monday through Friday, 9:00 AM to 5:00 PM Eastern Time. You do not need to have applied to talk with a recruiter.',
      category: 'contact', priority: 10, source_url: 'https://www.peacecorps.gov/connect/recruiter/', tags: 'contact,recruiter,connect,phone,events',
    },
    {
      id: 'doc-010', title: 'Returned Peace Corps Volunteers (RPCVs)',
      content: 'After completing service, Returned Peace Corps Volunteers join a community of over 240,000 former Volunteers. Benefits include: Non-Competitive Eligibility (NCE) for federal jobs for 12 months; readjustment allowance; transition assistance; access to the RPCV network; graduate school fellowships at partner universities.',
      category: 'rpcv', priority: 7, source_url: 'https://www.peacecorps.gov/returned-volunteers/', tags: 'returned,RPCV,alumni,career,transition',
    },
    {
      id: 'doc-011', title: 'Peace Corps Sectors',
      content: 'Peace Corps Volunteers serve in six sectors: (1) Agriculture - sustainable farming, food security. (2) Community Economic Development - business training, financial literacy. (3) Education - teaching English, math, science. (4) Environment - conservation, climate change adaptation. (5) Health - community health, HIV/AIDS prevention, maternal health. (6) Youth in Development - life skills, leadership, employability.',
      category: 'sectors', priority: 8, source_url: 'https://www.peacecorps.gov/volunteer/what-volunteers-do/', tags: 'sectors,work,agriculture,education,health,environment',
    },
    {
      id: 'doc-012', title: 'Peace Corps Application Timeline',
      content: 'The application timeline typically spans 6-12 months: Step 1 - Submit Application online. Step 2 - Interview with a recruiter (4-8 weeks). Step 3 - Receive invitation to a specific country and sector. Step 4 - Medical Clearance. Step 5 - Legal Clearance. Step 6 - Pre-Departure preparations. Step 7 - Staging event in the U.S. Applications are accepted year-round.',
      category: 'apply', priority: 9, source_url: 'https://www.peacecorps.gov/volunteer/connect/', tags: 'timeline,application,process,steps,interview',
    },
    {
      id: 'doc-013', title: 'Peace Corps for Couples and Families',
      content: 'Married couples and domestic partners can serve together in Peace Corps. Both individuals must apply separately and meet all eligibility requirements. Couples are assigned to the same country and community. Peace Corps does not accept Volunteers with dependents under 18. Same-sex couples may serve together, though Peace Corps takes into account the laws and cultural norms of host countries when making placement decisions. Couples should discuss their desire to serve together with a recruiter early in the process.',
      category: 'eligibility', priority: 6, source_url: 'https://www.peacecorps.gov/volunteer/is-peace-corps-right-for-me/', tags: 'couples,families,partners,married,dependents',
    },
    {
      id: 'doc-014', title: 'Peace Corps and Student Loans',
      content: 'Peace Corps offers student loan benefits: Deferment for federal student loans during service. Perkins Loans: 15% cancelled for each of the first two years, 20% for years three and four. Public Service Loan Forgiveness (PSLF): Peace Corps counts as qualifying employment. Income-Driven Repayment: $0 payments during service count toward forgiveness.',
      category: 'benefits', priority: 8, source_url: 'https://www.peacecorps.gov/volunteer/benefits/', tags: 'loans,student,deferment,PSLF,financial',
    },
    {
      id: 'doc-015', title: 'Peace Corps Events',
      content: 'Peace Corps hosts free information sessions: Virtual Information Sessions online, On-Campus Events at colleges, Community Events with local recruiters, and Application Workshops. Find events at peacecorps.gov/events or contact your local recruiter.',
      category: 'events', priority: 7, source_url: 'https://www.peacecorps.gov/events/', tags: 'events,information,sessions,webinars,campus',
    },
  ];

  for (const doc of docs) {
    s.knowledge_documents.push({
      ...doc,
      is_active: 1,
      created_at: now(),
      updated_at: now(),
    });
  }
}

function seedTickets(s: Store) {
  const tickets: Ticket[] = [
    {
      id: 'tkt-001', ticket_number: 'ME-1001', subject: 'Chatbot not responding in Spanish on mobile',
      description: 'When selecting Spanish (Español) on mobile Safari, the chatbot shows the welcome message in Spanish but subsequent responses come back in English. This only happens on iOS devices. Desktop Chrome works fine.',
      category: 'bug', priority: 'high', status: 'in_progress',
      submitter_name: 'Sarah Chen', submitter_email: 's.chen@peacecorps.gov', submitter_org: 'Peace Corps VRS',
      assigned_to: 'Marcus Johnson',
      responses: [
        { id: 'r-001', author: 'Marcus Johnson', author_role: 'engineer', content: 'Looking into this. It appears the language header is not being preserved across API calls on mobile Safari due to a cookie issue. Working on a fix.', created_at: '2026-04-05 14:30:00' },
        { id: 'r-002', author: 'Sarah Chen', author_role: 'client', content: 'Thanks Marcus. This is affecting our recruitment events this week so it\'s urgent. About 30% of our event attendees use mobile.', created_at: '2026-04-05 15:10:00' },
        { id: 'r-003', author: 'Marcus Johnson', author_role: 'engineer', content: 'Fix deployed to staging. The issue was that sessionStorage was being used instead of localStorage for language preference on iOS. Can you test on your device?', created_at: '2026-04-06 09:15:00' },
      ],
      created_at: '2026-04-04 10:22:00', updated_at: '2026-04-06 09:15:00',
    },
    {
      id: 'tkt-002', ticket_number: 'ME-1002', subject: 'Add Knowledge Base article for Peace Corps Response deadlines',
      description: 'We need to add current PCR application deadlines to the RAG dataset. The chatbot currently cannot answer questions about Response program deadlines. Please add the Q3 and Q4 2026 deadlines.',
      category: 'feature', priority: 'medium', status: 'open',
      submitter_name: 'David Okafor', submitter_email: 'd.okafor@peacecorps.gov', submitter_org: 'Peace Corps VRS',
      assigned_to: null,
      responses: [],
      created_at: '2026-04-06 08:45:00', updated_at: '2026-04-06 08:45:00',
    },
    {
      id: 'tkt-003', ticket_number: 'ME-1003', subject: 'KPI Dashboard showing incorrect containment rate',
      description: 'The containment rate on the admin dashboard is showing 100% but we know at least 12 conversations were escalated to live agents last week. The escalation count shows correctly but the rate calculation seems wrong.',
      category: 'bug', priority: 'medium', status: 'waiting',
      submitter_name: 'Lisa Park', submitter_email: 'l.park@peacecorps.gov', submitter_org: 'Peace Corps OCIO',
      assigned_to: 'Aisha Williams',
      responses: [
        { id: 'r-004', author: 'Aisha Williams', author_role: 'engineer', content: 'I\'ve identified the issue. The analytics query is using the wrong date filter which excludes escalated conversations from the previous period. Fix is ready for review.', created_at: '2026-04-05 16:00:00' },
        { id: 'r-005', author: 'Aisha Williams', author_role: 'engineer', content: 'Can you confirm what date range you\'re looking at? I want to make sure the fix covers your use case.', created_at: '2026-04-05 16:30:00' },
      ],
      created_at: '2026-04-03 14:10:00', updated_at: '2026-04-05 16:30:00',
    },
    {
      id: 'tkt-004', ticket_number: 'ME-1004', subject: 'Request: Integration with Salesforce CRM',
      description: 'VRS would like the chatbot to integrate with our Salesforce CRM so that when a user provides their email during a conversation, it automatically creates or updates a lead record. This is critical for our recruitment pipeline tracking.',
      category: 'integration', priority: 'high', status: 'open',
      submitter_name: 'James Rivera', submitter_email: 'j.rivera@peacecorps.gov', submitter_org: 'Peace Corps VRS',
      assigned_to: null,
      responses: [
        { id: 'r-006', author: 'Montissol Global Tech Support', author_role: 'support', content: 'Thank you for this request, James. We\'ve added this to our integration roadmap. We\'ll schedule a discovery call to map out the Salesforce fields and workflow. Is the CRM team available this week?', created_at: '2026-04-06 10:00:00' },
      ],
      created_at: '2026-04-05 11:30:00', updated_at: '2026-04-06 10:00:00',
    },
    {
      id: 'tkt-005', ticket_number: 'ME-1005', subject: 'Chatbot response latency spike during peak hours',
      description: 'We\'re seeing response times of 8-12 seconds during Monday mornings (peak traffic). Normal response time is under 2 seconds. This is affecting user experience. Our traffic peaks at ~50K users on Mondays.',
      category: 'performance', priority: 'critical', status: 'in_progress',
      submitter_name: 'Sarah Chen', submitter_email: 's.chen@peacecorps.gov', submitter_org: 'Peace Corps VRS',
      assigned_to: 'Marcus Johnson',
      responses: [
        { id: 'r-007', author: 'Marcus Johnson', author_role: 'engineer', content: 'Investigating. Initial analysis shows the RAG search is the bottleneck under high concurrency. The vector similarity search scales linearly with document count. Looking at caching options.', created_at: '2026-04-06 11:00:00' },
        { id: 'r-008', author: 'Marcus Johnson', author_role: 'engineer', content: 'Implemented a response cache for the top 50 most common queries. Also added connection pooling. Deploying to production now. Should see improvement within the hour.', created_at: '2026-04-06 14:30:00' },
        { id: 'r-009', author: 'Sarah Chen', author_role: 'client', content: 'Response times are back to normal. Thanks for the quick turnaround!', created_at: '2026-04-07 09:00:00' },
      ],
      created_at: '2026-04-06 08:15:00', updated_at: '2026-04-07 09:00:00',
    },
    {
      id: 'tkt-006', ticket_number: 'ME-1006', subject: 'Section 508 accessibility audit findings',
      description: 'Our accessibility team found 3 issues during their quarterly audit:\n1. Chat input field missing visible focus indicator in high contrast mode\n2. Typing indicator dots not announced to screen readers\n3. Language selector dropdown not keyboard navigable with arrow keys\n\nThese need to be resolved before our next compliance review on April 30.',
      category: 'bug', priority: 'high', status: 'open',
      submitter_name: 'Monica Tran', submitter_email: 'm.tran@peacecorps.gov', submitter_org: 'Peace Corps OCIO',
      assigned_to: null,
      responses: [],
      created_at: '2026-04-07 07:30:00', updated_at: '2026-04-07 07:30:00',
    },
  ];

  s.tickets = tickets;
}
