import React from 'react'
import db from '@/lib/db'

// Helper for copy-to-clipboard
function copyToClipboard(text: string) {
  if (typeof window !== 'undefined' && window.navigator) {
    window.navigator.clipboard.writeText(text)
  }
}

function safeDateString(date: any) {
  if (!date) return '-'
  const d = new Date(date)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString()
}

async function getParticipantDetail(id: string) {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, t.token, t.qr_code_url, t.is_verified, t.certificate_url, e.name as event_name, e.type as event_type, e.location, e.start_time, e.end_time
      FROM participants p
      JOIN tickets t ON p.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE p.id = ?
    `, [id])
    return (rows as any[])[0] || null
  } catch (err) {
    console.error('Error fetching participant detail:', err)
    return null
  }
}

export default async function ParticipantDetailPage({ params }: { params: { id: string } }) {
  const participant = await getParticipantDetail(params.id)
  if (!participant) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Participant Not Found</h1>
        <p className="text-gray-600">The participant data could not be found or is incomplete.</p>
      </div>
    </div>
  )
  const eventTime = participant.start_time && participant.end_time ? `${safeDateString(participant.start_time)} - ${safeDateString(participant.end_time)}` : '-'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Participant Detail</h1>
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 text-xs text-gray-400">ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{participant.id || '-'}</span></div>
          <div className="mb-2">
            <span className="text-lg font-semibold text-gray-900">{participant.name || '-'}</span>
            {participant.organization && <span className="ml-2 text-xs text-gray-500">({participant.organization})</span>}
          </div>
          <div className="mb-2 text-gray-700 text-sm">{participant.email || '-'}{participant.phone && <span className="ml-2">• {participant.phone}</span>}</div>
          <div className="mb-2 text-gray-700 text-sm">Event: <span className="font-semibold">{participant.event_name || '-'}</span> <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{participant.event_type || '-'}</span></div>
          <div className="mb-2 text-gray-700 text-sm">Location: <span className="font-semibold">{participant.location || '-'}</span></div>
          <div className="mb-2 text-gray-700 text-sm">Event Time: <span className="font-mono">{eventTime}</span></div>
          <div className="mb-2 text-gray-700 text-sm">Registered: <span className="font-mono">{safeDateString(participant.registered_at)}</span></div>
          <div className="mb-2 text-gray-700 text-sm">Status: {participant.is_verified ? <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><span className="mr-1">✔</span>Verified</span> : <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><span className="mr-1">⏳</span>Pending</span>}</div>
        </div>
        <div className="mb-6 flex flex-col items-center">
          <div className="text-xs text-gray-400 mb-1">Token <span title="Copy token" className="ml-1 cursor-pointer" onClick={() => participant.token && copyToClipboard(participant.token)}>📋</span></div>
          <div className="font-mono text-base bg-gray-100 px-3 py-2 rounded mb-2 select-all">{participant.token || '-'}</div>
          <div className="mb-2">
            {participant.qr_code_url ? (
              <img src={participant.qr_code_url.includes('/tickets/') ? participant.qr_code_url : (participant.qr_code_url.startsWith('/') ? participant.qr_code_url : `/tickets/${participant.qr_code_url}`)} alt="QR Code" className="w-32 h-32 rounded-lg border border-gray-200 shadow" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center bg-gray-100 text-gray-400 rounded-lg border border-gray-200">No QR</div>
            )}
          </div>
          <div className="text-xs text-gray-400">Scan QR code for registration/validation</div>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-col gap-2 mb-2">
          {!participant.is_verified && (
            <button className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition" title="Verifikasi manual (admin only)">Verifikasi Manual</button>
          )}
          {participant.email && (
            <button className="w-full py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition" title="Kirim ulang email registrasi">Kirim Ulang Email</button>
          )}
          {participant.certificate_url ? (
            <a href={participant.certificate_url} target="_blank" rel="noopener noreferrer" className="w-full block py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold text-center transition" title="Unduh sertifikat">Unduh Sertifikat</a>
          ) : (
            <button className="w-full py-2 rounded bg-gray-200 text-gray-500 font-semibold cursor-not-allowed" disabled title="Sertifikat belum tersedia">Sertifikat Belum Tersedia</button>
          )}
          <button className="w-full py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold transition" title="Hapus peserta (admin only)">Hapus Peserta</button>
        </div>
        <div className="text-xs text-gray-400 text-center mt-4">* Semua aksi cepat hanya untuk admin</div>
      </div>
    </div>
  )
} 