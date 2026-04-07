import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { messageId, conversationId, rating, comment } = await request.json();
    if (!messageId || !conversationId) return NextResponse.json({ error: 'Message ID and conversation ID required' }, { status: 400 });

    db.insertFeedback({ message_id: messageId, conversation_id: conversationId, rating: rating || null, comment: comment || null });
    if (rating) db.updateConversation(conversationId, { user_satisfaction: rating });
    db.insertEvent({ event_type: 'feedback_submitted', conversation_id: conversationId, metadata: JSON.stringify({ rating, hasComment: !!comment }) });

    return NextResponse.json({ message: 'Feedback submitted' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
