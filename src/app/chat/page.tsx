'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  sources?: { title: string; url?: string }[];
  isEmergency?: boolean;
  timestamp: Date;
  agentName?: string;
}

type ChatMode = 'ai' | 'agent';

const AGENTS = [
  { name: 'Sarah Mitchell', title: 'Peace Corps Recruiter', region: 'West Coast', avatar: 'SM' },
  { name: 'James Okafor', title: 'Returned Volunteer Advisor', region: 'East Coast', avatar: 'JO' },
  { name: 'Maria Santos', title: 'Peace Corps Recruiter', region: 'Southwest', avatar: 'MS' },
  { name: 'David Chen', title: 'Application Specialist', region: 'Midwest', avatar: 'DC' },
];

const AGENT_GREETINGS = [
  (name: string) => `Hey there! This is ${name}. Thanks for reaching out — I'd love to help you learn more about the Peace Corps. What's on your mind?`,
  (name: string) => `Hi! ${name} here. I'm really glad you want to chat. Whether you're just curious or ready to apply, I'm here for you. What can I help with?`,
  (name: string) => `Hello! You've been connected with ${name}. I've helped dozens of people through the Peace Corps journey and I'd be happy to help you too. What questions do you have?`,
  (name: string) => `Hey! I'm ${name}. Welcome! I actually served as a Volunteer myself, so I know firsthand what this experience is like. How can I help you today?`,
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('ai');
  const [agent, setAgent] = useState<typeof AGENTS[0] | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const connectToAgent = useCallback(() => {
    if (isConnecting || chatMode === 'agent') return;
    setIsConnecting(true);

    // Pick a random agent
    const selectedAgent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    setAgent(selectedAgent);

    // Add a "connecting" system message
    setMessages(prev => [...prev, {
      id: uuidv4(),
      role: 'assistant',
      content: `Connecting you with a Peace Corps recruiter... one moment please.`,
      timestamp: new Date(),
    }]);

    // Simulate connection delay then agent greeting
    setTimeout(() => {
      setChatMode('agent');
      setIsConnecting(false);
      const greeting = AGENT_GREETINGS[Math.floor(Math.random() * AGENT_GREETINGS.length)];
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'agent',
        content: greeting(selectedAgent.name),
        agentName: selectedAgent.name,
        timestamp: new Date(),
      }]);
    }, 2000);
  }, [isConnecting, chatMode]);

  const quickReplies = [
    'How do I apply?',
    'Where can I serve?',
    'What are the benefits?',
    'What is the Peace Corps?',
    'Talk to a recruiter',
    'Am I eligible?',
  ];

  const AGENT_RESPONSES: Record<string, string[]> = {
    apply: [
      "Great question! The application process has a few steps: you'll create an account on peacecorps.gov, fill out the application, and then we'll review it. The whole thing takes about an hour. Want me to walk you through any specific part?",
      "Applying is pretty straightforward! Head to peacecorps.gov/apply to get started. You'll need your resume, a personal statement, and two references. I'm happy to help if you get stuck on anything.",
    ],
    serve: [
      "We currently have Volunteers in 56 countries across Africa, Asia, the Caribbean, Central and South America, Europe, and the Pacific Islands. Is there a particular region you're drawn to?",
      "There are so many amazing places to serve! It really depends on your skills and what sector you're interested in. Do you have a preference between education, health, agriculture, or community development?",
    ],
    benefit: [
      "The benefits are honestly really solid. You get a living allowance, free housing, full medical and dental coverage, student loan deferment, and a readjustment allowance of about $10,000 when you complete service. Plus, you get non-competitive eligibility for federal jobs for a year after.",
      "There's a lot to love. Beyond the life-changing experience, you get language training, a monthly stipend, health coverage, and a nice transition allowance when you finish. Many RPCVs say the professional network alone was worth it.",
    ],
    eligible: [
      "The main requirements are that you need to be a U.S. citizen, at least 18 years old, and in good health. There's no upper age limit — we've had Volunteers in their 80s! A bachelor's degree or equivalent work experience is typically needed. Any specific concerns about your eligibility?",
      "Good news — the requirements are more accessible than most people think. U.S. citizenship, 18+, and generally good health. Most positions want a bachelor's degree, but relevant work experience can sometimes substitute. What's your background?",
    ],
    default: [
      "That's a really good question. Let me look into the specifics for you. In the meantime, would it be helpful if I sent you some resources by email?",
      "I want to make sure I give you the most accurate answer on that. Can you tell me a little more about your situation so I can point you in the right direction?",
      "Absolutely, I can help with that. Let me share what I know, and if you need more detail, we can always set up a longer call.",
    ],
  };

  const getAgentResponse = (text: string): string => {
    const lower = text.toLowerCase();
    let category = 'default';
    if (lower.includes('apply') || lower.includes('application')) category = 'apply';
    else if (lower.includes('where') || lower.includes('country') || lower.includes('serve')) category = 'serve';
    else if (lower.includes('benefit') || lower.includes('pay') || lower.includes('salary') || lower.includes('stipend')) category = 'benefit';
    else if (lower.includes('eligible') || lower.includes('eligib') || lower.includes('require') || lower.includes('qualify')) category = 'eligible';

    const responses = AGENT_RESPONSES[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Agent mode — simulate live agent responses
    if (chatMode === 'agent' && agent) {
      const delay = 1500 + Math.random() * 2000; // 1.5-3.5s realistic typing delay
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'agent',
          content: getAgentResponse(text),
          agentName: agent.name,
          timestamp: new Date(),
        }]);
        setIsLoading(false);
      }, delay);
      return;
    }

    // AI mode
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationId,
          sessionId,
          language: 'en',
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: data.messageId || uuidv4(),
        role: 'assistant',
        content: data.content || 'I apologize, but I was unable to process your request. Please try again.',
        sources: data.sources,
        isEmergency: data.isEmergency,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      setMessages(prev => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId, sessionId, chatMode, agent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2e5a] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <img src="/peace-corps-logo.svg" alt="Peace Corps" className="w-8 h-8 brightness-0 invert" />
                <span className="text-lg font-bold" style={{ fontFamily: 'Merriweather, serif' }}>Peace Corps</span>
              </a>
              <span className="text-white/40 mx-2">|</span>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#5b8dd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <span className="text-sm font-semibold">AI Assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={connectToAgent}
                disabled={chatMode === 'agent' || isConnecting}
                className={`text-sm font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                  chatMode === 'agent'
                    ? 'bg-green-500 text-white cursor-default'
                    : 'pc-glow-btn text-white cursor-pointer'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {chatMode === 'agent' ? `Connected: ${agent?.name}` : isConnecting ? 'Connecting...' : 'Talk to a Person'}
              </button>
              <span className="w-px h-4 bg-white/20" />
              <a href="/" className="text-sm text-white/70 hover:text-white transition flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Back to site
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a2e5a] flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[#1a2e5a] mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                Peace Corps AI Assistant
              </h1>
              <p className="text-gray-500 mb-8 max-w-md">
                Ask me anything about the Peace Corps &mdash; how to apply, where you can serve, benefits, eligibility, and more.
              </p>

              {/* Quick reply grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#1a2e5a] hover:shadow-md transition-all text-sm text-[#1a2e5a] font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? '' : 'flex gap-3'}`}>
                    {/* AI assistant avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-[#1a2e5a] flex items-center justify-center shrink-0 mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                    )}
                    {/* Live agent avatar */}
                    {msg.role === 'agent' && (
                      <div className="w-8 h-8 rounded-full bg-[#cf4a31] flex items-center justify-center shrink-0 mt-1">
                        <span className="text-white text-[10px] font-bold">{msg.agentName?.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                    )}
                    <div>
                      {/* Agent name label */}
                      {msg.role === 'agent' && msg.agentName && (
                        <p className="text-[11px] text-[#cf4a31] font-semibold mb-1">{msg.agentName}</p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-[#1a2e5a] text-white rounded-br-md'
                            : msg.role === 'agent'
                            ? 'bg-[#fff8f6] border border-[#cf4a31]/20 text-gray-800 rounded-bl-md shadow-sm'
                            : msg.isEmergency
                            ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-md'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.sources.map((src, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              {src.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a2e5a] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-white px-4 sm:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question here..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] focus:border-transparent"
                  style={{ maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-xl bg-[#1a2e5a] text-white flex items-center justify-center hover:bg-[#0f1d3d] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              Peace Corps AI Assistant provides general information. For official guidance, please contact a recruiter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
