import db from '@/lib/db'
import ReportsClient from './ReportsClient'

async function getReportsData() {
  try {
    // Get overall statistics
    const [eventsResult] = await db.execute('SELECT COUNT(*) as count FROM events')
    const [participantsResult] = await db.execute('SELECT COUNT(*) as count FROM participants')
    const [ticketsResult] = await db.execute('SELECT COUNT(*) as count FROM tickets')
    const [verifiedResult] = await db.execute('SELECT COUNT(*) as count FROM tickets WHERE is_verified = TRUE')
    
    // Get event statistics
    const [eventStats] = await db.execute(`
      SELECT e.name, e.type, e.quota,
             COUNT(t.id) as total_tickets,
             COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) as verified_tickets,
             ROUND((COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) / COUNT(t.id)) * 100, 2) as registration_rate
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      GROUP BY e.id, e.name, e.type, e.quota
      ORDER BY verified_tickets DESC
    `)

    // Get monthly registration trends
    const [monthlyStats] = await db.execute(`
      SELECT 
        DATE_FORMAT(p.registered_at, '%Y-%m') as month,
        COUNT(*) as registrations
      FROM participants p
      GROUP BY DATE_FORMAT(p.registered_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `)

    return {
      totalEvents: (eventsResult as any)[0].count,
      totalParticipants: (participantsResult as any)[0].count,
      totalTickets: (ticketsResult as any)[0].count,
      verifiedTickets: (verifiedResult as any)[0].count,
      eventStats: eventStats as any[],
      monthlyStats: monthlyStats as any[]
    }
  } catch (error) {
    console.error('Error fetching reports data:', error)
    return {
      totalEvents: 0,
      totalParticipants: 0,
      totalTickets: 0,
      verifiedTickets: 0,
      eventStats: [],
      monthlyStats: []
    }
  }
}

export default async function ReportsPage() {
  const data = await getReportsData()
  return <ReportsClient data={data} />
}