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

interface Store {
  knowledge_documents: KnowledgeDocument[];
  conversations: Conversation[];
  messages: ChatMessage[];
  analytics_events: AnalyticsEvent[];
  agent_queue: AgentQueueEntry[];
  feedback: FeedbackEntry[];
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
    };
    seedKnowledgeBase(store);
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
