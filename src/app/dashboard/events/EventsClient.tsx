"use client"
import Link from 'next/link'
import { Calendar, MapPin, Users, Plus, Ticket, RotateCw, CheckCircle, Clock, XCircle, Pencil, Hourglass, Download, Printer } from 'lucide-react'
import EventImage from '@/components/EventImage'
import DeleteEventButton from '@/components/DeleteEventButton'
import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'

export default function EventsClient({ events: initialEvents }: { events: any[] }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalImage, setModalImage] = useState<string|null>(null)
  const [events, setEvents] = useState(initialEvents)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null)
  const [sortBy, setSortBy] = useState('date')

  // Polling: auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Manual refresh
  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  let filteredEvents = events.filter((event: any) => {
    const matchesSearch = event.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = !filterType || (event.type && event.type.toLowerCase() === filterType.toLowerCase())
    
    // Status logic
    let matchesStatus = true
    const now = new Date()
    const start = new Date(event.start_time)
    const end = new Date(event.end_time)
    
    if (filterStatus === 'upcoming') {
      matchesStatus = start > now
    } else if (filterStatus === 'ongoing') {
      matchesStatus = start <= now && end >= now
    } else if (filterStatus === 'completed') {
      matchesStatus = end < now
    }
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Sorting logic
  filteredEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'registrations') {
      return (b.verified_tickets || 0) - (a.verified_tickets || 0)
    } else if (sortBy === 'quota') {
      return (b.quota || 0) - (a.quota || 0)
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title + Create Event Button + Refresh */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">Events</h2>
            <button
              onClick={fetchEvents}
              className={`inline-flex items-center justify-center rounded-full bg-white border border-gray-200 shadow hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 h-10 w-10 ${loading ? 'opacity-60 cursor-wait' : ''}`}
              aria-label="Refresh events"
              disabled={loading}
            >
              <RotateCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''} text-blue-600`} />
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-400 ml-2 hidden sm:inline">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <Link 
            href="/dashboard/events/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-lg shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </Link>
        </div>

        {/* Search, Filter, and Sort */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Seminar">Seminar</option>
                <option value="Workshop">Workshop</option>
                <option value="Conference">Conference</option>
                <option value="Training">Training</option>
                <option value="Webinar">Webinar</option>
                <option value="Other">Other</option>
              </select>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="registrations">Sort by Registrations</option>
                <option value="quota">Sort by Quota</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event: any) => {
              const quota = event.quota || event.total_tickets || 0
              const verified = event.verified_tickets || 0
              const registrationRate = quota > 0 ? Math.round((verified / quota) * 100) : 0
              
              const now = new Date()
              const start = new Date(event.start_time)
              const end = new Date(event.end_time)
              
              let statusBadge = null
              let cardClass = ''
              
              if (start > now) {
                const daysLeft = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 shadow">
                    <Hourglass className="h-3 w-3" />
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Starting today'}
                  </span>
                )
                cardClass = 'hover:shadow-xl transition-all duration-300 border-l-4 border-blue-400'
              } else if (start <= now && end >= now) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 shadow animate-pulse">
                    <Clock className="h-3 w-3" />
                    Ongoing
                  </span>
                )
                cardClass = 'hover:shadow-xl transition-all duration-300 border-l-4 border-green-400'
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 shadow">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                )
                cardClass = 'opacity-75 hover:opacity-100 transition-all duration-300 border-l-4 border-gray-300'
              }

              return (
                <div key={event.id} className={`bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden ${cardClass}`}>
                  {/* Event Image */}
                  <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    <EventImage
                      src={event.ticket_design}
                      alt="Event Design"
                      className="w-full h-full"
                      width={400}
                      height={192}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full shadow bg-white/90 ${
                        event.type === 'Seminar' ? 'text-blue-700' : 'text-purple-700'
                      }`}>
                        {event.type}
                      </span>
                      {statusBadge}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 flex flex-col p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{event.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{event.description || 'No description available'}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{formatDateTime(event.start_time)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <Users className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span>{verified} / {quota} registered</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Registration Progress</span>
                        <span>{registrationRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${registrationRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm transition-colors flex-1 justify-center"
                      >
                        <Ticket className="h-4 w-4" />
                        <span>View</span>
                      </Link>
                      
                      <Link
                        href={`/dashboard/events/${event.id}/edit`}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium text-sm transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        href={`/dashboard/events/${event.id}/generate-offline`}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-sm transition-colors"
                        title="Generate Offline Tickets"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print</span>
                      </Link>

                      <DeleteEventButton eventId={event.id} eventName={event.name} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">
              {search || filterType || filterStatus 
                ? 'Try adjusting your search or filters' 
                : 'Create your first event to get started'
              }
            </p>
            {!search && !filterType && !filterStatus && (
              <Link
                href="/dashboard/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Create Event</span>
              </Link>
            )}
          </div>
        )}

        {/* Modal for Event Image */}
        {modalImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-8 flex flex-col items-center animate-fade-in-up">
              <button
                className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 rounded-full p-2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                onClick={() => setModalImage(null)}
                aria-label="Close"
              >
                <XCircle className="h-6 w-6" />
              </button>
              
              <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <img 
                  src={modalImage} 
                  alt="Event Design" 
                  className="w-full h-full object-contain rounded-2xl" 
                />
              </div>
              
              <span className="text-gray-700 text-sm mt-4 font-medium">Event Design Preview</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}