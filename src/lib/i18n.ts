/**
 * Multilingual support module
 * PWS 3.1.9: Multilingual Functionality with an English Dataset
 *
 * The chatbot supports interaction in multiple languages while using
 * a single-source RAG populated entirely with an English dataset.
 * Translations are pre-defined for common UI strings and responses.
 *
 * In production with an LLM API (OpenAI/Claude), the model itself handles
 * translation. This module provides a fallback for the built-in response engine.
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'pt' | 'zh' | 'ar';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  zh: '中文',
  ar: 'العربية',
};

// Greeting patterns in all supported languages
export const GREETING_PATTERNS: Record<SupportedLanguage, RegExp> = {
  en: /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy)/i,
  es: /^(hola|buenos?\s*(d[ií]as?|tardes?|noches?)|saludos|qu[ée]\s*tal)/i,
  fr: /^(bonjour|bonsoir|salut|coucou|bienvenue)/i,
  pt: /^(ol[aá]|bom\s*(dia|tarde|noite)|oi|e\s*a[ií])/i,
  zh: /^(你好|您好|嗨|早上好|下午好|晚上好|哈[喽啰])/,
  ar: /^(مرحبا|السلام\s*عليكم|أهلا|صباح\s*الخير|مساء\s*الخير)/,
};

// Thanks patterns in all supported languages
export const THANKS_PATTERNS: Record<SupportedLanguage, RegExp> = {
  en: /^(thank|thanks|thx|ty|appreciate)/i,
  es: /^(gracias|muchas\s*gracias)/i,
  fr: /^(merci|je\s*vous\s*remercie)/i,
  pt: /^(obrigad[oa]|muito\s*obrigad[oa]|valeu)/i,
  zh: /^(谢谢|感谢|多谢)/,
  ar: /^(شكرا|شكراً|جزاك)/,
};

// Common question patterns to detect language
export const LANGUAGE_DETECT_PATTERNS: { lang: SupportedLanguage; pattern: RegExp }[] = [
  { lang: 'es', pattern: /\b(cómo|qué|dónde|cuándo|puedo|quiero|necesito|aplicar|voluntario|países|beneficios)\b/i },
  { lang: 'fr', pattern: /\b(comment|quoi|où|quand|puis-je|veux|postuler|volontaire|pays|avantages)\b/i },
  { lang: 'pt', pattern: /\b(como|que|onde|quando|posso|quero|aplicar|voluntário|países|benefícios)\b/i },
  { lang: 'zh', pattern: /(如何|什么|哪里|什么时候|申请|志愿者|国家|福利|和平队)/ },
  { lang: 'ar', pattern: /(كيف|ماذا|أين|متى|التقدم|متطوع|بلدان|فوائد|السلام)/ },
];

interface TranslationSet {
  greeting: string;
  thanks: string;
  noResults: string;
  hipaaRedirect: string;
  learnMore: string;
  relatedTopics: string;
  wantMore: string;
  applyNow: string;
  talkToRecruiter: string;
  helpfulTopics: string;
  topicApply: string;
  topicPrograms: string;
  topicCountries: string;
  topicBenefits: string;
  topicEligibility: string;
  topicRecruiter: string;
  whatToKnow: string;
  goodLuck: string;
  anythingElse: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationSet> = {
  en: {
    greeting: `Hello! Welcome to the Peace Corps. I'm the Peace Corps Virtual Assistant, and I'm here to help you learn about volunteer opportunities, the application process, and everything Peace Corps.`,
    thanks: `You're welcome! I'm glad I could help. If you have more questions about Peace Corps, feel free to ask anytime.`,
    noResults: `Thank you for your question! Unfortunately, I don't have specific information about that in my knowledge base.`,
    hipaaRedirect: `I understand you have a question that may involve personal health or medical information. For the privacy and security of your information, I'm not able to handle health-related inquiries directly.`,
    learnMore: `Learn more`,
    relatedTopics: `Related topics`,
    wantMore: `Would you like to know more, or would you prefer to`,
    applyNow: `Apply now`,
    talkToRecruiter: `connect with a recruiter`,
    helpfulTopics: `Here are some popular topics I can help with`,
    topicApply: `How to apply to Peace Corps`,
    topicPrograms: `Volunteer programs (PCV, Peace Corps Response, Virtual Service)`,
    topicCountries: `Where Volunteers serve around the world`,
    topicBenefits: `Benefits of Peace Corps service`,
    topicEligibility: `Eligibility requirements`,
    topicRecruiter: `Connect with a recruiter`,
    whatToKnow: `What would you like to know?`,
    goodLuck: `Best of luck on your journey!`,
    anythingElse: `Is there anything else I can help you with?`,
  },
  es: {
    greeting: `¡Hola! Bienvenido/a al Cuerpo de Paz. Soy el Asistente Virtual del Cuerpo de Paz y estoy aquí para ayudarte a conocer las oportunidades de voluntariado, el proceso de solicitud y todo sobre el Cuerpo de Paz.`,
    thanks: `¡De nada! Me alegro de poder ayudar. Si tienes más preguntas sobre el Cuerpo de Paz, no dudes en preguntar en cualquier momento.`,
    noResults: `¡Gracias por tu pregunta! Lamentablemente, no tengo información específica sobre eso en mi base de conocimientos.`,
    hipaaRedirect: `Entiendo que tienes una pregunta que puede involucrar información médica o de salud personal. Por la privacidad y seguridad de tu información, no puedo manejar consultas relacionadas con la salud directamente.`,
    learnMore: `Más información`,
    relatedTopics: `Temas relacionados`,
    wantMore: `¿Te gustaría saber más, o prefieres`,
    applyNow: `Aplica ahora`,
    talkToRecruiter: `hablar con un reclutador`,
    helpfulTopics: `Estos son algunos temas populares en los que puedo ayudarte`,
    topicApply: `Cómo aplicar al Cuerpo de Paz`,
    topicPrograms: `Programas de voluntariado (PCV, Respuesta del Cuerpo de Paz, Servicio Virtual)`,
    topicCountries: `Dónde sirven los voluntarios en el mundo`,
    topicBenefits: `Beneficios del servicio en el Cuerpo de Paz`,
    topicEligibility: `Requisitos de elegibilidad`,
    topicRecruiter: `Conectar con un reclutador`,
    whatToKnow: `¿Qué te gustaría saber?`,
    goodLuck: `¡Mucha suerte en tu camino!`,
    anythingElse: `¿Hay algo más en lo que pueda ayudarte?`,
  },
  fr: {
    greeting: `Bonjour ! Bienvenue au Corps de la Paix. Je suis l'Assistant Virtuel du Corps de la Paix et je suis là pour vous aider à découvrir les opportunités de bénévolat, le processus de candidature et tout ce qui concerne le Corps de la Paix.`,
    thanks: `De rien ! Je suis heureux d'avoir pu vous aider. Si vous avez d'autres questions sur le Corps de la Paix, n'hésitez pas à demander.`,
    noResults: `Merci pour votre question ! Malheureusement, je n'ai pas d'informations spécifiques à ce sujet dans ma base de connaissances.`,
    hipaaRedirect: `Je comprends que vous avez une question qui peut impliquer des informations médicales ou de santé personnelle. Pour la confidentialité et la sécurité de vos informations, je ne peux pas traiter directement les questions liées à la santé.`,
    learnMore: `En savoir plus`,
    relatedTopics: `Sujets connexes`,
    wantMore: `Souhaitez-vous en savoir plus, ou préférez-vous`,
    applyNow: `Postuler maintenant`,
    talkToRecruiter: `parler à un recruteur`,
    helpfulTopics: `Voici quelques sujets populaires sur lesquels je peux vous aider`,
    topicApply: `Comment postuler au Corps de la Paix`,
    topicPrograms: `Programmes de bénévolat (PCV, Réponse du Corps de la Paix, Service Virtuel)`,
    topicCountries: `Où les bénévoles servent dans le monde`,
    topicBenefits: `Avantages du service au Corps de la Paix`,
    topicEligibility: `Conditions d'éligibilité`,
    topicRecruiter: `Contacter un recruteur`,
    whatToKnow: `Que souhaitez-vous savoir ?`,
    goodLuck: `Bonne chance dans votre parcours !`,
    anythingElse: `Y a-t-il autre chose que je puisse faire pour vous ?`,
  },
  pt: {
    greeting: `Olá! Bem-vindo/a ao Corpo de Paz. Sou o Assistente Virtual do Corpo de Paz e estou aqui para ajudá-lo/a a conhecer as oportunidades de voluntariado, o processo de candidatura e tudo sobre o Corpo de Paz.`,
    thanks: `De nada! Fico feliz em poder ajudar. Se tiver mais perguntas sobre o Corpo de Paz, sinta-se à vontade para perguntar a qualquer momento.`,
    noResults: `Obrigado pela sua pergunta! Infelizmente, não tenho informações específicas sobre isso na minha base de conhecimento.`,
    hipaaRedirect: `Entendo que você tem uma pergunta que pode envolver informações médicas ou de saúde pessoal. Pela privacidade e segurança das suas informações, não posso lidar diretamente com consultas relacionadas à saúde.`,
    learnMore: `Saiba mais`,
    relatedTopics: `Tópicos relacionados`,
    wantMore: `Gostaria de saber mais, ou prefere`,
    applyNow: `Candidate-se agora`,
    talkToRecruiter: `falar com um recrutador`,
    helpfulTopics: `Aqui estão alguns tópicos populares em que posso ajudar`,
    topicApply: `Como se candidatar ao Corpo de Paz`,
    topicPrograms: `Programas de voluntariado (PCV, Resposta do Corpo de Paz, Serviço Virtual)`,
    topicCountries: `Onde os voluntários servem ao redor do mundo`,
    topicBenefits: `Benefícios do serviço no Corpo de Paz`,
    topicEligibility: `Requisitos de elegibilidade`,
    topicRecruiter: `Conectar com um recrutador`,
    whatToKnow: `O que você gostaria de saber?`,
    goodLuck: `Boa sorte na sua jornada!`,
    anythingElse: `Há mais alguma coisa em que eu possa ajudar?`,
  },
  zh: {
    greeting: `你好！欢迎来到和平队。我是和平队虚拟助手，在这里帮助你了解志愿者机会、申请流程以及关于和平队的一切。`,
    thanks: `不客气！很高兴能够帮助你。如果你还有关于和平队的问题，随时可以问我。`,
    noResults: `感谢你的提问！很遗憾，我的知识库中没有关于这个问题的具体信息。`,
    hipaaRedirect: `我理解你的问题可能涉及个人健康或医疗信息。为了保护你的信息隐私和安全，我无法直接处理与健康相关的查询。`,
    learnMore: `了解更多`,
    relatedTopics: `相关主题`,
    wantMore: `你想了解更多，还是更愿意`,
    applyNow: `立即申请`,
    talkToRecruiter: `联系招聘人员`,
    helpfulTopics: `以下是一些我可以帮助你的热门话题`,
    topicApply: `如何申请和平队`,
    topicPrograms: `志愿者项目（PCV、和平队响应、虚拟服务）`,
    topicCountries: `志愿者在世界各地服务的地方`,
    topicBenefits: `和平队服务的福利`,
    topicEligibility: `资格要求`,
    topicRecruiter: `联系招聘人员`,
    whatToKnow: `你想了解什么？`,
    goodLuck: `祝你旅途顺利！`,
    anythingElse: `还有其他我能帮助你的吗？`,
  },
  ar: {
    greeting: `مرحباً! أهلاً بك في فيلق السلام. أنا المساعد الافتراضي لفيلق السلام، وأنا هنا لمساعدتك في التعرف على فرص التطوع وعملية التقديم وكل ما يتعلق بفيلق السلام.`,
    thanks: `على الرحب والسعة! سعيد بمساعدتك. إذا كان لديك المزيد من الأسئلة حول فيلق السلام، لا تتردد في السؤال في أي وقت.`,
    noResults: `شكراً لسؤالك! للأسف، ليس لدي معلومات محددة حول ذلك في قاعدة معرفتي.`,
    hipaaRedirect: `أفهم أن لديك سؤالاً قد يتضمن معلومات صحية أو طبية شخصية. من أجل خصوصية وأمان معلوماتك، لا أستطيع التعامل مع الاستفسارات المتعلقة بالصحة مباشرة.`,
    learnMore: `اقرأ المزيد`,
    relatedTopics: `مواضيع ذات صلة`,
    wantMore: `هل تريد معرفة المزيد، أم تفضل`,
    applyNow: `قدم الآن`,
    talkToRecruiter: `التحدث مع مجند`,
    helpfulTopics: `إليك بعض المواضيع الشائعة التي يمكنني مساعدتك فيها`,
    topicApply: `كيفية التقدم لفيلق السلام`,
    topicPrograms: `برامج التطوع (PCV، استجابة فيلق السلام، الخدمة الافتراضية)`,
    topicCountries: `أين يخدم المتطوعون حول العالم`,
    topicBenefits: `فوائد الخدمة في فيلق السلام`,
    topicEligibility: `متطلبات الأهلية`,
    topicRecruiter: `التواصل مع مجند`,
    whatToKnow: `ماذا تريد أن تعرف؟`,
    goodLuck: `حظاً سعيداً في رحلتك!`,
    anythingElse: `هل هناك شيء آخر يمكنني مساعدتك به؟`,
  },
};

/**
 * Detect language from message content if not explicitly set
 */
export function detectLanguage(message: string): SupportedLanguage {
  for (const { lang, pattern } of LANGUAGE_DETECT_PATTERNS) {
    if (pattern.test(message)) return lang;
  }
  // Check greetings
  for (const [lang, pattern] of Object.entries(GREETING_PATTERNS)) {
    if (lang !== 'en' && pattern.test(message)) return lang as SupportedLanguage;
  }
  return 'en';
}

/**
 * Check if message is a greeting in any supported language
 */
export function isGreeting(message: string, language: SupportedLanguage): boolean {
  // Check current language first, then all languages
  if (GREETING_PATTERNS[language]?.test(message)) return true;
  return Object.values(GREETING_PATTERNS).some(p => p.test(message));
}

/**
 * Check if message is a thank-you in any supported language
 */
export function isThanks(message: string, language: SupportedLanguage): boolean {
  if (THANKS_PATTERNS[language]?.test(message)) return true;
  return Object.values(THANKS_PATTERNS).some(p => p.test(message));
}

/**
 * Get translations for a language, falling back to English
 */
export function t(language: string): TranslationSet {
  return TRANSLATIONS[language as SupportedLanguage] || TRANSLATIONS.en;
}
