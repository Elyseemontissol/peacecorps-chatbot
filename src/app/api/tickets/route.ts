import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const priority = url.searchParams.get('priority') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const id = url.searchParams.get('id');

    if (id) {
      const ticket = db.getTicket(id);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      return NextResponse.json({ ticket });
    }

    const tickets = db.getAllTickets({ status, priority, search });
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Tickets GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { subject, description, category, priority, submitter_name, submitter_email, submitter_org } = body;

    if (!subject || !description || !submitter_name || !submitter_email) {
      return NextResponse.json({ error: 'Subject, description, name, and email are required' }, { status: 400 });
    }

    const id = uuidv4();
    const ticket_number = db.getNextTicketNumber();

    db.insertTicket({
      id,
      ticket_number,
      subject,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      status: 'open',
      submitter_name,
      submitter_email,
      submitter_org: submitter_org || '',
      assigned_to: null,
    });

    return NextResponse.json({ id, ticket_number, message: 'Ticket created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Tickets POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, status, priority, assigned_to, response } = body;

    if (!id) return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });

    if (response) {
      db.addTicketResponse(id, {
        id: uuidv4(),
        author: response.author,
        author_role: response.author_role || 'support',
        content: response.content,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (Object.keys(updates).length > 0) {
      db.updateTicket(id, updates as never);
    }

    return NextResponse.json({ message: 'Ticket updated' });
  } catch (error) {
    console.error('Tickets PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
