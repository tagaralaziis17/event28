import db from '@/lib/db'
import EventDetailClient from './EventDetailClient'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

async function getEventDetails(eventId: string) {
  try {
    const [eventRows] = await db.execute(`
      SELECT e.*, 
             COUNT(t.id) as total_tickets,
             COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) as verified_tickets
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `, [eventId])
    const events = eventRows as any[]
    if (events.length === 0) {
      return null
    }
    const [participantRows] = await db.execute(`
      SELECT p.*, t.token, t.is_verified
      FROM participants p
      JOIN tickets t ON p.ticket_id = t.id
      WHERE t.event_id = ?
      ORDER BY p.registered_at DESC
    `, [eventId])
    return {
      event: events[0],
      participants: participantRows as any[]
    }
  } catch (error) {
    console.error('Error fetching event details:', error)
    return null
  }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const data = await getEventDetails(params.id)
  if (!data) return <div>Event not found</div>
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.event.name}</h1>
        <Link href={`/dashboard/events/${params.id}/generate-offline`} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow transition-colors">Generate Ticket Offline</Link>
      </div>
      <EventDetailClient event={data.event} participants={data.participants} />
    </>
  )
}