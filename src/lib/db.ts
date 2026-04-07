import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'peacecorps-chatbot.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    -- Knowledge base documents for RAG
    CREATE TABLE IF NOT EXISTS knowledge_documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      priority INTEGER NOT NULL DEFAULT 5,
      source_url TEXT,
      tags TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Chat conversations
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      status TEXT NOT NULL DEFAULT 'active',
      escalated INTEGER NOT NULL DEFAULT 0,
      agent_id TEXT,
      user_satisfaction INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      sources TEXT,
      is_emergency INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    -- Analytics events
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      conversation_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Agent queue for live escalation
    CREATE TABLE IF NOT EXISTS agent_queue (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      user_name TEXT,
      user_email TEXT,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      position INTEGER,
      estimated_wait INTEGER,
      agent_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );

    -- Feedback for continuous learning
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      rating INTEGER,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_documents(category);
    CREATE INDEX IF NOT EXISTS idx_knowledge_active ON knowledge_documents(is_active);
  `);

  // Seed knowledge base if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM knowledge_documents').get() as { count: number };
  if (count.count === 0) {
    seedKnowledgeBase(db);
  }
}

function seedKnowledgeBase(db: Database.Database) {
  const docs = [
    {
      id: 'doc-001',
      title: 'What is the Peace Corps?',
      content: `The Peace Corps is a volunteer program run by the United States government. It was established by President John F. Kennedy on March 1, 1961 with the mission to promote world peace and friendship. The Peace Corps has three goals: (1) Helping people of interested countries in meeting their needs for trained men and women, (2) Helping promote a better understanding of Americans on the part of peoples served, and (3) Helping promote a better understanding of other peoples on the part of Americans. Since 1961, over 240,000 Americans have served in 140 countries. Currently, Peace Corps has over 3,200 Volunteers working in 56 host countries across six sectors: agriculture, community economic development, education, environment, health, and youth in development.`,
      category: 'about',
      priority: 10,
      source_url: 'https://www.peacecorps.gov/about/',
      tags: 'about,mission,history,goals'
    },
    {
      id: 'doc-002',
      title: 'How to Apply to Peace Corps',
      content: `To apply to Peace Corps, you must be a U.S. citizen and at least 18 years old. There is no upper age limit. The application process includes: (1) Create an account at peacecorps.gov, (2) Complete the online application including your resume, motivation statement, and references, (3) Interview with a recruiter, (4) Receive medical and legal clearance, (5) Accept your invitation to serve. The entire process typically takes 6-12 months. Most Volunteers serve for 27 months (3 months of training plus 24 months of service). You can apply to specific programs or be open to any assignment. Visit peacecorps.gov/apply to start your application today.`,
      category: 'apply',
      priority: 10,
      source_url: 'https://www.peacecorps.gov/volunteer/connect/',
      tags: 'apply,application,requirements,process'
    },
    {
      id: 'doc-003',
      title: 'Peace Corps Volunteer Programs',
      content: `Peace Corps offers four main volunteer programs: (1) Peace Corps Volunteer (PCV) - Traditional 2-year service in a developing country. Most common program. (2) Peace Corps Response (PCR) - Short-term assignments of 3-12 months for experienced professionals. (3) Global Health Service Partnership (GHSP) - For physicians, nurses, and public health professionals to serve in teaching roles. (4) Virtual Service Pilot (VSP) - Remote volunteering opportunities. Each program has different eligibility requirements and application processes. Volunteers work in six sectors: Agriculture, Community Economic Development, Education, Environment, Health, and Youth in Development.`,
      category: 'programs',
      priority: 9,
      source_url: 'https://www.peacecorps.gov/volunteer/',
      tags: 'programs,volunteer,PCV,PCR,GHSP,VSP'
    },
    {
      id: 'doc-004',
      title: 'Peace Corps Benefits',
      content: `Peace Corps Volunteers receive numerous benefits including: living allowance to cover housing, food, and local transportation; complete medical and dental coverage during service; 48 vacation days over 2 years; language and technical training; student loan deferment or partial cancellation (Perkins loans); graduate school opportunities including fellowships and assistantships at over 200 universities; non-competitive eligibility (NCE) for federal employment for 12 months after service; readjustment allowance of approximately $10,000 after completing service; career support and networking through the returned volunteer community. Peace Corps service is also considered qualifying employment under the Public Service Loan Forgiveness (PSLF) program.`,
      category: 'benefits',
      priority: 8,
      source_url: 'https://www.peacecorps.gov/volunteer/benefits/',
      tags: 'benefits,salary,loan,career,medical'
    },
    {
      id: 'doc-005',
      title: 'Where Peace Corps Volunteers Serve',
      content: `Peace Corps Volunteers serve in approximately 56 countries across Africa, Asia, the Caribbean, Central America, South America, Europe, and the Pacific Islands. Some of the current countries include: Africa - Benin, Botswana, Cameroon, Ethiopia, Ghana, Guinea, Kenya, Lesotho, Liberia, Madagascar, Malawi, Mali, Mozambique, Namibia, Rwanda, Senegal, Sierra Leone, South Africa, Tanzania, The Gambia, Togo, Uganda, Zambia. Asia - Cambodia, China, Indonesia, Mongolia, Myanmar, Nepal, Philippines, Thailand, Timor-Leste. Americas - Belize, Colombia, Costa Rica, Dominican Republic, Ecuador, Guatemala, Guyana, Jamaica, Mexico, Nicaragua, Panama, Paraguay, Peru. Europe - Albania, Georgia, Kosovo, Moldova, North Macedonia, Ukraine.`,
      category: 'countries',
      priority: 8,
      source_url: 'https://www.peacecorps.gov/countries/',
      tags: 'countries,locations,regions,where'
    },
    {
      id: 'doc-006',
      title: 'Peace Corps Eligibility Requirements',
      content: `To be eligible for Peace Corps service, you must: be a U.S. citizen; be at least 18 years old (no upper age limit); complete a thorough application; pass medical and legal clearances; commit to 27 months of service for PCV program. While a college degree is not always required, most positions prefer candidates with a bachelor degree and relevant experience. Couples can serve together if both are selected and assigned to the same country. Peace Corps cannot accept applicants who have outstanding federal loans in default, are on probation or parole, or who have certain criminal convictions. Knowledge of a foreign language is helpful but not always required as Volunteers receive 3 months of intensive language training.`,
      category: 'eligibility',
      priority: 9,
      source_url: 'https://www.peacecorps.gov/volunteer/is-peace-corps-right-for-me/',
      tags: 'eligibility,requirements,qualifications,age'
    },
    {
      id: 'doc-007',
      title: 'Peace Corps Training',
      content: `All Peace Corps Volunteers receive approximately 3 months of Pre-Service Training (PST) in their host country. Training includes: intensive language instruction in the local language; technical training specific to your sector assignment; cultural integration activities with host community members; health and safety sessions; community development skills. After PST, Volunteers are sworn in and begin their 24-month service. During service, Volunteers may receive additional training through In-Service Training (IST) conferences and workshops. Training is designed to prepare Volunteers to live and work effectively in their communities.`,
      category: 'training',
      priority: 7,
      source_url: 'https://www.peacecorps.gov/volunteer/what-volunteers-do/',
      tags: 'training,preparation,language,PST'
    },
    {
      id: 'doc-008',
      title: 'Peace Corps Health and Safety',
      content: `The safety and health of Peace Corps Volunteers is the agency's top priority. Peace Corps provides: comprehensive medical insurance during service and for 18 months after; access to Peace Corps Medical Officers (PCMOs) in each country; emergency action plans at every post; 24/7 emergency support through the Office of Health Services; mental health support and counseling services; safety and security training throughout service. Volunteers also receive a detailed country-specific safety briefing. Peace Corps monitors global health and security situations and may consolidate or evacuate Volunteers when necessary. If you have a medical condition, Peace Corps will evaluate whether you can be accommodated.`,
      category: 'safety',
      priority: 8,
      source_url: 'https://www.peacecorps.gov/volunteer/health-and-safety/',
      tags: 'safety,health,medical,security,insurance'
    },
    {
      id: 'doc-009',
      title: 'Connect with a Peace Corps Recruiter',
      content: `You can connect with a Peace Corps recruiter in several ways: (1) Fill out the online form at peacecorps.gov/connect/recruiter/ to request a conversation with a recruiter, (2) Attend a Peace Corps information event - check peacecorps.gov/events for upcoming sessions, (3) Visit your local Peace Corps recruiting office, (4) Call Peace Corps at 1-855-855-1961. Recruiters can answer questions about the application process, country assignments, volunteer life, and help you determine if Peace Corps is right for you. You do not need to have applied to talk with a recruiter. Office hours are Monday through Friday, 9:00 AM to 5:00 PM Eastern Time.`,
      category: 'contact',
      priority: 10,
      source_url: 'https://www.peacecorps.gov/connect/recruiter/',
      tags: 'contact,recruiter,connect,phone,events'
    },
    {
      id: 'doc-010',
      title: 'Returned Peace Corps Volunteers (RPCVs)',
      content: `After completing service, Returned Peace Corps Volunteers (RPCVs) join a community of over 240,000 former Volunteers. Benefits for RPCVs include: Non-Competitive Eligibility (NCE) for federal jobs for 12 months; readjustment allowance; transition assistance and career resources; access to the RPCV network through organizations like National Peace Corps Association; graduate school fellowships at partner universities. Many RPCVs go on to careers in international development, government service, education, healthcare, and the private sector. The Peace Corps experience provides valuable cross-cultural skills, language abilities, and leadership experience.`,
      category: 'rpcv',
      priority: 7,
      source_url: 'https://www.peacecorps.gov/returned-volunteers/',
      tags: 'returned,RPCV,alumni,career,transition'
    },
    {
      id: 'doc-011',
      title: 'Peace Corps Sectors and Work Areas',
      content: `Peace Corps Volunteers serve in six primary sectors: (1) Agriculture - sustainable farming, food security, and nutrition education. (2) Community Economic Development - business training, financial literacy, and entrepreneurship. (3) Education - teaching English, math, science, and building teacher capacity. (4) Environment - environmental education, conservation, and climate change adaptation. (5) Health - community health education, HIV/AIDS prevention, maternal and child health. (6) Youth in Development - life skills, leadership, employability, and youth empowerment. Volunteers work alongside local community members as partners, building local capacity and sharing skills.`,
      category: 'sectors',
      priority: 8,
      source_url: 'https://www.peacecorps.gov/volunteer/what-volunteers-do/',
      tags: 'sectors,work,agriculture,education,health,environment'
    },
    {
      id: 'doc-012',
      title: 'Peace Corps Application Timeline',
      content: `The Peace Corps application timeline typically spans 6-12 months: Step 1 - Submit Application: Complete the online application at peacecorps.gov/apply, which includes your resume, motivation statement, and references. Step 2 - Interview: If selected, you will be interviewed by a Peace Corps recruiter (usually within 4-8 weeks). Step 3 - Invitation: Qualified applicants receive an invitation to serve in a specific country and sector. Step 4 - Medical Clearance: Complete medical and dental exams. Step 5 - Legal Clearance: Background check and fingerprinting. Step 6 - Pre-Departure: Complete pre-departure checklist and preparations. Step 7 - Staging: Attend staging event in the U.S. before departure. Applications are accepted year-round.`,
      category: 'apply',
      priority: 9,
      source_url: 'https://www.peacecorps.gov/volunteer/connect/',
      tags: 'timeline,application,process,steps,interview'
    },
    {
      id: 'doc-013',
      title: 'Peace Corps for Couples and Families',
      content: `Married couples and domestic partners can serve together in Peace Corps. Both individuals must apply separately and meet all eligibility requirements. Couples are assigned to the same country and community. Peace Corps does not accept Volunteers with dependents under 18. Same-sex couples may serve together, though Peace Corps takes into account the laws and cultural norms of host countries when making placement decisions. Couples should discuss their desire to serve together with a recruiter early in the process.`,
      category: 'eligibility',
      priority: 6,
      source_url: 'https://www.peacecorps.gov/volunteer/is-peace-corps-right-for-me/',
      tags: 'couples,families,partners,married,dependents'
    },
    {
      id: 'doc-014',
      title: 'Peace Corps and Student Loans',
      content: `Peace Corps offers several student loan benefits: Deferment - Federal student loans (Stafford, Perkins, Direct) can be deferred during Peace Corps service. Partial Cancellation - Perkins Loans: 15% cancelled for each of the first two years, 20% for the third and fourth years. Public Service Loan Forgiveness (PSLF) - Peace Corps service counts as qualifying employment for PSLF. Income-Driven Repayment - Volunteers qualify for $0 payments on income-driven plans during service, and these months count toward loan forgiveness. AmeriCorps Education Award - Peace Corps Volunteers are eligible for the Segal AmeriCorps Education Award. Contact your loan servicer before departing for specific details.`,
      category: 'benefits',
      priority: 8,
      source_url: 'https://www.peacecorps.gov/volunteer/benefits/',
      tags: 'loans,student,deferment,PSLF,financial'
    },
    {
      id: 'doc-015',
      title: 'Peace Corps Events and Information Sessions',
      content: `Peace Corps hosts free information sessions and events throughout the year. Events include: Virtual Information Sessions - Online webinars where you can learn about Peace Corps and ask questions. On-Campus Events - Presentations at colleges and universities. Community Events - Local gatherings organized by recruiters and returned Volunteers. Application Workshops - Guided sessions to help you complete your application. You can find upcoming events at peacecorps.gov/events or by contacting your local recruiter. Events are a great way to learn about Peace Corps, hear from returned Volunteers, and get your questions answered.`,
      category: 'events',
      priority: 7,
      source_url: 'https://www.peacecorps.gov/events/',
      tags: 'events,information,sessions,webinars,campus'
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO knowledge_documents (id, title, content, category, priority, source_url, tags)
    VALUES (@id, @title, @content, @category, @priority, @source_url, @tags)
  `);

  const insertMany = db.transaction((items: { id: string; title: string; content: string; category: string; priority: number; source_url: string; tags: string }[]) => {
    for (const doc of items) stmt.run(doc);
  });

  insertMany(docs);
}
