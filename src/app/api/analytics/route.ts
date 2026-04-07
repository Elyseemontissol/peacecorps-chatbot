import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const period = parseInt(url.searchParams.get('period') || '30');
    const data = db.getAnalytics(period);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
