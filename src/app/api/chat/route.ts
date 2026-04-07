import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { searchKnowledgeBase } from '@/lib/rag';
import { checkSafety, checkHIPAA } from '@/lib/safety';
import { detectLanguage, isGreeting, isThanks, t, type SupportedLanguage } from '@/lib/i18n';
import { translateContent } from '@/lib/translate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, sessionId, language = 'en' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const db = getDb();
    const msgId = uuidv4();

    // Safety check (PWS 3.1.15)
    const safety = checkSafety(message);
    if (safety.isEmergency) {
      const convId = conversationId || uuidv4();
      if (!conversationId) {
        db.insertConversation({ id: convId, session_id: sessionId || uuidv4(), language });
      }
      db.insertMessage({ id: uuidv4(), conversation_id: convId, role: 'user', content: message, sources: null, is_emergency: 1 });
      db.insertMessage({ id: msgId, conversation_id: convId, role: 'assistant', content: safety.response!, sources: null, is_emergency: 1 });
      db.insertEvent({ event_type: 'emergency_detected', conversation_id: convId, metadata: JSON.stringify({ category: safety.category }) });

      return NextResponse.json({
        id: msgId, conversationId: convId, content: safety.response,
        isEmergency: true, emergencyCategory: safety.category, sources: [],
      });
    }

    const isHIPAA = checkHIPAA(message);
    const searchResults = searchKnowledgeBase(message, 5);
    const response = generateResponse(message, searchResults, isHIPAA, language);

    let convId = conversationId;
    if (!convId) {
      convId = uuidv4();
      db.insertConversation({ id: convId, session_id: sessionId || uuidv4(), language });
    }

    db.insertMessage({ id: uuidv4(), conversation_id: convId, role: 'user', content: message, sources: null, is_emergency: 0 });
    db.insertMessage({
      id: msgId, conversation_id: convId, role: 'assistant', content: response,
      sources: JSON.stringify(searchResults.map(r => ({ title: r.title, url: r.source_url }))),
      is_emergency: 0,
    });
    db.insertEvent({ event_type: 'message_sent', conversation_id: convId, metadata: JSON.stringify({ language, hipaa: isHIPAA, resultCount: searchResults.length }) });
    db.updateConversation(convId, {});

    return NextResponse.json({
      id: msgId, conversationId: convId, content: response, isEmergency: false,
      sources: searchResults.map(r => ({ title: r.title, url: r.source_url, score: r.score })),
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateResponse(query: string, results: ReturnType<typeof searchKnowledgeBase>, isHIPAA: boolean, language: string): string {
  let lang = language as SupportedLanguage;
  if (lang === 'en') {
    const detected = detectLanguage(query);
    if (detected !== 'en') lang = detected;
  }
  const tr = t(lang);

  if (isHIPAA) {
    return `${tr.hipaaRedirect}\n\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n- **Peace Corps**: 1-855-855-1961\n\n${tr.anythingElse}`;
  }
  if (results.length === 0) {
    return `${tr.noResults}\n\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n- **Peace Corps**: 1-855-855-1961\n\n${tr.anythingElse}`;
  }
  if (isGreeting(query, lang)) {
    return `${tr.greeting}\n\n${tr.helpfulTopics}:\n\n- **${tr.topicApply}**\n- **${tr.topicPrograms}**\n- **${tr.topicCountries}**\n- **${tr.topicBenefits}**\n- **${tr.topicEligibility}**\n- **${tr.topicRecruiter}**\n\n${tr.whatToKnow}`;
  }
  if (isThanks(query, lang)) {
    return `${tr.thanks}\n\n- **${tr.applyNow}**: [peacecorps.gov/apply](https://www.peacecorps.gov/apply)\n- **${tr.talkToRecruiter}**: [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/)\n\n${tr.goodLuck} 🌍`;
  }

  const topResult = results[0];
  let response = translateContent(topResult.id, topResult.content, lang);

  if (topResult.source_url) {
    response += `\n\n📖 ${tr.learnMore}: [${topResult.title}](${topResult.source_url})`;
  }
  if (results.length > 1) {
    const related = results.slice(1, 3).map(r => `- ${r.title}`).join('\n');
    response += `\n\n**${tr.relatedTopics}:**\n${related}`;
  }
  response += `\n\n${tr.wantMore} [${tr.talkToRecruiter}](https://www.peacecorps.gov/connect/recruiter/)?`;
  return response;
}
