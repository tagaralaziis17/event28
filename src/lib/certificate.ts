import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

interface GenerateCertificateOptions {
  participantName: string
  eventName: string
  participantId: number
  eventId: number
}

export async function generateCertificate({ participantName, eventName, participantId, eventId }: GenerateCertificateOptions): Promise<string> {
  // Pastikan folder public/certificates ada
  const certDir = path.join(process.cwd(), 'public', 'certificates')
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true })
  }
  // Nama file unik
  const filename = `cert_${participantId}_${eventId}.pdf`
  const filePath = path.join(certDir, filename)
  const publicPath = `/certificates/${filename}`

  // Generate PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    doc.font('Helvetica') // Always use built-in Helvetica
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)
    doc.fontSize(24).text('Certificate of Participation', { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(18).text(`Awarded to:`, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(28).text(participantName, { align: 'center', underline: true })
    doc.moveDown(2)
    doc.fontSize(18).text(`For participating in:`, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(22).text(eventName, { align: 'center' })
    doc.moveDown(4)
    doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' })
    doc.end()
    stream.on('finish', () => resolve(publicPath))
    stream.on('error', reject)
  })
}
// PENTING: Untuk memastikan semua form input terlihat jelas, pastikan semua input di seluruh aplikasi Next.js menggunakan className yang mengatur text-black dan bg-white atau bg-gray-50. Jika ada form yang belum jelas, mohon info file/halamannya. 