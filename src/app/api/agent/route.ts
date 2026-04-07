import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { conversationId, userName, userEmail, reason } = await request.json();
    if (!conversationId || !reason) return NextResponse.json({ error: 'Conversation ID and reason are required' }, { status: 400 });

    const position = db.getQueueLength() + 1;
    const estimatedWait = position * 3;
    const id = uuidv4();

    db.insertQueueEntry({ id, conversation_id: conversationId, user_name: userName || null, user_email: userEmail || null, reason, status: 'waiting', position, estimated_wait: estimatedWait, agent_id: null });
    db.updateConversation(conversationId, { escalated: 1, status: 'escalated' });
    db.insertEvent({ event_type: 'escalation_requested', conversation_id: conversationId, metadata: JSON.stringify({ reason, position }) });

    return NextResponse.json({
      queueId: id, position, estimatedWait,
      message: position === 1 ? 'You are next in line.' : `You are number ${position} in the queue. Estimated wait: ${estimatedWait} minutes.`,
    });
  } catch (error) {
    console.error('Agent escalation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const queueId = url.searchParams.get('queueId');
    const listAll = url.searchParams.get('all');

    if (listAll === 'true') return NextResponse.json({ queue: db.getActiveQueue() });
    if (!queueId) return NextResponse.json({ error: 'Queue ID required' }, { status: 400 });

    const entry = db.getQueueEntry(queueId);
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Agent queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const { queueId, status, agentId } = await request.json();
    if (!queueId || !status) return NextResponse.json({ error: 'Queue ID and status required' }, { status: 400 });

    db.updateQueueEntry(queueId, { status, agent_id: agentId || null });
    if (status === 'completed') {
      const entry = db.getQueueEntry(queueId);
      if (entry) db.updateConversation(entry.conversation_id, { status: 'completed' });
    }
    return NextResponse.json({ message: 'Updated' });
  } catch (error) {
    console.error('Agent update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
