import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { searchKnowledgeBase, buildRAGContext } from '@/lib/rag';
import { checkSafety, checkHIPAA } from '@/lib/safety';
import { detectLanguage, isGreeting, isThanks, t, type SupportedLanguage } from '@/lib/i18n';
import { translateContent } from '@/lib/translate';

const SYSTEM_PROMPT = `You are the Peace Corps Virtual Assistant, an AI chatbot on peacecorps.gov. You help potential applicants, current Volunteers, and the public learn about the Peace Corps.

IMPORTANT RULES:
1. You are a bot and must identify yourself as such if asked.
2. You ONLY answer questions using the provided knowledge base context. Do NOT make up information.
3. If you don't have enough information to answer, say so honestly and suggest the user connect with a recruiter.
4. Maintain the Peace Corps' welcoming, professional, and mission-driven tone.
5. Cite source URLs when available using markdown links.
6. If someone asks about medical records, personal health information, or other HIPAA-protected data, redirect them to speak with qualified Peace Corps staff.
7. Support common Peace Corps acronyms: PCV (Peace Corps Volunteer), PCR (Peace Corps Response), GHSP (Global Health Service Partnership), VSP (Virtual Service Pilot), RPCV (Returned Peace Corps Volunteer), PST (Pre-Service Training), PCMO (Peace Corps Medical Officer), COS (Close of Service).
8. Be encouraging but honest about the challenges of Peace Corps service.
9. For complex questions about specific medical accommodations, legal clearance issues, or specific country assignments, recommend speaking with a recruiter.
10. Never provide information about specific applicant statuses or internal Peace Corps processes.

You represent the Peace Corps and its three goals of world peace and friendship.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, sessionId, language = 'en' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const db = getDb();
    const msgId = uuidv4();

    // Safety check first (PWS 3.1.15)
    const safety = checkSafety(message);
    if (safety.isEmergency) {
      // Log emergency
      const convId = conversationId || uuidv4();
      if (!conversationId) {
        db.prepare(`INSERT INTO conversations (id, session_id, language) VALUES (?, ?, ?)`).run(convId, sessionId || uuidv4(), language);
      }
      db.prepare(`INSERT INTO messages (id, conversation_id, role, content, is_emergency) VALUES (?, ?, 'user', ?, 1)`).run(uuidv4(), convId, message);
      db.prepare(`INSERT INTO messages (id, conversation_id, role, content, is_emergency) VALUES (?, ?, 'assistant', ?, 1)`).run(msgId, convId, safety.response);
      db.prepare(`INSERT INTO analytics_events (event_type, conversation_id, metadata) VALUES ('emergency_detected', ?, ?)`).run(convId, JSON.stringify({ category: safety.category }));

      return NextResponse.json({
        id: msgId,
        conversationId: convId,
        content: safety.response,
        isEmergency: true,
        emergencyCategory: safety.category,
        sources: [],
      });
    }

    // HIPAA check (PWS 3.1.23)
    const isHIPAA = checkHIPAA(message);

    // Search knowledge base (RAG - PWS 3.1.4)
    const searchResults = searchKnowledgeBase(message, 5);
    const ragContext = buildRAGContext(searchResults);

    // Build the prompt
    let userPrompt = `Knowledge Base Context:\n${ragContext}\n\n`;
    if (isHIPAA) {
      userPrompt += `[SYSTEM NOTE: The user's message may contain or request HIPAA-protected information. Redirect them to speak with qualified Peace Corps staff. Do not attempt to provide medical advice or handle protected health information.]\n\n`;
    }
    if (language !== 'en') {
      userPrompt += `[SYSTEM NOTE: The user is communicating in language code "${language}". Respond in that language while using the English knowledge base for information. Translate your response accurately.]\n\n`;
    }
    userPrompt += `User Question: ${message}`;

    // Generate response (using built-in response generation since we may not have OpenAI key)
    const response = generateResponse(message, searchResults, isHIPAA, language);

    // Store conversation and messages
    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      db.prepare(`INSERT INTO conversations (id, session_id, language) VALUES (?, ?, ?)`).run(convId, sessionId || uuidv4(), language);
    }

    db.prepare(`INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)`).run(uuidv4(), convId, message);
    db.prepare(`INSERT INTO messages (id, conversation_id, role, content, sources) VALUES (?, ?, 'assistant', ?, ?)`).run(
      msgId, convId, response,
      JSON.stringify(searchResults.map(r => ({ title: r.title, url: r.source_url })))
    );

    // Log analytics
    db.prepare(`INSERT INTO analytics_events (event_type, conversation_id, metadata) VALUES ('message_sent', ?, ?)`).run(
      convId, JSON.stringify({ language, hipaa: isHIPAA, resultCount: searchResults.length })
    );

    db.prepare(`UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`).run(convId);

    return NextResponse.json({
      id: msgId,
      conversationId: convId,
      content: response,
      isEmergency: false,
      sources: searchResults.map(r => ({ title: r.title, url: r.source_url, score: r.score })),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Built-in multilingual response generation using RAG results.
 * PWS 3.1.9: Supports multiple languages with English-only RAG dataset.
 * In production with an LLM API (OpenAI/Claude), the model handles translation natively.
 */
function generateResponse(query: string, results: ReturnType<typeof searchKnowledgeBase>, isHIPAA: boolean, language: string): string {
  // Auto-detect language if set to English but message is in another language
  let lang = language as SupportedLanguage;
  if (lang === 'en') {
    const detected = detectLanguage(query);
    if (detected !== 'en') lang = detected;
  }

  const tr = t(lang);

  // HIPAA redirect (translated)
  if (isHIPAA) {
    return `${tr.hipaaRedirect}\n\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n- **Peace Corps**: 1-855-855-1961\n- **PCMO**: Peace Corps Medical Officer\n\n${tr.anythingElse}`;
  }

  // No results (translated)
  if (results.length === 0) {
    return `${tr.noResults}\n\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n- **Peace Corps**: 1-855-855-1961 (Mon-Fri, 9AM-5PM ET)\n- **peacecorps.gov**: [peacecorps.gov](https://www.peacecorps.gov)\n\n${tr.anythingElse}`;
  }

  // Greeting detection (all languages)
  if (isGreeting(query, lang)) {
    return `${tr.greeting}\n\n${tr.helpfulTopics}:\n\n- **${tr.topicApply}**\n- **${tr.topicPrograms}**\n- **${tr.topicCountries}**\n- **${tr.topicBenefits}**\n- **${tr.topicEligibility}**\n- **${tr.topicRecruiter}**\n\n${tr.whatToKnow}`;
  }

  // Thank you detection (all languages)
  if (isThanks(query, lang)) {
    return `${tr.thanks}\n\n- **${tr.applyNow}**: [peacecorps.gov/apply](https://www.peacecorps.gov/apply)\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n\n${tr.goodLuck} 🌍`;
  }

  // Build contextual response from top RAG results
  const topResult = results[0];

  // Translate the RAG content to the user's language (PWS 3.1.9)
  let response = translateContent(topResult.id, topResult.content, lang);

  // Add source citation (translated)
  if (topResult.source_url) {
    response += `\n\n📖 ${tr.learnMore}: [${topResult.title}](${topResult.source_url})`;
  }

  // Add related topics (translated)
  if (results.length > 1) {
    const relatedTopics = results.slice(1, 3).map(r => `- ${r.title}`).join('\n');
    response += `\n\n**${tr.relatedTopics}:**\n${relatedTopics}`;
  }

  // Add CTA (translated)
  response += `\n\n${tr.wantMore} [${tr.talkToRecruiter}](https://www.peacecorps.gov/connect/recruiter/)?`;

  return response;
}

