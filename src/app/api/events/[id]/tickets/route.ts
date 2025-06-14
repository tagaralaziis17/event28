import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    const [rows] = await db.execute('SELECT id, token, qr_code_url FROM tickets WHERE event_id = ? ORDER BY id ASC', [eventId])
    return NextResponse.json({ tickets: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets', detail: String(error) }, { status: 500 })
  }
} 