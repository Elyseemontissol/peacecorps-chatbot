'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Citation {
  title: string;
  url: string | null;
  score?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isEmergency?: boolean;
  sources?: Citation[];
  timestamp: Date;
  feedbackGiven?: 'up' | 'down' | null;
  quickReplies?: string[];
}

type Language = 'en' | 'es' | 'fr' | 'pt' | 'zh' | 'ar';

// ---------------------------------------------------------------------------
// Constants & i18n
// ---------------------------------------------------------------------------

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
];

const DEFAULT_QUICK_REPLIES = [
  'How do I apply?',
  'Where can I serve?',
  'What are the benefits?',
  'Talk to a recruiter',
];

const UI: Record<
  Language,
  {
    placeholder: string;
    send: string;
    talkToPerson: string;
    minimize: string;
    consentText: string;
    consentAccept: string;
    consentDecline: string;
    botName: string;
    botSubtitle: string;
    typing: string;
    queuePosition: string;
    queueWait: string;
    escalating: string;
    errorGeneric: string;
    feedbackThanks: string;
    emergencyLabel: string;
    newChat: string;
    openChat: string;
    sources: string;
    helpful: string;
    escalateTitle: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    reasonPlaceholder: string;
    cancel: string;
    joinQueue: string;
    disclaimer: string;
  }
> = {
  en: {
    placeholder: 'Type your question...',
    send: 'Send',
    talkToPerson: 'Talk to a Person',
    minimize: 'Minimize chat',
    consentText:
      'This is an AI assistant. Your conversations may be recorded for quality improvement. By continuing, you consent to data collection per our privacy policy.',
    consentAccept: 'I Understand, Continue',
    consentDecline: 'Decline',
    botName: 'Peace Corps Assistant',
    botSubtitle: 'AI-powered chatbot',
    typing: 'AI Assistant is typing',
    queuePosition: 'Queue position',
    queueWait: 'Est. wait',
    escalating: 'Connecting you to a live representative...',
    errorGeneric: 'Something went wrong. Please try again.',
    feedbackThanks: 'Thanks for your feedback!',
    emergencyLabel: 'IMPORTANT SAFETY INFORMATION',
    newChat: 'New conversation',
    openChat: 'Open Peace Corps chat assistant',
    sources: 'Sources',
    helpful: 'Helpful?',
    escalateTitle: 'Connect with a Peace Corps Representative',
    namePlaceholder: 'Your name (optional)',
    emailPlaceholder: 'Email (optional)',
    reasonPlaceholder: 'How can we help you? *',
    cancel: 'Cancel',
    joinQueue: 'Join Queue',
    disclaimer: 'Responses may not always be accurate. Verify important information on peacecorps.gov.',
  },
  es: {
    placeholder: 'Escribe tu pregunta...',
    send: 'Enviar',
    talkToPerson: 'Hablar con una persona',
    minimize: 'Minimizar',
    consentText:
      'Este es un asistente de IA. Sus conversaciones pueden ser grabadas para mejorar la calidad. Al continuar, usted consiente la recopilación de datos según nuestra política de privacidad.',
    consentAccept: 'Entiendo, Continuar',
    consentDecline: 'Rechazar',
    botName: 'Asistente del Cuerpo de Paz',
    botSubtitle: 'Chatbot con IA',
    typing: 'El asistente está escribiendo',
    queuePosition: 'Posición en cola',
    queueWait: 'Espera est.',
    escalating: 'Conectándote con un representante...',
    errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    feedbackThanks: '¡Gracias por tus comentarios!',
    emergencyLabel: 'INFORMACIÓN DE SEGURIDAD IMPORTANTE',
    newChat: 'Nueva conversación',
    openChat: 'Abrir asistente de chat',
    sources: 'Fuentes',
    helpful: '¿Útil?',
    escalateTitle: 'Conectar con un representante del Cuerpo de Paz',
    namePlaceholder: 'Tu nombre (opcional)',
    emailPlaceholder: 'Correo electrónico (opcional)',
    reasonPlaceholder: '¿Cómo podemos ayudarte? *',
    cancel: 'Cancelar',
    joinQueue: 'Unirse a la cola',
    disclaimer: 'Las respuestas pueden no ser siempre exactas.',
  },
  fr: {
    placeholder: 'Posez votre question...',
    send: 'Envoyer',
    talkToPerson: 'Parler à une personne',
    minimize: 'Réduire',
    consentText:
      "Ceci est un assistant IA. Vos conversations peuvent être enregistrées pour améliorer la qualité. En continuant, vous consentez à la collecte de données selon notre politique de confidentialité.",
    consentAccept: "J'accepte, Continuer",
    consentDecline: 'Refuser',
    botName: 'Assistant du Corps de la Paix',
    botSubtitle: 'Chatbot IA',
    typing: "L'assistant écrit",
    queuePosition: 'Position dans la file',
    queueWait: 'Attente est.',
    escalating: 'Connexion à un représentant...',
    errorGeneric: "Quelque chose s'est mal passé. Veuillez réessayer.",
    feedbackThanks: 'Merci pour votre retour !',
    emergencyLabel: "INFORMATION DE SÉCURITÉ IMPORTANTE",
    newChat: 'Nouvelle conversation',
    openChat: 'Ouvrir le chat',
    sources: 'Sources',
    helpful: 'Utile ?',
    escalateTitle: 'Contacter un représentant du Corps de la Paix',
    namePlaceholder: 'Votre nom (optionnel)',
    emailPlaceholder: 'E-mail (optionnel)',
    reasonPlaceholder: 'Comment pouvons-nous vous aider ? *',
    cancel: 'Annuler',
    joinQueue: 'Rejoindre la file',
    disclaimer: 'Les réponses peuvent ne pas toujours être exactes.',
  },
  pt: {
    placeholder: 'Digite sua pergunta...',
    send: 'Enviar',
    talkToPerson: 'Falar com uma pessoa',
    minimize: 'Minimizar',
    consentText:
      'Este é um assistente de IA. Suas conversas podem ser gravadas para melhoria da qualidade. Ao continuar, você consente com a coleta de dados conforme nossa política de privacidade.',
    consentAccept: 'Entendi, Continuar',
    consentDecline: 'Recusar',
    botName: 'Assistente do Corpo de Paz',
    botSubtitle: 'Chatbot com IA',
    typing: 'O assistente está digitando',
    queuePosition: 'Posição na fila',
    queueWait: 'Espera est.',
    escalating: 'Conectando você a um representante...',
    errorGeneric: 'Algo deu errado. Tente novamente.',
    feedbackThanks: 'Obrigado pelo feedback!',
    emergencyLabel: 'INFORMAÇÃO DE SEGURANÇA IMPORTANTE',
    newChat: 'Nova conversa',
    openChat: 'Abrir assistente de chat',
    sources: 'Fontes',
    helpful: 'Útil?',
    escalateTitle: 'Falar com um representante do Corpo de Paz',
    namePlaceholder: 'Seu nome (opcional)',
    emailPlaceholder: 'E-mail (opcional)',
    reasonPlaceholder: 'Como podemos ajudar? *',
    cancel: 'Cancelar',
    joinQueue: 'Entrar na fila',
    disclaimer: 'As respostas podem não ser sempre precisas.',
  },
  zh: {
    placeholder: '输入您的问题...',
    send: '发送',
    talkToPerson: '联系真人客服',
    minimize: '最小化',
    consentText:
      '这是一个AI助手。您的对话可能会被记录以提高服务质量。继续使用即表示您同意按照我们的隐私政策收集数据。',
    consentAccept: '我理解，继续',
    consentDecline: '拒绝',
    botName: '和平队助手',
    botSubtitle: 'AI聊天机器人',
    typing: 'AI助手正在输入',
    queuePosition: '排队位置',
    queueWait: '预计等待',
    escalating: '正在为您连接人工客服...',
    errorGeneric: '出了点问题，请重试。',
    feedbackThanks: '感谢您的反馈！',
    emergencyLabel: '重要安全信息',
    newChat: '新对话',
    openChat: '打开聊天助手',
    sources: '来源',
    helpful: '有帮助吗？',
    escalateTitle: '联系和平队代表',
    namePlaceholder: '您的姓名（可选）',
    emailPlaceholder: '电子邮件（可选）',
    reasonPlaceholder: '我们如何帮助您？*',
    cancel: '取消',
    joinQueue: '加入队列',
    disclaimer: '回复可能并不总是准确的。',
  },
  ar: {
    placeholder: 'اكتب سؤالك...',
    send: 'إرسال',
    talkToPerson: 'التحدث مع شخص',
    minimize: 'تصغير',
    consentText:
      'هذا مساعد ذكاء اصطناعي. قد يتم تسجيل محادثاتك لتحسين الجودة. بالمتابعة، فإنك توافق على جمع البيانات وفقًا لسياسة الخصوصية الخاصة بنا.',
    consentAccept: 'أفهم، متابعة',
    consentDecline: 'رفض',
    botName: 'مساعد فيلق السلام',
    botSubtitle: 'روبوت دردشة بالذكاء الاصطناعي',
    typing: 'المساعد يكتب',
    queuePosition: 'موقعك في الانتظار',
    queueWait: 'وقت الانتظار',
    escalating: 'جاري توصيلك بممثل...',
    errorGeneric: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    feedbackThanks: 'شكرًا لملاحظاتك!',
    emergencyLabel: 'معلومات سلامة مهمة',
    newChat: 'محادثة جديدة',
    openChat: 'فتح مساعد الدردشة',
    sources: 'المصادر',
    helpful: 'مفيد؟',
    escalateTitle: 'التواصل مع ممثل فيلق السلام',
    namePlaceholder: 'اسمك (اختياري)',
    emailPlaceholder: 'البريد الإلكتروني (اختياري)',
    reasonPlaceholder: 'كيف يمكننا مساعدتك؟ *',
    cancel: 'إلغاء',
    joinQueue: 'انضم إلى قائمة الانتظار',
    disclaimer: 'قد لا تكون الردود دقيقة دائمًا.',
  },
};

const WELCOME_CONTENT: Record<Language, string> = {
  en: `Hello! I'm the Peace Corps Virtual Assistant, an AI chatbot here to help you learn about the Peace Corps.\n\nI can answer questions about:\n- **How to apply** to Peace Corps\n- **Volunteer programs** and assignments\n- **Where Volunteers serve** around the world\n- **Benefits** and eligibility\n\nWhat would you like to know?`,
  es: `¡Hola! Soy el Asistente Virtual del Cuerpo de Paz, un chatbot de IA aquí para ayudarle.\n\n¿En qué puedo ayudarle?`,
  fr: `Bonjour ! Je suis l'Assistant Virtuel du Corps de la Paix, un chatbot IA pour vous aider.\n\nComment puis-je vous aider ?`,
  pt: `Olá! Sou o Assistente Virtual do Corpo de Paz, um chatbot de IA para ajudá-lo.\n\nComo posso ajudá-lo?`,
  zh: `你好！我是和平队虚拟助手，一个AI聊天机器人，帮助您了解和平队。\n\n您想知道什么？`,
  ar: `مرحبًا! أنا المساعد الافتراضي لفيلق السلام، روبوت دردشة بالذكاء الاصطناعي لمساعدتك.\n\nكيف يمكنني مساعدتك؟`,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateId();
  const key = 'pc-chat-session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
}

function readConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pc-chat-consent') === 'true';
}

function writeConsent(val: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pc-chat-consent', val ? 'true' : 'false');
  }
}

/** Minimal safe markdown renderer (bold, italic, links, unordered & ordered lists, line breaks). */
function renderMarkdown(raw: string): string {
  let text = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // italic *text*
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // links [label](url)
  text = text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">$1</a>',
  );

  // Process line-by-line for lists
  const lines = text.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);

    if (ulMatch) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul class="list-disc ml-5 my-1 space-y-0.5">'); inUl = true; }
      out.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol class="list-decimal ml-5 my-1 space-y-0.5">'); inOl = true; }
      out.push(`<li>${olMatch[1]}</li>`);
    } else {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(line);
    }
  }
  if (inUl) out.push('</ul>');
  if (inOl) out.push('</ol>');

  text = out.join('\n');
  // line breaks (skip around block elements)
  text = text.replace(/\n/g, '<br/>');
  text = text
    .replace(/<br\/>\s*<ul/g, '<ul')
    .replace(/<\/ul>\s*<br\/>/g, '</ul>')
    .replace(/<br\/>\s*<ol/g, '<ol')
    .replace(/<\/ol>\s*<br\/>/g, '</ol>');

  return text;
}

// ---------------------------------------------------------------------------
// Inline SVG icons (no external deps)
// ---------------------------------------------------------------------------

function IconChat({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconClose({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconMinimize({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconPerson({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
    </svg>
  );
}

function IconGlobe({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM4.332 8.027a6.012 6.012 0 0 1 1.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 0 1 9 7.5V8a2 2 0 0 0 4 0 2 2 0 0 1 1.523-1.943 6.02 6.02 0 0 1 .977 2.17c-.174.255-.29.553-.312.872l-.098 1.401a2 2 0 0 1-.847 1.505l-.39.26a1.5 1.5 0 0 0-.677 1.21v.058a2 2 0 0 1-2 2h-.176a2 2 0 0 1-1.999-1.923L9 11.25a1 1 0 0 0-1-1H6.463a1 1 0 0 1-.952-.69l-.138-.46a1 1 0 0 0-.627-.632l-.346-.115Z" />
    </svg>
  );
}

function IconRefresh({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.568a.75.75 0 0 0-.75.75v3.664a.75.75 0 0 0 1.5 0v-1.87l.239.24a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.457-.362Zm1.12-7.838a.75.75 0 0 0-1.5 0v1.87l-.239-.24a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.457.362 5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.664a.75.75 0 0 0 .75-.75V3.586Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconSend({ className = 'w-5 h-5', rtl = false }: { className?: string; rtl?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`${className} ${rtl ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconThumbUp({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M1 8.998a1 1 0 0 1 1-1h3v9H2a1 1 0 0 1-1-1v-7Zm5.5 8h6.377a2.5 2.5 0 0 0 2.45-2.01l1.12-5.5A1.5 1.5 0 0 0 14.978 6.998H11V3.498a2 2 0 0 0-2-2h-.25a.75.75 0 0 0-.68.436L6.5 6.498v10.5Z" />
    </svg>
  );
}

function IconThumbDown({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 11.002a1 1 0 0 1-1 1h-3v-9h3a1 1 0 0 1 1 1v7Zm-5.5-8H7.123a2.5 2.5 0 0 0-2.45 2.01l-1.12 5.5a1.5 1.5 0 0 0 1.469 1.99H9v3.5a2 2 0 0 0 2 2h.25a.75.75 0 0 0 .68-.436l1.57-4.064V3.002Z" />
    </svg>
  );
}

function IconLock({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconWarning({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated three-dot typing indicator with screen-reader support. */
function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2 animate-fade-in" role="status" aria-label={label}>
      <div className="w-6 h-6 rounded-full bg-[#1a2e5a] flex items-center justify-center shrink-0 mt-0.5">
        <IconChat className="w-3 h-3 text-white" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
        <span className="block w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        <span style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap'}}>{label}</span>
      </div>
    </div>
  );
}

/** Thumbs-up / thumbs-down feedback on a bot message. */
function FeedbackButtons({
  messageId,
  current,
  onFeedback,
  helpfulLabel,
  thanksLabel,
}: {
  messageId: string;
  current: 'up' | 'down' | null | undefined;
  onFeedback: (id: string, type: 'up' | 'down') => void;
  helpfulLabel: string;
  thanksLabel: string;
}) {
  if (current) {
    return (
      <span className="text-[10px] text-gray-400 italic" role="status">
        {current === 'up' ? '👍' : '👎'} {thanksLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400">{helpfulLabel}</span>
      <button
        type="button"
        onClick={() => onFeedback(messageId, 'up')}
        className="p-1 rounded hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] transition-colors"
        aria-label="This was helpful"
      >
        <IconThumbUp className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
      </button>
      <button
        type="button"
        onClick={() => onFeedback(messageId, 'down')}
        className="p-1 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] transition-colors"
        aria-label="This was not helpful"
      >
        <IconThumbDown className="w-3.5 h-3.5 text-gray-400 hover:text-red-600" />
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main ChatWidget
// ---------------------------------------------------------------------------

export default function ChatWidget() {
  // ---- State ----
  const [isOpen, setIsOpen] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [queueInfo, setQueueInfo] = useState<{ position: number; estimatedWait: number } | null>(null);
  const [escalationName, setEscalationName] = useState('');
  const [escalationEmail, setEscalationEmail] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ---- Refs ----
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = UI[language];
  const isRtl = language === 'ar';

  // ---- Init session + consent from storage ----
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    if (readConsent()) setShowConsent(false);
  }, []);

  // ---- Create welcome message when consent accepted ----
  function createWelcomeMessage(lang: Language): Message {
    return {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_CONTENT[lang],
      timestamp: new Date(),
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // ---- Auto-scroll ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ---- Focus management ----
  useEffect(() => {
    if (isOpen && !showConsent) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen, showConsent]);

  // ---- Escape to close ----
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // ---- Close lang menu on outside click ----
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // ---- Announce new bot messages to screen readers ----
  const liveRegionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === 'assistant' && liveRegionRef.current) {
      liveRegionRef.current.textContent = last.content;
    }
  }, [messages]);

  // =========================================================================
  // API: Send chat message
  // =========================================================================
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setError(null);
      setIsLoading(true);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
            sessionId,
            language,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        const botMsg: Message = {
          id: data.id || generateId(),
          role: 'assistant',
          content: data.content || data.reply || data.message || 'Sorry, I encountered an error. Please try again.',
          isEmergency: data.isEmergency ?? false,
          sources: data.sources ?? data.citations ?? [],
          timestamp: new Date(),
          quickReplies: data.quickReplies ?? DEFAULT_QUICK_REPLIES,
          feedbackGiven: null,
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch {
        setError(t.errorGeneric);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            content:
              "I'm sorry, I'm having trouble connecting. Please try again or [connect with a recruiter](https://www.peacecorps.gov/connect/recruiter/).",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, sessionId, language, isLoading, t.errorGeneric],
  );

  // =========================================================================
  // API: Live agent escalation
  // =========================================================================
  const handleEscalation = useCallback(async () => {
    if (!escalationReason.trim()) return;
    setError(null);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId || 'none',
          sessionId,
          language,
          userName: escalationName,
          userEmail: escalationEmail,
          reason: escalationReason,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setQueueInfo({
        position: data.position ?? data.queuePosition ?? 1,
        estimatedWait: data.estimatedWait ?? 5,
      });
      setShowEscalation(false);
      setEscalationName('');
      setEscalationEmail('');
      setEscalationReason('');

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'system',
          content: `You've been placed in the queue to speak with a Peace Corps representative. **Position: #${data.position ?? 1}** | **Estimated wait: ${data.estimatedWait ?? 5} minutes**\n\nA representative will be with you as soon as possible. Thank you for your patience!`,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'system',
          content:
            'Unable to connect to the queue. Please try calling **1-855-855-1961** or visiting [peacecorps.gov/connect/recruiter/](https://www.peacecorps.gov/connect/recruiter/).',
          timestamp: new Date(),
        },
      ]);
    }
  }, [conversationId, sessionId, language, escalationName, escalationEmail, escalationReason]);

  // =========================================================================
  // API: Feedback
  // =========================================================================
  const handleFeedback = useCallback(
    async (messageId: string, rating: 'up' | 'down') => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: rating } : m)),
      );
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            conversationId,
            sessionId,
            feedback: rating,
            rating: rating === 'up' ? 5 : 1,
          }),
        });
      } catch {
        // Non-critical, fail silently
      }
    },
    [conversationId, sessionId],
  );

  // =========================================================================
  // Handlers
  // =========================================================================

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleConsentAccept() {
    setShowConsent(false);
    writeConsent(true);
    setMessages([createWelcomeMessage(language)]);
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  function handleConsentDecline() {
    setIsOpen(false);
  }

  function handleQuickReply(text: string) {
    if (text === 'Talk to a recruiter') {
      setShowEscalation(true);
    } else {
      sendMessage(text);
    }
  }

  function handleNewConversation() {
    setMessages([createWelcomeMessage(language)]);
    setConversationId(null);
    setQueueInfo(null);
    setError(null);
    setShowEscalation(false);
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <>
      {/* Screen reader live region – always hidden */}
      <div
        ref={liveRegionRef}
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        aria-live="assertive"
        aria-atomic="true"
        role="status"
      />

      {/* Floating toggle button – shown when chat is CLOSED */}
      {!isOpen && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99999 }}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-[#1a2e5a] text-white shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#1a2e5a]/40 transition-all duration-200"
            aria-label={t.openChat}
            aria-haspopup="dialog"
          >
            <IconChat className="w-7 h-7" />
            <span
              className="absolute top-0 right-0 w-4 h-4 bg-[#cf4a31] rounded-full border-2 border-white animate-pulse"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {/* Chat window – shown when chat is OPEN */}
      {isOpen && (
      <div
        className="pc-chat-window"
        role="dialog"
        aria-label={t.botName}
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div
          ref={chatRef}
          className="pc-chat-inner"
        >
          {/* ================================================================
              HEADER
          ================================================================= */}
          <header className="flex items-center justify-between gap-2 px-4 py-3 bg-[#1a2e5a] text-white shrink-0">
            {/* Brand */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0" aria-hidden="true">
                <IconChat className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold truncate" id="chat-title">
                  {t.botName}
                </h2>
                <p className="text-[10px] text-white/70">{t.botSubtitle}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Support Ticket - Glowing */}
              <a
                href="/tickets"
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded text-white pc-glow-btn"
                style={{ animationDuration: '2.5s' }}
                aria-label="Open support ticket"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support
              </a>

              {/* Talk to a Person (desktop) */}
              <button
                type="button"
                onClick={() => setShowEscalation(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-[#cf4a31] hover:bg-[#b8402b] focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                aria-label={t.talkToPerson}
              >
                <IconPerson className="w-3.5 h-3.5" />
                {t.talkToPerson}
              </button>

              {/* Language selector */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowLangMenu((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                  aria-haspopup="listbox"
                  aria-expanded={showLangMenu}
                  aria-label={`Language: ${LANGUAGES.find((l) => l.code === language)?.label}`}
                >
                  <IconGlobe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {LANGUAGES.find((l) => l.code === language)?.label}
                  </span>
                </button>
                {showLangMenu && (
                  <ul
                    role="listbox"
                    aria-label="Select language"
                    className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                  >
                    {LANGUAGES.map((l) => (
                      <li key={l.code} role="option" aria-selected={l.code === language}>
                        <button
                          type="button"
                          onClick={() => {
                            setLanguage(l.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors ${
                            l.code === language
                              ? 'text-[#1a2e5a] font-semibold bg-gray-50'
                              : 'text-gray-700'
                          }`}
                        >
                          {l.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* New conversation */}
              <button
                type="button"
                onClick={handleNewConversation}
                className="p-1.5 rounded hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                aria-label={t.newChat}
                title={t.newChat}
              >
                <IconRefresh className="w-4 h-4" />
              </button>

              {/* Minimize / Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                aria-label={t.minimize}
                title={t.minimize}
              >
                <IconMinimize className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Talk to a Person (mobile only) */}
          <button
            type="button"
            onClick={() => setShowEscalation(true)}
            className="sm:hidden flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-[#cf4a31] hover:bg-[#b8402b] focus:outline-none focus:ring-2 focus:ring-[#cf4a31] transition-colors shrink-0"
            aria-label={t.talkToPerson}
          >
            <IconPerson className="w-4 h-4" />
            {t.talkToPerson}
          </button>

          {/* Queue banner */}
          {queueInfo && (
            <div
              className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-800 shrink-0"
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold">{t.escalating}</p>
              <p>
                {t.queuePosition}: <strong>#{queueInfo.position}</strong> &middot; {t.queueWait}:{' '}
                <strong>{queueInfo.estimatedWait} min</strong>
              </p>
            </div>
          )}

          {/* ================================================================
              CONSENT SCREEN
          ================================================================= */}
          {showConsent ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#1a2e5a]/10 mb-4">
                <IconLock className="w-8 h-8 text-[#1a2e5a]" />
              </div>
              <h3 className="text-base font-semibold text-[#1a2e5a] mb-3">{t.botName}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-2 max-w-xs">{t.consentText}</p>
              <a
                href="https://www.peacecorps.gov/about/open-government/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded mb-5"
              >
                View Privacy Policy
              </a>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConsentAccept}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-[#1a2e5a] rounded-lg hover:bg-[#142347] focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:ring-offset-2 transition-colors"
                >
                  {t.consentAccept}
                </button>
                <button
                  type="button"
                  onClick={handleConsentDecline}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  {t.consentDecline}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ==============================================================
                  ESCALATION FORM
              =============================================================== */}
              {showEscalation && (
                <div className="bg-white border-b border-gray-200 p-4 shrink-0">
                  <h3 className="font-semibold text-sm text-[#1a2e5a] mb-3">{t.escalateTitle}</h3>
                  <div className="space-y-2">
                    <div>
                      <label htmlFor="esc-name" style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap'}}>
                        {t.namePlaceholder}
                      </label>
                      <input
                        id="esc-name"
                        type="text"
                        placeholder={t.namePlaceholder}
                        value={escalationName}
                        onChange={(e) => setEscalationName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label htmlFor="esc-email" style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap'}}>
                        {t.emailPlaceholder}
                      </label>
                      <input
                        id="esc-email"
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={escalationEmail}
                        onChange={(e) => setEscalationEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label htmlFor="esc-reason" style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap'}}>
                        {t.reasonPlaceholder}
                      </label>
                      <textarea
                        id="esc-reason"
                        placeholder={t.reasonPlaceholder}
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent transition-shadow resize-none"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowEscalation(false)}
                      className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleEscalation}
                      disabled={!escalationReason.trim()}
                      className="flex-1 text-white rounded-lg py-2 text-sm font-medium bg-[#cf4a31] hover:bg-[#b8402b] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#cf4a31] transition-colors"
                    >
                      {t.joinQueue}
                    </button>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  MESSAGES
              =============================================================== */}
              <div
                className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth"
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
                tabIndex={0}
              >
                {messages.map((msg) => {
                  // ---- System messages (centered) ----
                  if (msg.role === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center" role="status">
                        <div className="max-w-[90%] px-3 py-2 rounded-xl bg-blue-50 text-xs text-blue-900 border border-blue-200 leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                        </div>
                      </div>
                    );
                  }

                  const isUser = msg.role === 'user';
                  const isLastBotMsg =
                    !isUser &&
                    msg.id === [...messages].reverse().find((m) => m.role === 'assistant')?.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="max-w-[85%] min-w-0 space-y-1 overflow-hidden">
                        {/* Bot avatar row */}
                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#1a2e5a] flex items-center justify-center shrink-0" aria-hidden="true">
                              <IconChat className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">
                              AI Assistant
                            </span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words overflow-hidden ${
                            isUser
                              ? 'bg-[#1a2e5a] text-white rounded-br-sm'
                              : msg.isEmergency
                                ? 'bg-red-50 text-red-900 border-2 border-[#cf4a31] rounded-bl-sm'
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                          role={msg.isEmergency ? 'alert' : undefined}
                        >
                          {/* Emergency banner */}
                          {msg.isEmergency && (
                            <div className="flex items-center gap-1.5 mb-2 text-[#cf4a31] font-semibold text-xs">
                              <IconWarning className="w-4 h-4" />
                              {t.emergencyLabel}
                            </div>
                          )}

                          {/* Content */}
                          {isUser ? (
                            <p>{msg.content}</p>
                          ) : (
                            <div
                              className="[&_a]:underline [&_a]:text-blue-700 [&_a]:hover:text-blue-900"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                            />
                          )}
                        </div>

                        {/* Sources */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <details className="ml-8">
                            <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors select-none">
                              {t.sources} ({msg.sources.filter((s) => s.url).length})
                            </summary>
                            <ul className="mt-0.5 space-y-0.5 ml-2">
                              {msg.sources
                                .filter((s) => s.url)
                                .slice(0, 5)
                                .map((s, i) => (
                                  <li key={i}>
                                    <a
                                      href={s.url!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded truncate block"
                                    >
                                      {s.title}
                                    </a>
                                  </li>
                                ))}
                            </ul>
                          </details>
                        )}

                        {/* Feedback */}
                        {!isUser && msg.role === 'assistant' && msg.id !== 'welcome' && (
                          <div className="ml-8 flex items-center mt-0.5">
                            <FeedbackButtons
                              messageId={msg.id}
                              current={msg.feedbackGiven}
                              onFeedback={handleFeedback}
                              helpfulLabel={t.helpful}
                              thanksLabel={t.feedbackThanks}
                            />
                          </div>
                        )}

                        {/* Quick reply chips (only on the last bot message) */}
                        {!isUser && isLastBotMsg && msg.quickReplies && msg.quickReplies.length > 0 && !isLoading && (
                          <div
                            className="flex flex-wrap gap-1.5 mt-1 ml-8"
                            role="group"
                            aria-label="Suggested replies"
                          >
                            {msg.quickReplies.map((qr) => (
                              <button
                                key={qr}
                                type="button"
                                onClick={() => handleQuickReply(qr)}
                                className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#1a2e5a] text-[#1a2e5a] bg-white hover:bg-[#1a2e5a] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:ring-offset-1 transition-colors whitespace-nowrap"
                              >
                                {qr}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isLoading && <TypingIndicator label={t.typing} />}

                {/* Error banner */}
                {error && (
                  <div className="flex justify-center" role="alert">
                    <span className="px-3 py-1 rounded-full bg-red-50 text-xs text-[#cf4a31] border border-red-200">
                      {error}
                    </span>
                  </div>
                )}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>

              {/* ==============================================================
                  INPUT AREA
              =============================================================== */}
              <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2.5">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <label htmlFor="pc-chat-input" style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap'}}>
                    {t.placeholder}
                  </label>
                  <textarea
                    ref={inputRef}
                    id="pc-chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={t.placeholder}
                    rows={1}
                    disabled={isLoading}
                    className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-shadow max-h-24"
                    aria-label={t.placeholder}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#cf4a31] text-white hover:bg-[#b8402b] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#cf4a31] focus:ring-offset-1 transition-colors shrink-0"
                    aria-label={t.send}
                    title={t.send}
                  >
                    <IconSend className="w-[18px] h-[18px]" rtl={isRtl} />
                  </button>
                </form>
                <p className="text-[9px] text-gray-400 text-center mt-1.5 select-none">
                  {t.disclaimer}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </>
  );
}
