"use client"
import Link from 'next/link'
import { Calendar, Award, Download, Filter, Search, FileText, Send } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import EventImage from '@/components/EventImage'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function CertificatesClient({ certificates, uniqueEvents }: { certificates: any[], uniqueEvents: any[] }) {
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templatePreview, setTemplatePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterEvent, setFilterEvent] = useState('')

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setTemplateFile(file)
      setTemplatePreview(URL.createObjectURL(file))
    }
  }

  const handleTemplateUpload = async () => {
    if (!templateFile) return
    setUploading(true)
    const form = new FormData()
    form.append('certificateTemplate', templateFile)
    try {
      const res = await fetch('/api/certificates/templates', { method: 'POST', body: form })
      if (res.ok) {
        toast.success('Template uploaded successfully!')
        setTemplateFile(null)
        setTemplatePreview(null)
        // TODO: Refresh template list if needed
      } else {
        const data = await res.json()
        toast.error('Upload failed: ' + data.message)
      }
    } catch (err) {
      toast.error('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/certificates/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'certificates.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Export failed')
      }
    } finally {
      setExporting(false)
    }
  }

  const filteredCertificates = certificates.filter((c: any) => {
    const matchesSearch = c.participant_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchesEvent = !filterEvent || c.event_name === filterEvent
    const matchesStatus = !filterStatus || (filterStatus === 'sent' ? c.sent : !c.sent)
    return matchesSearch && matchesEvent && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Certificates</h2>
            <p className="text-gray-600">Manage and distribute event certificates</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-gray-700" >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              <span>{exporting ? 'Exporting...' : 'Export All'}</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search certificates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" value={filterEvent} onChange={e => setFilterEvent(e.target.value)}>
                <option value="">All Events</option>
                {uniqueEvents.map((ev: any) => <option key={ev.name} value={ev.name}>{ev.name}</option>)}
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Menu Upload Template Sertifikat */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Certificate Template (A4)</h3>
          <p className="text-sm text-gray-600 mb-2">Upload desain sertifikat format A4 (PNG/JPG/PDF). Sistem akan otomatis menempatkan nama peserta pada posisi baku (misal: tengah bawah). Admin bisa menyesuaikan desain sesuai template yang diberikan sistem.</p>
          <div className="flex items-center space-x-4">
            <input type="file" accept="image/*,application/pdf" onChange={handleTemplateChange} className="block" />
            <button onClick={handleTemplateUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2" disabled={!templateFile || uploading}>
              {uploading ? <span className="animate-spin mr-2"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg></span> : null}
              Upload
            </button>
            {templatePreview && (
              <img src={templatePreview} alt="Preview" className="h-24 border rounded ml-4" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">Nama peserta akan otomatis ditempatkan di posisi: <span className="font-mono bg-gray-100 px-2 py-1 rounded">(x: 50%, y: 85%)</span> (tengah bawah halaman A4)</p>
        </div>

        {/* Daftar Event Unik */}
        {uniqueEvents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Events</h3>
            <div className="flex flex-wrap gap-4">
              {uniqueEvents.map((event: any) => (
                <div key={event.name} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4 border border-gray-100">
                  <div>
                    <div className="text-base font-bold text-gray-900">{event.name}</div>
                    <div className="text-xs text-gray-500 mb-1">{event.type}</div>
                  </div>
                  {event.ticket_design && (
                    <EventImage src={event.ticket_design} alt="Certificate Design" className="w-24 h-16" width={96} height={64} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates Table */}
        {filteredCertificates.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Certificates</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certificate Design
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCertificates.map((certificate: any) => (
                    <tr key={certificate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{certificate.participant_name}</div>
                          <div className="text-sm text-gray-500">{certificate.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{certificate.event_name}</div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            certificate.event_type === 'Seminar' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {certificate.event_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {certificate.ticket_design ? (
                          <EventImage src={certificate.ticket_design.startsWith('/') ? certificate.ticket_design : `/uploads/${certificate.ticket_design}`} alt="Certificate Design" className="w-20 h-12" width={80} height={48} />
                        ) : (
                          <span className="text-xs text-gray-400">No Design</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          certificate.sent
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {certificate.sent ? 'Sent' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(certificate.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <a
                            href={certificate.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <FileText className="h-4 w-4" />
                            <span>View</span>
                          </a>
                          <button className="text-green-600 hover:text-green-900 flex items-center space-x-1 cursor-not-allowed opacity-50" disabled title="Coming Soon">
                            <Send className="h-4 w-4" />
                            <span>Send</span>
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
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600">Certificates will appear here once they are generated for participants</p>
          </div>
        )}
      </div>
    </div>
  )
} 