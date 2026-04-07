import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { messageId, conversationId, rating, comment } = body;

    if (!messageId || !conversationId) {
      return NextResponse.json({ error: 'Message ID and conversation ID are required' }, { status: 400 });
    }

    db.prepare(`INSERT INTO feedback (message_id, conversation_id, rating, comment) VALUES (?, ?, ?, ?)`).run(
      messageId, conversationId, rating || null, comment || null
    );

    if (rating) {
      db.prepare(`UPDATE conversations SET user_satisfaction = ?, updated_at = datetime('now') WHERE id = ?`).run(rating, conversationId);
    }

    db.prepare(`INSERT INTO analytics_events (event_type, conversation_id, metadata) VALUES ('feedback_submitted', ?, ?)`).run(
      conversationId, JSON.stringify({ rating, hasComment: !!comment })
    );

    return NextResponse.json({ message: 'Feedback submitted' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
