import { NextRequest, NextResponse } from 'next/server'
import db, { testConnection } from '@/lib/db'
import { sendRegistrationEmail } from '@/lib/email'
import { generateCertificate } from '@/lib/certificate'

export async function GET(request: NextRequest) {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 })
    }
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 })
    }
    // Query ticket dan event
    const [tickets] = await db.execute(`
      SELECT t.id as ticket_id, t.token, t.is_verified, e.id as event_id, e.name, e.type, e.location, e.description, e.start_time, e.end_time
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.token = ?
    `, [token])
    const ticketArray = tickets as any[]
    if (!ticketArray || ticketArray.length === 0) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 404 })
    }
    const ticket = ticketArray[0]
    if (ticket.is_verified) {
      return NextResponse.json({ message: 'This ticket has already been used' }, { status: 400 })
    }
    return NextResponse.json({
      event: {
        id: ticket.event_id,
        name: ticket.name,
        type: ticket.type,
        location: ticket.location,
        description: ticket.description,
        start_time: ticket.start_time,
        end_time: ticket.end_time
      }
    })
  } catch (error) {
    console.error('Error fetching event data:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 })
    }
    const body = await request.json()
    const { token, name, email, phone, organization } = body
    if (!token || !name || !email) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }
    // Query ticket dan event
    const [tickets] = await db.execute(`
      SELECT t.id as ticket_id, t.token, t.is_verified, e.id as event_id, e.name, e.type, e.location, e.description, e.start_time, e.end_time
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.token = ?
    `, [token])
    const ticketArray = tickets as any[]
    if (!ticketArray || ticketArray.length === 0) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 404 })
    }
    const ticket = ticketArray[0]
    if (ticket.is_verified) {
      return NextResponse.json({ message: 'This ticket has already been used' }, { status: 400 })
    }
    // Insert participant
    const [participantResult] = await db.execute(`
      INSERT INTO participants (ticket_id, name, email, phone, organization)
      VALUES (?, ?, ?, ?, ?)
    `, [ticket.ticket_id, name, email, phone || null, organization || null])
    const participantId = (participantResult as any).insertId
    // Mark ticket as verified
    await db.execute('UPDATE tickets SET is_verified = TRUE WHERE id = ?', [ticket.ticket_id])
    // Sertifikat otomatis (try-catch terpisah)
    try {
      const [certRows] = await db.execute('SELECT id FROM certificates WHERE participant_id = ?', [participantId])
      if ((certRows as any[]).length === 0) {
        const certPath = await generateCertificate({
          participantName: name,
          eventName: ticket.name,
          participantId,
          eventId: ticket.event_id
        })
        await db.execute('INSERT INTO certificates (participant_id, path, sent) VALUES (?, ?, ?)', [participantId, certPath, false])
      }
    } catch (certError) {
      console.error('Certificate generation failed:', certError)
    }
    // Email konfirmasi (try-catch terpisah)
    try {
      const eventDetails = `\nEvent: ${ticket.name}\nType: ${ticket.type}\nLocation: ${ticket.location}\nDate: ${new Date(ticket.start_time).toLocaleString()} - ${new Date(ticket.end_time).toLocaleString()}\n${ticket.description ? `Description: ${ticket.description}` : ''}`
      await sendRegistrationEmail(email, name, ticket.name, eventDetails)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }
    return NextResponse.json({ 
      message: 'Registration successful',
      participantId: participantId,
      event: {
        id: ticket.event_id,
        name: ticket.name,
        type: ticket.type,
        location: ticket.location,
        description: ticket.description,
        start_time: ticket.start_time,
        end_time: ticket.end_time
      }
    })
  } catch (error) {
    console.error('Error processing registration:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}