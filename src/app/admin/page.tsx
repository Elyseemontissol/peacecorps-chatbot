'use client';

import { useState, useEffect, useCallback } from 'react';

interface KnowledgeDoc {
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

interface AnalyticsData {
  summary: {
    totalConversations: number;
    totalMessages: number;
    escalationRate: number;
    containmentRate: number;
    avgSatisfaction: number | null;
    emergencyCount: number;
  };
  messagesPerDay: { date: string; count: number }[];
  languageBreakdown: { language: string; count: number }[];
  recentConversations: {
    id: string;
    session_id: string;
    language: string;
    status: string;
    escalated: number;
    created_at: string;
    message_count: number;
  }[];
}

interface QueueEntry {
  id: string;
  conversation_id: string;
  user_name: string | null;
  user_email: string | null;
  reason: string;
  status: string;
  position: number;
  estimated_wait: number;
  created_at: string;
  message_count?: number;
}

type Tab = 'dashboard' | 'knowledge' | 'queue' | 'conversations';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDoc | null>(null);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) { console.error(e); }
  }, [period]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/agent?all=true');
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnalytics(), fetchDocuments(), fetchQueue()]).finally(() => setLoading(false));
  }, [fetchAnalytics, fetchDocuments, fetchQueue]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchQueue();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics, fetchQueue]);

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
      {/* Admin Header */}
      <header className="text-white px-6 py-4 shadow-lg" style={{ background: '#1a2e5a' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
              </svg>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Merriweather, serif' }}>Peace Corps Chatbot</h1>
                <p className="text-xs opacity-75">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <a href="/" className="text-sm bg-white/20 px-4 py-2 rounded hover:bg-white/30 transition">
            View Website
          </a>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {([
              { id: 'dashboard', label: 'KPI Dashboard', icon: '📊' },
              { id: 'knowledge', label: 'Knowledge Base', icon: '📚' },
              { id: 'queue', label: 'Agent Queue', icon: '👥' },
              { id: 'conversations', label: 'Conversations', icon: '💬' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#cf4a31] text-[#1a2e5a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardTab analytics={analytics} period={period} setPeriod={setPeriod} onRefresh={fetchAnalytics} />}
            {activeTab === 'knowledge' && <KnowledgeTab documents={documents} onRefresh={fetchDocuments} editingDoc={editingDoc} setEditingDoc={setEditingDoc} showNewDoc={showNewDoc} setShowNewDoc={setShowNewDoc} />}
            {activeTab === 'queue' && <QueueTab queue={queue} onRefresh={fetchQueue} />}
            {activeTab === 'conversations' && <ConversationsTab analytics={analytics} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ===== DASHBOARD TAB ===== */
function DashboardTab({ analytics, period, setPeriod, onRefresh }: {
  analytics: AnalyticsData | null;
  period: string;
  setPeriod: (p: string) => void;
  onRefresh: () => void;
}) {
  if (!analytics) return <div>No data available</div>;
  const { summary } = analytics;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Merriweather, serif' }}>KPI Dashboard</h2>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={onRefresh} className="text-sm px-4 py-2 rounded text-white" style={{ background: '#1a2e5a' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard title="Total Conversations" value={summary.totalConversations.toString()} icon="💬" color="#1a2e5a" />
        <KPICard title="Total Messages" value={summary.totalMessages.toString()} icon="📨" color="#2a6496" />
        <KPICard title="Containment Rate" value={`${summary.containmentRate}%`} icon="✅" color="#2e7d32" subtitle="Resolved without escalation" />
        <KPICard title="Escalation Rate" value={`${summary.escalationRate}%`} icon="📞" color="#cf4a31" />
        <KPICard title="Avg Satisfaction" value={summary.avgSatisfaction ? `${summary.avgSatisfaction}/5` : 'N/A'} icon="⭐" color="#f9a825" />
        <KPICard title="Emergency Alerts" value={summary.emergencyCount.toString()} icon="🚨" color="#d32f2f" />
      </div>

      {/* Messages Per Day Chart (Simple) */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Messages Per Day</h3>
        {analytics.messagesPerDay.length > 0 ? (
          <div className="flex items-end gap-1 h-40">
            {analytics.messagesPerDay.map((d, i) => {
              const max = Math.max(...analytics.messagesPerDay.map(x => x.count), 1);
              const height = (d.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{d.count}</span>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{ height: `${Math.max(height, 4)}%`, background: '#1a2e5a', minHeight: '4px' }}
                    title={`${d.date}: ${d.count} messages`}
                  />
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No message data for this period</p>
        )}
      </div>

      {/* Language Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Languages</h3>
        {analytics.languageBreakdown.length > 0 ? (
          <div className="space-y-2">
            {analytics.languageBreakdown.map((l, i) => {
              const total = analytics.languageBreakdown.reduce((s, x) => s + x.count, 0);
              const pct = ((l.count / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-mono">{l.language}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5">
                    <div className="h-5 rounded-full text-xs text-white flex items-center px-2" style={{ width: `${pct}%`, background: '#1a2e5a', minWidth: '40px' }}>{pct}%</div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">{l.count}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No language data</p>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color, subtitle }: { title: string; value: string; icon: string; color: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

/* ===== KNOWLEDGE BASE TAB ===== */
function KnowledgeTab({ documents, onRefresh, editingDoc, setEditingDoc, showNewDoc, setShowNewDoc }: {
  documents: KnowledgeDoc[];
  onRefresh: () => void;
  editingDoc: KnowledgeDoc | null;
  setEditingDoc: (d: KnowledgeDoc | null) => void;
  showNewDoc: boolean;
  setShowNewDoc: (v: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async (doc: Partial<KnowledgeDoc>, isNew: boolean) => {
    setSaving(true);
    try {
      await fetch('/api/knowledge', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      setEditingDoc(null);
      setShowNewDoc(false);
      onRefresh();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await fetch(`/api/knowledge?id=${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Merriweather, serif' }}>Knowledge Base (RAG Dataset)</h2>
        <button onClick={() => setShowNewDoc(true)} className="text-white px-4 py-2 rounded text-sm font-medium" style={{ background: '#2e7d32' }}>
          + Add Document
        </button>
      </div>

      {(showNewDoc || editingDoc) && (
        <DocEditor
          doc={editingDoc}
          onSave={(d) => handleSave(d, !editingDoc)}
          onCancel={() => { setEditingDoc(null); setShowNewDoc(false); }}
          saving={saving}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{doc.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{doc.category}</span>
                </td>
                <td className="px-4 py-3">{doc.priority}/10</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${doc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {doc.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(doc.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDoc(doc)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && (
          <p className="text-center text-gray-400 py-8">No documents in the knowledge base</p>
        )}
      </div>
    </div>
  );
}

function DocEditor({ doc, onSave, onCancel, saving }: {
  doc: KnowledgeDoc | null;
  onSave: (d: Partial<KnowledgeDoc>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(doc?.title || '');
  const [content, setContent] = useState(doc?.content || '');
  const [category, setCategory] = useState(doc?.category || 'general');
  const [priority, setPriority] = useState(doc?.priority || 5);
  const [sourceUrl, setSourceUrl] = useState(doc?.source_url || '');
  const [tags, setTags] = useState(doc?.tags || '');

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6 border-2 border-blue-200">
      <h3 className="text-lg font-semibold mb-4">{doc ? 'Edit Document' : 'New Document'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            {['general', 'about', 'apply', 'programs', 'benefits', 'countries', 'eligibility', 'training', 'safety', 'contact', 'events', 'rpcv', 'sectors'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority (1-10)</label>
          <input type="number" min={1} max={10} value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
          <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="apply,volunteer,requirements" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onCancel} className="px-4 py-2 border rounded text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button
          onClick={() => onSave({ id: doc?.id, title, content, category, priority, source_url: sourceUrl || null, tags: tags || null })}
          disabled={saving || !title || !content}
          className="px-4 py-2 rounded text-sm text-white disabled:opacity-50"
          style={{ background: '#1a2e5a' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ===== QUEUE TAB ===== */
function QueueTab({ queue, onRefresh }: { queue: QueueEntry[]; onRefresh: () => void }) {
  const handleAction = async (queueId: string, status: string) => {
    try {
      await fetch('/api/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, status, agentId: 'admin' }),
      });
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Merriweather, serif' }}>Live Agent Queue</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{queue.filter(q => q.status === 'waiting').length} waiting</span>
          <button onClick={onRefresh} className="text-sm px-4 py-2 rounded text-white" style={{ background: '#1a2e5a' }}>
            Refresh
          </button>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-400 text-lg">No active queue entries</p>
          <p className="text-gray-300 text-sm mt-2">Users who request to speak with a live agent will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map(entry => (
            <div key={entry.id} className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                    entry.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {entry.status.toUpperCase()}
                  </span>
                  <span className="font-medium">{entry.user_name || 'Anonymous User'}</span>
                  {entry.user_email && <span className="text-sm text-gray-400">{entry.user_email}</span>}
                </div>
                <p className="text-sm text-gray-600">Reason: {entry.reason}</p>
                <p className="text-xs text-gray-400 mt-1">Position #{entry.position} | Submitted {new Date(entry.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {entry.status === 'waiting' && (
                  <button onClick={() => handleAction(entry.id, 'active')} className="px-3 py-2 text-xs rounded text-white" style={{ background: '#2e7d32' }}>
                    Pick Up
                  </button>
                )}
                {entry.status === 'active' && (
                  <button onClick={() => handleAction(entry.id, 'completed')} className="px-3 py-2 text-xs rounded text-white" style={{ background: '#1a2e5a' }}>
                    Complete
                  </button>
                )}
                <button onClick={() => handleAction(entry.id, 'cancelled')} className="px-3 py-2 text-xs rounded border text-gray-500 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== CONVERSATIONS TAB ===== */
function ConversationsTab({ analytics }: { analytics: AnalyticsData | null }) {
  if (!analytics) return <div>No data</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Merriweather, serif' }}>Recent Conversations</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Session</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Language</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Messages</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Escalated</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {analytics.recentConversations.map(conv => (
              <tr key={conv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{conv.session_id.slice(0, 8)}...</td>
                <td className="px-4 py-3">{conv.language.toUpperCase()}</td>
                <td className="px-4 py-3">{conv.message_count}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    conv.status === 'active' ? 'bg-green-100 text-green-800' :
                    conv.status === 'escalated' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>{conv.status}</span>
                </td>
                <td className="px-4 py-3">{conv.escalated ? '✅' : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(conv.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {analytics.recentConversations.length === 0 && (
          <p className="text-center text-gray-400 py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
