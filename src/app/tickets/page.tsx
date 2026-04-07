'use client';

import { useState, useEffect, useCallback } from 'react';

interface TicketResponse {
  id: string;
  author: string;
  author_role: 'client' | 'support' | 'engineer';
  content: string;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submitter_name: string;
  submitter_email: string;
  submitter_org: string;
  assigned_to: string | null;
  responses: TicketResponse[];
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  waiting: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  closed: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-zinc-500/10', text: 'text-zinc-400' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

const ROLE_COLORS: Record<string, string> = {
  client: '#3b82f6',
  support: '#E74D10',
  engineer: '#8b5cf6',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [newPriority, setNewPriority] = useState('medium');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newOrg, setNewOrg] = useState('');

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (search) params.set('search', search);
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterStatus, filterPriority, search]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!newSubject || !newDescription || !newName || !newEmail) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newSubject, description: newDescription, category: newCategory,
          priority: newPriority, submitter_name: newName, submitter_email: newEmail, submitter_org: newOrg,
        }),
      });
      if (res.ok) {
        setShowNewTicket(false);
        setNewSubject(''); setNewDescription(''); setNewCategory('other'); setNewPriority('medium');
        setNewName(''); setNewEmail(''); setNewOrg('');
        fetchTickets();
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTicket.id,
          response: { author: 'You', author_role: 'client', content: replyText },
        }),
      });
      setReplyText('');
      // Refresh ticket
      const res = await fetch(`/api/tickets?id=${selectedTicket.id}`);
      const data = await res.json();
      if (data.ticket) {
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await fetch('/api/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status }),
      });
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0d11' }}>
      {/* Header */}
      <header style={{ background: '#141419', borderBottom: '1px solid #1f1f28' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg" style={{ background: '#E74D10' }}>
                M
              </div>
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'system-ui' }}>
                  Montissol Global Technology
                </h1>
                <p className="text-[11px] text-zinc-500">Support Ticket System</p>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-zinc-700 mx-2" />
            <span className="hidden sm:block text-sm text-zinc-500">Peace Corps AI Chatbot Contract</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition">
              Admin Dashboard
            </a>
            <a href="/" className="text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition">
              View Site
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} &middot; {tickets.filter(t => t.status === 'open').length} open
            </p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition hover:brightness-110"
            style={{ background: '#E74D10' }}
          >
            + New Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E74D10]/50"
            style={{ background: '#141419', border: '1px solid #1f1f28' }}
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
            style={{ background: '#141419', border: '1px solid #1f1f28' }}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
            style={{ background: '#141419', border: '1px solid #1f1f28' }}
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="w-full max-w-lg mx-4 rounded-xl overflow-hidden" style={{ background: '#141419', border: '1px solid #1f1f28' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1f1f28' }}>
                <h3 className="text-lg font-bold text-white">Open a Support Ticket</h3>
                <button onClick={() => setShowNewTicket(false)} className="text-zinc-500 hover:text-white text-xl">&times;</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Your Name *</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }} />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Email *</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Organization</label>
                  <input value={newOrg} onChange={e => setNewOrg(e.target.value)} placeholder="e.g. Peace Corps VRS" className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-zinc-600" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Subject *</label>
                  <input value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Category</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }}>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="performance">Performance</option>
                      <option value="security">Security</option>
                      <option value="integration">Integration</option>
                      <option value="billing">Billing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Priority</label>
                    <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#0d0d11', border: '1px solid #1f1f28' }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Description *</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-zinc-600 resize-none" placeholder="Describe the issue in detail..." style={{ background: '#0d0d11', border: '1px solid #1f1f28' }} />
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid #1f1f28' }}>
                <button onClick={() => setShowNewTicket(false)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
                <button
                  onClick={handleCreateTicket}
                  disabled={submitting || !newSubject || !newDescription || !newName || !newEmail}
                  className="px-5 py-2 rounded-lg text-sm text-white font-semibold disabled:opacity-40 transition hover:brightness-110"
                  style={{ background: '#E74D10' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Ticket List */}
          <div className={`${selectedTicket ? 'hidden lg:block lg:w-[420px]' : 'w-full'} shrink-0`}>
            {loading ? (
              <div className="text-center text-zinc-500 py-20">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-20 rounded-xl" style={{ background: '#141419', border: '1px solid #1f1f28' }}>
                <p className="text-zinc-400 text-lg mb-2">No tickets found</p>
                <p className="text-zinc-600 text-sm">Create a new ticket to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map(ticket => {
                  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
                  const pc = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium;
                  const isSelected = selectedTicket?.id === ticket.id;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full text-left p-4 rounded-xl transition ${isSelected ? 'ring-1 ring-[#E74D10]/50' : 'hover:bg-white/[0.02]'}`}
                      style={{ background: isSelected ? '#1a1a22' : '#141419', border: '1px solid #1f1f28' }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono text-zinc-500">{ticket.ticket_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-white truncate">{ticket.subject}</h4>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${pc.bg} ${pc.text}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{ticket.submitter_name} &middot; {ticket.submitter_org || 'N/A'}</span>
                        <span>{ticket.responses.length} repl{ticket.responses.length !== 1 ? 'ies' : 'y'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Detail */}
          {selectedTicket && (
            <div className="flex-1 min-w-0">
              {/* Back button on mobile */}
              <button
                onClick={() => setSelectedTicket(null)}
                className="lg:hidden flex items-center gap-1 text-sm text-zinc-400 hover:text-white mb-4 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back to tickets
              </button>

              <div className="rounded-xl overflow-hidden" style={{ background: '#141419', border: '1px solid #1f1f28' }}>
                {/* Ticket header */}
                <div className="px-6 py-5" style={{ borderBottom: '1px solid #1f1f28' }}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500">{selectedTicket.ticket_number}</span>
                        <span className="text-xs text-zinc-600">&middot;</span>
                        <span className="text-xs text-zinc-500 capitalize">{selectedTicket.category.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{selectedTicket.subject}</h3>
                    </div>
                    <select
                      value={selectedTicket.status}
                      onChange={e => handleStatusChange(selectedTicket.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs text-white font-medium"
                      style={{ background: '#0d0d11', border: '1px solid #1f1f28' }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting">Waiting</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                    <span>Opened by <strong className="text-zinc-300">{selectedTicket.submitter_name}</strong></span>
                    <span>{selectedTicket.submitter_email}</span>
                    {selectedTicket.submitter_org && <span>{selectedTicket.submitter_org}</span>}
                    {selectedTicket.assigned_to && (
                      <span>Assigned to <strong className="text-zinc-300">{selectedTicket.assigned_to}</strong></span>
                    )}
                    <span>{new Date(selectedTicket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="px-6 py-5" style={{ borderBottom: '1px solid #1f1f28' }}>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Responses */}
                <div className="px-6 py-4 space-y-4" style={{ borderBottom: '1px solid #1f1f28' }}>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Activity ({selectedTicket.responses.length})
                  </h4>
                  {selectedTicket.responses.length === 0 ? (
                    <p className="text-sm text-zinc-600 py-4 text-center">No responses yet</p>
                  ) : (
                    selectedTicket.responses.map(resp => (
                      <div key={resp.id} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: ROLE_COLORS[resp.author_role] || '#666' }}
                        >
                          {resp.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{resp.author}</span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: `${ROLE_COLORS[resp.author_role]}15`,
                                color: ROLE_COLORS[resp.author_role],
                              }}
                            >
                              {resp.author_role}
                            </span>
                            <span className="text-[11px] text-zinc-600">
                              {new Date(resp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{resp.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply box */}
                <div className="px-6 py-4">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-zinc-600 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-[#E74D10]/50"
                    style={{ background: '#0d0d11', border: '1px solid #1f1f28' }}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim() || submitting}
                      className="px-5 py-2 rounded-lg text-sm text-white font-semibold disabled:opacity-40 transition hover:brightness-110"
                      style={{ background: '#E74D10' }}
                    >
                      {submitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6" style={{ borderTop: '1px solid #1f1f28' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: '#E74D10' }}>M</div>
            <span className="text-xs text-zinc-500">Montissol Global Technology LLC &middot; Port St Lucie, FL</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>754-802-5327</span>
            <span>Info@MontissolGlobalTechnology.com</span>
            <span>CAGE: 9TKS0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
