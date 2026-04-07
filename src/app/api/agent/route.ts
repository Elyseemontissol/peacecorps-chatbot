import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

// POST - Request live agent escalation
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { conversationId, userName, userEmail, reason } = body;

    if (!conversationId || !reason) {
      return NextResponse.json({ error: 'Conversation ID and reason are required' }, { status: 400 });
    }

    // Get current queue length
    const queueLength = (db.prepare(
      `SELECT COUNT(*) as count FROM agent_queue WHERE status = 'waiting'`
    ).get() as { count: number }).count;

    const position = queueLength + 1;
    const estimatedWait = position * 3; // ~3 min per person

    const id = uuidv4();
    db.prepare(`
      INSERT INTO agent_queue (id, conversation_id, user_name, user_email, reason, position, estimated_wait)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, conversationId, userName || null, userEmail || null, reason, position, estimatedWait);

    // Mark conversation as escalated
    db.prepare(`UPDATE conversations SET escalated = 1, status = 'escalated', updated_at = datetime('now') WHERE id = ?`).run(conversationId);

    // Log analytics
    db.prepare(`INSERT INTO analytics_events (event_type, conversation_id, metadata) VALUES ('escalation_requested', ?, ?)`).run(
      conversationId, JSON.stringify({ reason, position })
    );

    return NextResponse.json({
      queueId: id,
      position,
      estimatedWait,
      message: position === 1
        ? 'You are next in line. A Peace Corps representative will be with you shortly.'
        : `You are number ${position} in the queue. Estimated wait time: ${estimatedWait} minutes.`,
    });
  } catch (error) {
    console.error('Agent escalation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get queue status
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const queueId = url.searchParams.get('queueId');
    const listAll = url.searchParams.get('all');

    if (listAll === 'true') {
      const queue = db.prepare(`
        SELECT q.*, c.session_id, c.language,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = q.conversation_id) as message_count
        FROM agent_queue q
        LEFT JOIN conversations c ON c.id = q.conversation_id
        WHERE q.status IN ('waiting', 'active')
        ORDER BY q.created_at ASC
      `).all();
      return NextResponse.json({ queue });
    }

    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 });
    }

    const entry = db.prepare(`SELECT * FROM agent_queue WHERE id = ?`).get(queueId);
    if (!entry) {
      return NextResponse.json({ error: 'Queue entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Agent queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update queue entry (agent picks up, completes, etc.)
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { queueId, status, agentId } = body;

    if (!queueId || !status) {
      return NextResponse.json({ error: 'Queue ID and status are required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE agent_queue SET status = ?, agent_id = COALESCE(?, agent_id), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, agentId || null, queueId);

    // If completed, update conversation
    if (status === 'completed') {
      const entry = db.prepare(`SELECT conversation_id FROM agent_queue WHERE id = ?`).get(queueId) as { conversation_id: string };
      if (entry) {
        db.prepare(`UPDATE conversations SET status = 'completed', updated_at = datetime('now') WHERE id = ?`).run(entry.conversation_id);
      }
    }

    return NextResponse.json({ message: 'Queue entry updated' });
  } catch (error) {
    console.error('Agent update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
