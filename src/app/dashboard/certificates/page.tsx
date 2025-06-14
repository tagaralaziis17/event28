import db from '@/lib/db'
import CertificatesClient from './CertificatesClient'

async function getCertificates() {
  try {
    const [rows] = await db.execute(`
      SELECT c.*, p.name as participant_name, p.email, e.name as event_name, e.type as event_type, e.ticket_design
      FROM certificates c
      JOIN participants p ON c.participant_id = p.id
      JOIN tickets t ON p.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      ORDER BY c.created_at DESC
    `)
    return rows as any[]
  } catch (error) {
    console.error('Error fetching certificates:', error)
    return []
  }
}

export default async function CertificatesPage() {
  const certificates = await getCertificates()
  const uniqueEvents = Array.from(new Map(certificates.map(c => [c.event_name, { name: c.event_name, type: c.event_type, ticket_design: c.ticket_design }])).values())
  return <CertificatesClient certificates={certificates} uniqueEvents={uniqueEvents} />
}