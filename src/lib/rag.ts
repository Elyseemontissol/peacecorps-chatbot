import { getDb } from './db';

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  source_url: string | null;
  score: number;
}

/**
 * Simple keyword-based RAG search engine.
 * In production, this would use vector embeddings (e.g., OpenAI embeddings + pgvector).
 * This implementation uses TF-IDF-like scoring with keyword matching.
 */
export function searchKnowledgeBase(query: string, limit: number = 5): SearchResult[] {
  const db = getDb();

  // Normalize query and translate non-English keywords to English for RAG search
  const normalizedQuery = query.toLowerCase().trim();
  const rawTerms = normalizedQuery
    .replace(/[^\w\s\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 1);

  // Map non-English terms to English equivalents for searching the English dataset
  const translatedTerms = rawTerms.flatMap(term => {
    const mapped = MULTILINGUAL_KEYWORDS[term];
    return mapped ? [term, ...mapped] : [term];
  });

  const queryTerms = translatedTerms
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  if (queryTerms.length === 0) {
    // Return top priority docs if no meaningful search terms
    const rows = db.prepare(`
      SELECT id, title, content, category, priority, source_url
      FROM knowledge_documents
      WHERE is_active = 1
      ORDER BY priority DESC
      LIMIT ?
    `).all(limit) as SearchResult[];
    return rows.map(r => ({ ...r, score: r.priority / 10 }));
  }

  // Get all active documents
  const docs = db.prepare(`
    SELECT id, title, content, category, priority, source_url, tags
    FROM knowledge_documents
    WHERE is_active = 1
  `).all() as (SearchResult & { tags: string })[];

  // Score each document
  const scored = docs.map(doc => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagsLower = (doc.tags || '').toLowerCase();
    const categoryLower = doc.category.toLowerCase();

    for (const term of queryTerms) {
      // Title match (highest weight)
      if (titleLower.includes(term)) score += 5;

      // Tag match (high weight)
      if (tagsLower.includes(term)) score += 4;

      // Category match
      if (categoryLower.includes(term)) score += 3;

      // Content match - count occurrences
      const regex = new RegExp(term, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        score += Math.min(matches.length * 1.5, 6); // Cap content score contribution
      }
    }

    // Boost by priority (1-10 scale)
    score *= (1 + doc.priority / 20);

    // Exact phrase match bonus
    if (contentLower.includes(normalizedQuery) || titleLower.includes(normalizedQuery)) {
      score *= 1.5;
    }

    return { ...doc, score };
  });

  // Sort by score and return top results
  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ tags, ...rest }) => rest);
}

/**
 * Build context string from search results for the AI prompt
 */
export function buildRAGContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant information found in the knowledge base.';
  }

  return results
    .map((r, i) => {
      const source = r.source_url ? `\nSource: ${r.source_url}` : '';
      return `[Document ${i + 1}: ${r.title}]\n${r.content}${source}`;
    })
    .join('\n\n---\n\n');
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that',
  'these', 'those', 'it', 'its', 'my', 'your', 'his', 'her', 'our',
  'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'not', 'no', 'nor', 'if', 'then', 'else', 'than', 'too', 'very',
  'just', 'about', 'above', 'after', 'again', 'all', 'also', 'any',
  'because', 'before', 'between', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'only', 'own', 'same', 'so', 'still',
  'here', 'there', 'out', 'up', 'down', 'off', 'over', 'under',
  'does', 'tell', 'me', 'you', 'know', 'get', 'got', 'want'
]);

/**
 * Multilingual keyword mapping to English for RAG search.
 * Maps common terms in supported languages to their English equivalents
 * so the English-only knowledge base can be searched effectively.
 * PWS 3.1.9: Multilingual Functionality with an English Dataset
 */
const MULTILINGUAL_KEYWORDS: Record<string, string[]> = {
  // Spanish
  'aplicar': ['apply', 'application'],
  'solicitud': ['apply', 'application'],
  'cómo': ['how'],
  'como': ['how'],
  'voluntario': ['volunteer'],
  'voluntariado': ['volunteer', 'volunteering'],
  'países': ['countries', 'where'],
  'paises': ['countries', 'where'],
  'dónde': ['where'],
  'donde': ['where'],
  'beneficios': ['benefits'],
  'elegibilidad': ['eligibility', 'eligible', 'requirements'],
  'requisitos': ['requirements', 'eligibility'],
  'reclutador': ['recruiter', 'connect'],
  'servir': ['serve', 'service'],
  'entrenamiento': ['training'],
  'capacitación': ['training'],
  'seguridad': ['safety', 'security'],
  'salud': ['health', 'medical'],
  'préstamos': ['loans', 'student'],
  'prestamos': ['loans', 'student'],
  'parejas': ['couples', 'partners'],
  'programas': ['programs'],
  'sectores': ['sectors'],
  'eventos': ['events'],
  'edad': ['age'],
  // French
  'postuler': ['apply', 'application'],
  'candidature': ['apply', 'application'],
  'volontaire': ['volunteer'],
  'bénévolat': ['volunteer', 'volunteering'],
  'avantages': ['benefits'],
  'éligibilité': ['eligibility', 'eligible'],
  'conditions': ['requirements', 'eligibility'],
  'recruteur': ['recruiter', 'connect'],
  'formation': ['training'],
  'sécurité': ['safety', 'security'],
  'santé': ['health', 'medical'],
  'prêts': ['loans', 'student'],
  'programmes': ['programs'],
  'secteurs': ['sectors'],
  // Portuguese
  'candidatar': ['apply', 'application'],
  'voluntário': ['volunteer'],
  'benefícios': ['benefits'],
  'elegibilidade': ['eligibility', 'eligible'],
  'treinamento': ['training'],
  'segurança': ['safety', 'security'],
  'saúde': ['health', 'medical'],
  'empréstimos': ['loans', 'student'],
  'casais': ['couples', 'partners'],
  'setores': ['sectors'],
  // Chinese
  '申请': ['apply', 'application'],
  '志愿者': ['volunteer'],
  '志愿': ['volunteer', 'volunteering'],
  '国家': ['countries', 'where'],
  '福利': ['benefits'],
  '资格': ['eligibility', 'eligible', 'requirements'],
  '要求': ['requirements', 'eligibility'],
  '招聘': ['recruiter', 'connect'],
  '服务': ['serve', 'service'],
  '培训': ['training'],
  '安全': ['safety', 'security'],
  '健康': ['health', 'medical'],
  '贷款': ['loans', 'student'],
  '夫妇': ['couples', 'partners'],
  '项目': ['programs'],
  '如何': ['how'],
  '哪里': ['where'],
  '和平队': ['peace', 'corps'],
  // Arabic
  'التقدم': ['apply', 'application'],
  'تطوع': ['volunteer'],
  'متطوع': ['volunteer'],
  'بلدان': ['countries', 'where'],
  'فوائد': ['benefits'],
  'أهلية': ['eligibility', 'eligible'],
  'متطلبات': ['requirements', 'eligibility'],
  'مجند': ['recruiter', 'connect'],
  'خدمة': ['serve', 'service'],
  'تدريب': ['training'],
  'سلامة': ['safety', 'security'],
  'صحة': ['health', 'medical'],
  'قروض': ['loans', 'student'],
  'أزواج': ['couples', 'partners'],
  'برامج': ['programs'],
  'كيف': ['how'],
  'أين': ['where'],
  'السلام': ['peace', 'corps'],
};
