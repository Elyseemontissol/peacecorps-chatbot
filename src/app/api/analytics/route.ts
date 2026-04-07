import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30'; // days

    const since = `datetime('now', '-${parseInt(period)} days')`;

    // Total conversations
    const totalConversations = (db.prepare(`
      SELECT COUNT(*) as count FROM conversations WHERE created_at >= ${since}
    `).get() as { count: number }).count;

    // Total messages
    const totalMessages = (db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE created_at >= ${since}
    `).get() as { count: number }).count;

    // Escalation rate
    const escalatedCount = (db.prepare(`
      SELECT COUNT(*) as count FROM conversations WHERE escalated = 1 AND created_at >= ${since}
    `).get() as { count: number }).count;

    const escalationRate = totalConversations > 0 ? (escalatedCount / totalConversations * 100).toFixed(1) : '0';

    // Containment rate (resolved without escalation)
    const containmentRate = totalConversations > 0 ? ((1 - escalatedCount / totalConversations) * 100).toFixed(1) : '100';

    // Average satisfaction
    const avgSatisfaction = db.prepare(`
      SELECT AVG(user_satisfaction) as avg FROM conversations
      WHERE user_satisfaction IS NOT NULL AND created_at >= ${since}
    `).get() as { avg: number | null };

    // Emergency events
    const emergencyCount = (db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE event_type = 'emergency_detected' AND created_at >= ${since}
    `).get() as { count: number }).count;

    // Messages per day
    const messagesPerDay = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM messages
      WHERE created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Top topics (from knowledge document categories accessed)
    const topTopics = db.prepare(`
      SELECT json_extract(metadata, '$.language') as language,
             COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'message_sent' AND created_at >= ${since}
      GROUP BY language
      ORDER BY count DESC
      LIMIT 10
    `).all();

    // Conversations by language
    const languageBreakdown = db.prepare(`
      SELECT language, COUNT(*) as count
      FROM conversations
      WHERE created_at >= ${since}
      GROUP BY language
      ORDER BY count DESC
    `).all();

    // Recent conversations
    const recentConversations = db.prepare(`
      SELECT c.id, c.session_id, c.language, c.status, c.escalated, c.created_at,
             COUNT(m.id) as message_count
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.created_at >= ${since}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 20
    `).all();

    return NextResponse.json({
      summary: {
        totalConversations,
        totalMessages,
        escalationRate: parseFloat(escalationRate as string),
        containmentRate: parseFloat(containmentRate as string),
        avgSatisfaction: avgSatisfaction.avg ? parseFloat(avgSatisfaction.avg.toFixed(1)) : null,
        emergencyCount,
      },
      messagesPerDay,
      topTopics,
      languageBreakdown,
      recentConversations,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
