import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

// GET - List knowledge base documents
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM knowledge_documents WHERE 1=1';
    const params: (string | number)[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

    query += ' ORDER BY priority DESC, updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const docs = db.prepare(query).all(...params);

    return NextResponse.json({
      documents: docs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Knowledge GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new knowledge document
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { title, content, category, priority, source_url, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO knowledge_documents (id, title, content, category, priority, source_url, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, content, category || 'general', priority || 5, source_url || null, tags || null);

    return NextResponse.json({ id, message: 'Document created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Knowledge POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update knowledge document
export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, title, content, category, priority, source_url, tags, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    db.prepare(`
      UPDATE knowledge_documents
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          category = COALESCE(?, category),
          priority = COALESCE(?, priority),
          source_url = COALESCE(?, source_url),
          tags = COALESCE(?, tags),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(title, content, category, priority, source_url, tags, is_active, id);

    return NextResponse.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Knowledge PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove knowledge document
export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    db.prepare('DELETE FROM knowledge_documents WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Knowledge DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
