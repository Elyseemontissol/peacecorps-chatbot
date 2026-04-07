import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { docs, total } = db.getAllDocuments({ category, search, limit, offset });
    return NextResponse.json({ documents: docs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Knowledge GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const { title, content, category, priority, source_url, tags } = await request.json();
    if (!title || !content) return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    const id = uuidv4();
    db.insertDocument({ id, title, content, category: category || 'general', priority: priority || 5, source_url: source_url || null, tags: tags || null });
    return NextResponse.json({ id, message: 'Document created' }, { status: 201 });
  } catch (error) {
    console.error('Knowledge POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    db.updateDocument(body.id, body);
    return NextResponse.json({ message: 'Document updated' });
  } catch (error) {
    console.error('Knowledge PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    db.deleteDocument(id);
    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
