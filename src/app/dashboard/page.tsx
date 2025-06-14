export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Calendar, Users, Award, BarChart3, Plus, Eye, Ticket, TrendingUp, Clock, MapPin, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import db, { testConnection } from '@/lib/db'
import { formatDateTime } from '@/lib/utils'
import EventImage from '@/components/EventImage'
import path from 'path'

async function getDashboardStats() {
  try {
    console.log('🔍 Starting comprehensive dashboard stats fetch...')
    
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Database connection failed in getDashboardStats')
      return {
        totalEvents: 0,
        totalParticipants: 0,  
        totalTickets: 0,
        verifiedTickets: 0,
        availableTickets: 0,
        registrationRate: 0,
        upcomingEvents: 0,
        pastEvents: 0,
        ongoingEvents: 0,
        totalCertificates: 0,
        sentCertificates: 0,
        error: 'Database connection failed. Please check your database configuration and ensure MySQL is running.'
      }
    }

    console.log('🔍 Fetching comprehensive dashboard statistics...')

    // Get all statistics using MySQL queries
    const [eventsResult] = await db.execute('SELECT COUNT(*) as count FROM events')
    const [participantsResult] = await db.execute('SELECT COUNT(*) as count FROM participants')
    const [ticketsResult] = await db.execute('SELECT COUNT(*) as count FROM tickets')
    const [verifiedResult] = await db.execute('SELECT COUNT(*) as count FROM tickets WHERE is_verified = TRUE')
    const [upcomingEventsResult] = await db.execute('SELECT COUNT(*) as count FROM events WHERE start_time > NOW()')
    const [pastEventsResult] = await db.execute('SELECT COUNT(*) as count FROM events WHERE end_time < NOW()')
    const [ongoingEventsResult] = await db.execute('SELECT COUNT(*) as count FROM events WHERE start_time <= NOW() AND end_time >= NOW()')
    const [certificatesResult] = await db.execute('SELECT COUNT(*) as count FROM certificates')
    const [sentCertificatesResult] = await db.execute('SELECT COUNT(*) as count FROM certificates WHERE sent = TRUE')
    
    const totalEvents = (eventsResult as any)[0].count || 0
    const totalParticipants = (participantsResult as any)[0].count || 0
    const totalTickets = (ticketsResult as any)[0].count || 0
    const verifiedTickets = (verifiedResult as any)[0].count || 0
    const upcomingEvents = (upcomingEventsResult as any)[0].count || 0
    const pastEvents = (pastEventsResult as any)[0].count || 0
    const ongoingEvents = (ongoingEventsResult as any)[0].count || 0
    const totalCertificates = (certificatesResult as any)[0].count || 0
    const sentCertificates = (sentCertificatesResult as any)[0].count || 0

    const stats = {
      totalEvents,
      totalParticipants,
      totalTickets,
      verifiedTickets,
      availableTickets: totalTickets - verifiedTickets,
      registrationRate: totalTickets > 0 ? Math.round((verifiedTickets / totalTickets) * 100) : 0,
      upcomingEvents,
      pastEvents,
      ongoingEvents,
      totalCertificates,
      sentCertificates,
    }

    console.log('📊 Comprehensive dashboard stats fetched successfully:', stats)
    return stats
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    return {
      totalEvents: 0,
      totalParticipants: 0,  
      totalTickets: 0,
      verifiedTickets: 0,
      availableTickets: 0,
      registrationRate: 0,
      upcomingEvents: 0,
      pastEvents: 0,
      ongoingEvents: 0,
      totalCertificates: 0,
      sentCertificates: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function getRecentEvents() {
  try {
    console.log('🔍 Starting comprehensive events fetch...')
    
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Database connection failed in getRecentEvents')
      return []
    }

    console.log('🔍 Fetching events with complete statistics and status...')

    // Enhanced query to get events with complete statistics and status
    const [events] = await db.execute(`
      SELECT e.*, 
             COUNT(t.id) as total_tickets,
             COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) as verified_tickets,
             COUNT(p.id) as participant_count
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      LEFT JOIN participants p ON t.id = p.ticket_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `)

    // Process events to add statistics and status
    const eventsWithStats = (events as any[]).map(event => {
      const totalTickets = event.total_tickets || 0
      const verifiedTickets = event.verified_tickets || 0
      const availableTickets = totalTickets - verifiedTickets
      const participantCount = event.participant_count || 0

      // Determine event status
      const now = new Date()
      const startTime = new Date(event.start_time)
      const endTime = new Date(event.end_time)
      
      let eventStatus = 'completed'
      let daysUntilStart = null
      
      if (startTime > now) {
        eventStatus = 'upcoming'
        daysUntilStart = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      } else if (startTime <= now && endTime >= now) {
        eventStatus = 'ongoing'
        daysUntilStart = 0
      }

      return {
        ...event,
        total_tickets: totalTickets,
        verified_tickets: verifiedTickets,
        available_tickets: availableTickets,
        participant_count: participantCount,
        event_status: eventStatus,
        days_until_start: daysUntilStart
      }
    })
    
    console.log(`📊 Found ${eventsWithStats.length} events with complete statistics and status`)
    
    // Log sample event for debugging
    if (eventsWithStats.length > 0) {
      console.log('📝 Sample event data:', {
        id: eventsWithStats[0].id,
        name: eventsWithStats[0].name,
        status: eventsWithStats[0].event_status,
        total_tickets: eventsWithStats[0].total_tickets,
        verified_tickets: eventsWithStats[0].verified_tickets,
        participant_count: eventsWithStats[0].participant_count,
        days_until_start: eventsWithStats[0].days_until_start,
        ticket_design: eventsWithStats[0].ticket_design
      })
    }
    
    return eventsWithStats
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return []
  }
}

async function getRecentActivity() {
  try {
    console.log('🔍 Fetching recent activity...')
    
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Database connection failed in getRecentActivity')
      return []
    }

    // Get recent registrations with event details
    const [activities] = await db.execute(`
      SELECT p.*, e.name as event_name, e.type as event_type, e.start_time
      FROM participants p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      ORDER BY p.registered_at DESC
      LIMIT 10
    `)

    // Process activities to flatten the structure
    const processedActivities = (activities as any[]).map(activity => ({
      id: activity.id,
      participant_name: activity.name,
      email: activity.email,
      organization: activity.organization,
      registered_at: activity.registered_at,
      event_name: activity.event_name || 'Unknown Event',
      event_type: activity.event_type || 'Unknown',
      start_time: activity.start_time,
      activity_type: 'registration'
    }))
    
    console.log(`📊 Found ${processedActivities.length} recent activities`)
    
    return processedActivities
  } catch (error) {
    console.error('❌ Error fetching recent activity:', error)
    return []
  }
}

async function getEventTypeStats() {
  try {
    console.log('🔍 Fetching event type statistics...')
    
    const isConnected = await testConnection()
    if (!isConnected) {
      return { 
        seminars: 0, 
        workshops: 0,
        seminarParticipants: 0,
        workshopParticipants: 0 
      }
    }

    // Get events with their participant counts
    const [events] = await db.execute(`
      SELECT e.type,
             COUNT(DISTINCT e.id) as event_count,
             COUNT(p.id) as participant_count
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      LEFT JOIN participants p ON t.id = p.ticket_id
      GROUP BY e.type
    `)

    const result = { 
      seminars: 0, 
      workshops: 0, 
      seminarParticipants: 0, 
      workshopParticipants: 0 
    }
    
    ;(events as any[]).forEach(event => {
      if (event.type === 'Seminar') {
        result.seminars = event.event_count || 0
        result.seminarParticipants = event.participant_count || 0
      } else if (event.type === 'Workshop') {
        result.workshops = event.event_count || 0
        result.workshopParticipants = event.participant_count || 0
      }
    })
    
    console.log('📊 Event type stats:', result)
    return result
  } catch (error) {
    console.error('❌ Error fetching event type stats:', error)
    return { 
      seminars: 0, 
      workshops: 0, 
      seminarParticipants: 0, 
      workshopParticipants: 0 
    }
  }
}

export default async function DashboardPage() {
  console.log('🚀 Loading enhanced dashboard page...')
  
  const [stats, recentEvents, recentActivity, eventTypeStats] = await Promise.all([
    getDashboardStats(),
    getRecentEvents(),
    getRecentActivity(),
    getEventTypeStats()
  ])

  console.log('📊 Final enhanced dashboard data:', {
    stats,
    eventsCount: recentEvents.length,
    activitiesCount: recentActivity.length,
    eventTypeStats
  })

  // Show database connection error if exists
  const hasDbError = 'error' in stats

  // Recent Notifications logic
  const now = new Date()
  const notifications = []
  for (const event of recentEvents) {
    if (event.event_status === 'upcoming' && event.days_until_start !== null && event.days_until_start <= 3 && event.days_until_start >= 0) {
      notifications.push({
        type: 'countdown',
        icon: 'calendar',
        color: 'yellow',
        title: `Event "${event.name}" akan dimulai dalam ${event.days_until_start} hari`,
        date: formatDateTime(event.start_time),
        event
      })
    }
    const quota = event.total_tickets || 0
    const verified = event.verified_tickets || 0
    if (quota > 0 && (quota - verified) / quota <= 0.1) {
      notifications.push({
        type: 'quota',
        icon: 'users',
        color: 'red',
        title: `Kuota event "${event.name}" hampir penuh (${verified}/${quota})`,
        date: formatDateTime(event.start_time),
        event
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Comprehensive overview of your event management system</p>
          {hasDbError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">Database Connection Error</p>
              </div>
              <p className="text-red-600 text-sm mt-1">
                {(stats as any).error}
              </p>
              <div className="mt-2 text-sm text-red-600">
                <p>💡 Solutions:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Run <code className="bg-red-100 px-1 rounded">docker-compose up -d</code> to start the database</li>
                  <li>Check your .env file for correct database credentials</li>
                  <li>Ensure MySQL server is running on port 3306</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards - Large, Old Design Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-gray-500 font-semibold mb-1 text-lg">Total Events</div>
              <div className="text-4xl font-bold text-gray-900">{stats.totalEvents}</div>
              <div className="flex items-center mt-2 text-green-600 font-semibold text-base">
                <CheckCircle className="h-5 w-5 mr-1" /> {stats.upcomingEvents} upcoming
              </div>
              <div className="text-sm text-gray-400 mt-2">{eventTypeStats.seminars} seminars • {eventTypeStats.workshops} workshops</div>
            </div>
            <div className="flex justify-end mt-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
          {/* Total Participants */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-gray-500 font-semibold mb-1 text-lg">Total Participants</div>
              <div className="text-4xl font-bold text-gray-900">{stats.totalParticipants}</div>
              <div className="flex items-center mt-2 text-green-600 font-semibold text-base">
                <TrendingUp className="h-5 w-5 mr-1" /> Registered users
              </div>
              <div className="text-sm text-gray-400 mt-2">Seminars: {eventTypeStats.seminarParticipants} • Workshops: {eventTypeStats.workshopParticipants}</div>
            </div>
            <div className="flex justify-end mt-4">
              <div className="bg-green-50 p-4 rounded-xl">
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
          {/* Ticket Status */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-gray-500 font-semibold mb-1 text-lg">Ticket Status</div>
              <div className="text-4xl font-bold text-gray-900">{stats.verifiedTickets}/{stats.totalTickets}</div>
              <div className="flex items-center mt-2 text-orange-500 font-semibold text-base">
                {stats.availableTickets} available
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-purple-500">{stats.registrationRate}% filled</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
                <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${stats.registrationRate}%` }} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <div className="bg-orange-50 p-4 rounded-xl">
                <Ticket className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
          {/* Certificates */}
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-gray-500 font-semibold mb-1 text-lg">Certificates</div>
              <div className="text-4xl font-bold text-gray-900">{stats.sentCertificates}/{stats.totalCertificates}</div>
              <div className="flex items-center mt-2 text-purple-500 font-semibold text-base">
                <Award className="h-5 w-5 mr-1" /> {stats.totalCertificates - stats.sentCertificates} pending
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-3">
                <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${stats.totalCertificates > 0 ? Math.round((stats.sentCertificates / stats.totalCertificates) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Large, Colorful Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/events" className="rounded-2xl p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg flex flex-col justify-between min-h-[180px] transition-all hover:scale-[1.03]">
            <Calendar className="h-9 w-9 mb-4" />
            <div>
              <h3 className="text-2xl font-bold mb-1">Manage Events</h3>
              <p className="text-lg mb-2">Create, edit, and view all events</p>
              <div className="text-base text-blue-100">{stats.totalEvents} total events</div>
            </div>
          </Link>
          <Link href="/dashboard/participants" className="rounded-2xl p-8 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg flex flex-col justify-between min-h-[180px] transition-all hover:scale-[1.03]">
            <Users className="h-9 w-9 mb-4" />
            <div>
              <h3 className="text-2xl font-bold mb-1">Participants</h3>
              <p className="text-lg mb-2">View and manage participants</p>
              <div className="text-base text-green-100">{stats.totalParticipants} registered</div>
            </div>
          </Link>
          <Link href="/dashboard/certificates" className="rounded-2xl p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg flex flex-col justify-between min-h-[180px] transition-all hover:scale-[1.03]">
            <Award className="h-9 w-9 mb-4" />
            <div>
              <h3 className="text-2xl font-bold mb-1">Certificates</h3>
              <p className="text-lg mb-2">Generate and manage certificates</p>
              <div className="text-base text-purple-100">{stats.sentCertificates}/{stats.totalCertificates} sent</div>
            </div>
          </Link>
          <Link href="/dashboard/reports" className="rounded-2xl p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg flex flex-col justify-between min-h-[180px] transition-all hover:scale-[1.03]">
            <BarChart3 className="h-9 w-9 mb-4" />
            <div>
              <h3 className="text-2xl font-bold mb-1">Reports</h3>
              <p className="text-lg mb-2">View analytics and reports</p>
              <div className="text-base text-orange-100">{stats.registrationRate}% avg. fill rate</div>
            </div>
          </Link>
        </div>

        {/* Events + Notifications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Upcoming Events / All Events */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Events</h3>
              <Link href="/dashboard/events" className="flex items-center gap-2 font-bold text-blue-600 text-xl hover:underline focus:outline-none">
                <span>Manage All</span>
                <Eye className="h-6 w-6" />
              </Link>
            </div>
            {recentEvents.filter(e => e.event_status === 'upcoming').length > 0 ? (
              <div className="flex flex-col gap-4">
                {recentEvents.filter(e => e.event_status === 'upcoming').map(event => (
                  <div key={event.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-2 md:gap-4 overflow-x-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${
                        event.event_status === 'upcoming' ? 'bg-green-100' :
                        event.event_status === 'ongoing' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`h-5 w-5 ${
                          event.event_status === 'upcoming' ? 'text-green-600' :
                          event.event_status === 'ongoing' ? 'text-yellow-600' : 'text-gray-600'
                        }`} />
                      </div>
                      {event.ticket_design && (
                        <EventImage 
                          src={event.ticket_design} 
                          alt="Ticket Design" 
                          className="w-12 h-8 flex-shrink-0" 
                          width={48} 
                          height={32} 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 text-base sm:text-lg truncate max-w-[140px] sm:max-w-xs">{event.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            event.event_status === 'upcoming' ? 'bg-green-100 text-green-800' :
                            event.event_status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.event_status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            event.type === 'Seminar' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[100px] sm:max-w-xs">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(event.start_time)}</span>
                          </div>
                          {event.event_status === 'upcoming' && event.days_until_start !== null && (
                            <span className="text-green-600 font-medium whitespace-nowrap">
                              {event.days_until_start > 0 ? `${event.days_until_start} days left` : 'Starting today'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-[90px]">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        {event.verified_tickets || 0}/{event.total_tickets || 0} Registered
                      </p>
                      <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">
                        {event.participant_count || 0} participants
                      </p>
                      <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.round(((event.verified_tickets || 0) / Math.max(event.total_tickets || 1, 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                        {Math.round(((event.verified_tickets || 0) / Math.max(event.total_tickets || 1, 1)) * 100)}% filled
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-16">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-400 text-lg font-medium">No upcoming events</p>
              </div>
            )}
          </div>
          {/* Recent Notifications */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Notifications</h3>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notif, idx) => (
                  <div key={idx} className={`flex items-start gap-3 rounded-lg p-4 ${notif.color === 'yellow' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    {notif.icon === 'calendar' ? <Calendar className="h-6 w-6 text-yellow-500 mt-1" /> : <Users className="h-6 w-6 text-red-500 mt-1" />}
                    <div>
                      <p className={`font-semibold ${notif.color === 'yellow' ? 'text-yellow-700' : 'text-red-700'}`}>{notif.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No notifications</div>
            )}
          </div>
        </div>
        {/* Recent Activity Full Width */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
            <Link href="/dashboard/participants" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.participant_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.organization && `${activity.organization} • `}
                      {activity.event_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(activity.registered_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${activity.event_type === 'Seminar' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{activity.event_type}</span>
                    {activity.start_time && new Date(activity.start_time) > new Date() && (
                      <span className="text-xs text-green-600 font-medium">Upcoming</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Explicitly mark this file as a module
export {}