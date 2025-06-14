"use client"
import Link from 'next/link'
import { Calendar, Users, Download, Filter, Search, Mail, Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useState } from 'react'

// Modern, responsive, and maintainable ParticipantsClient component
// Features: search, filter, export, status badge, empty/loading state, and clean code structure
export default function ParticipantsClient({ participants }: { participants: any[] }) {
  const [filterEvent, setFilterEvent] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string|null>(null)
  const [selected, setSelected] = useState<any|null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    setAlert(null)
    try {
      const res = await fetch('/api/participants/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'participants.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setAlert('Export CSV berhasil!')
      } else {
        setAlert('Export gagal!')
      }
    } catch {
      setAlert('Export gagal!')
    } finally {
      setExporting(false)
      setTimeout(() => setAlert(null), 3000)
    }
  }

  const handleView = (participant: any) => {
    setSelected(participant)
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
    setTimeout(() => setSelected(null), 300)
  }

  const filteredParticipants = participants.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
    const matchesEvent = !filterEvent || p.event_name === filterEvent
    const matchesStatus = !filterStatus || (filterStatus === 'verified' ? p.is_verified : !p.is_verified)
    return matchesSearch && matchesEvent && matchesStatus
  })

  const uniqueEvents = Array.from(new Set(participants.map((p: any) => p.event_name)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Participants</h2>
            <p className="text-gray-600">Manage event participants and their registration status</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 opacity-50 cursor-not-allowed" disabled title="Coming Soon">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="mb-4 p-4 rounded-lg bg-green-100 text-green-800 text-center font-medium animate-fade-in">
            {alert}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                <option value="">All Events</option>
                {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <span className="text-blue-600 font-semibold">Loading...</span>
          </div>
        )}

        {/* Participants Table */}
        {!loading && filteredParticipants.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Participants</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipants.map((participant: any) => (
                    <tr key={participant.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                          {participant.organization && (
                            <div className="text-xs text-gray-500">{participant.organization}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{participant.event_name}</div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${participant.event_type === 'Seminar' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{participant.event_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-700">{participant.token}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{participant.email}</div>
                        {participant.phone && (
                          <div className="text-xs text-gray-500">{participant.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${participant.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{participant.is_verified ? (<><span className="mr-1">✔</span>Verified</>) : (<><span className="mr-1">⏳</span>Pending</>)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(participant.registered_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(participant)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition"
                            title="View Detail"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          <button
                            className={`text-green-600 hover:text-green-900 flex items-center space-x-1 ${!participant.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Send Email"
                            disabled={!participant.email}
                          >
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No participants yet</h3>
            <p className="text-gray-600">Participants will appear here once they register for events</p>
          </div>
        )}
      </div>

      {/* Floating Modal for Participant Detail & QR */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 flex flex-col items-center animate-fade-in-up">
            <button
              className="absolute top-3 right-3 bg-gray-100 hover:bg-gray-200 rounded-full p-2 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={closeModal}
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-4 text-center">
              <div className="text-lg font-bold text-gray-900 mb-1">{selected.name || '-'}</div>
              <div className="text-sm text-gray-500 mb-1">{selected.email || '-'}{selected.phone && <span className="ml-2">• {selected.phone}</span>}</div>
              <div className="text-xs text-gray-400 mb-2">Token: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selected.token || '-'}</span></div>
              <div className="text-xs text-gray-400 mb-2">Event: <span className="font-semibold">{selected.event_name || '-'}</span></div>
              <div className="text-xs text-gray-400 mb-2">Registered: <span className="font-mono">{selected.registered_at ? new Date(selected.registered_at).toLocaleString() : '-'}</span></div>
              <div className="mb-2 text-gray-700 text-sm">Status: {selected.is_verified ? <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><span className="mr-1">✔</span>Verified</span> : <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><span className="mr-1">⏳</span>Pending</span>}</div>
            </div>
            <div className="mb-2">
              {selected.qr_code_url ? (
                <img src={selected.qr_code_url.includes('/tickets/') ? selected.qr_code_url : (selected.qr_code_url.startsWith('/') ? selected.qr_code_url : `/tickets/${selected.qr_code_url}`)} alt="QR Code" className="w-48 h-48 rounded-lg border border-gray-200 shadow" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg border border-gray-200">No QR</div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-2">Scan QR code for validation</div>
          </div>
        </div>
      )}
    </div>
  )
} 