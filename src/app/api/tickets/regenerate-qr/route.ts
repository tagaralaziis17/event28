import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import db from '@/lib/db'

export async function POST() {
  try {
    console.log('🔄 Starting QR code regeneration...')
    
    // Get all tickets from database
    const [tickets] = await db.execute('SELECT id, token, event_id FROM tickets')
    const ticketsArray = tickets as any[]
    
    if (ticketsArray.length === 0) {
      return NextResponse.json({ message: 'No tickets found to regenerate' })
    }

    // Ensure tickets directory exists
    const ticketsDir = path.join(process.cwd(), 'public', 'tickets')
    try {
      await access(ticketsDir)
    } catch {
      await mkdir(ticketsDir, { recursive: true })
      console.log('✅ Created tickets directory')
    }

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
    let successCount = 0
    let errorCount = 0

    console.log(`🎫 Processing ${ticketsArray.length} tickets...`)

    for (const ticket of ticketsArray) {
      try {
        const registrationUrl = `${serverUrl}/register?token=${ticket.token}`
        const qrCodePath = path.join(ticketsDir, `qr_${ticket.token}.png`)
        const qrCodeUrl = `/tickets/qr_${ticket.token}.png`

        // Generate high-quality QR code
        const qrCodeBuffer = await QRCode.toBuffer(registrationUrl, {
          width: 400,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H',
          type: 'png',
        })

        // Write QR code file
        await writeFile(qrCodePath, qrCodeBuffer, { mode: 0o644 })

        // Update database with QR code URL
        await db.execute(
          'UPDATE tickets SET qr_code_url = ? WHERE id = ?',
          [qrCodeUrl, ticket.id]
        )

        successCount++

        if (successCount % 10 === 0) {
          console.log(`✅ Processed ${successCount}/${ticketsArray.length} tickets`)
        }
      } catch (error) {
        console.error(`❌ Failed to process ticket ${ticket.token}:`, error)
        errorCount++
      }
    }

    console.log(`🎉 QR regeneration completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      message: `Regenerated ${successCount} QR codes successfully`,
      success: successCount,
      errors: errorCount,
      total: ticketsArray.length
    })
  } catch (error) {
    console.error('❌ QR regeneration failed:', error)
    return NextResponse.json({
      error: 'Failed to regenerate QR codes',
      detail: String(error)
    }, { status: 500 })
  }
}