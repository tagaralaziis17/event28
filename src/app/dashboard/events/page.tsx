import db from '@/lib/db'
import EventsClient from './EventsClient'
import path from 'path'

async function getEvents() {
  try {
    const [rows] = await db.execute('SELECT * FROM event_statistics ORDER BY start_time DESC')
    return rows as any[]
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

async function getParticipants() {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, t.token, t.is_verified, e.name as event_name, e.type as event_type
      FROM participants p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      ORDER BY p.registered_at DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error('Error fetching participants:', error)
    return []
  }
}

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getEvents()
  console.log('EVENTS DATA:', events)
  return <EventsClient events={events} />
}