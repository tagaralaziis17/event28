import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'
import db, { testConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting event creation...')
    
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Database connection failed')
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 })
    }

    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const type = formData.get('type') as string
    const location = formData.get('location') as string
    const description = formData.get('description') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const quota = parseInt(formData.get('quota') as string)
    const ticketDesignFile = formData.get('ticketDesign') as File | null

    console.log('📝 Creating event:', { name, slug, type, location, quota })

    if (!name || !slug || !type || !location || !startTime || !endTime || !quota) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (quota < 1 || quota > 10000) {
      return NextResponse.json({ message: 'Quota must be between 1 and 10,000' }, { status: 400 })
    }

    // Check if slug already exists
    const [existingSlug] = await db.execute('SELECT id FROM events WHERE slug = ?', [slug])
    if ((existingSlug as any[]).length > 0) {
      return NextResponse.json({ message: 'Slug already exists. Please use a different slug.' }, { status: 400 })
    }

    // Handle ticket design upload
    let ticketDesignPath = null
    let ticketDesignSize = null
    let ticketDesignType = null
    
    if (ticketDesignFile && ticketDesignFile.size > 0) {
      console.log('📁 Processing file upload:', ticketDesignFile.name, ticketDesignFile.size)
      
      // Validate file size (10MB limit)
      if (ticketDesignFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ message: 'File size must be less than 10MB' }, { status: 400 })
      }

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
      if (!allowedTypes.includes(ticketDesignFile.type)) {
        return NextResponse.json({ message: 'Only PNG, JPG, and GIF files are allowed' }, { status: 400 })
      }
      
      try {
        const bytes = await ticketDesignFile.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Ensure directories exist with absolute paths
        const projectRoot = process.cwd()
        const publicDir = path.join(projectRoot, 'public')
        const uploadsDir = path.join(publicDir, 'uploads')
        
        console.log('📂 Project root:', projectRoot)
        console.log('📂 Public directory:', publicDir)
        console.log('📂 Uploads directory:', uploadsDir)
        
        // Create directories if they don't exist
        try {
          await access(publicDir)
          console.log('✅ Public directory exists')
        } catch {
          await mkdir(publicDir, { recursive: true })
          console.log('✅ Created public directory')
        }
        
        try {
          await access(uploadsDir)
          console.log('✅ Uploads directory exists')
        } catch {
          await mkdir(uploadsDir, { recursive: true })
          console.log('✅ Created uploads directory')
        }
        
        // Generate unique filename with timestamp and random string
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 8)
        const fileExtension = path.extname(ticketDesignFile.name)
        const baseFileName = ticketDesignFile.name
          .replace(fileExtension, '')
          .replace(/[^a-zA-Z0-9.-]/g, '-')
          .toLowerCase()
        const filename = `ticket-${timestamp}-${randomString}-${baseFileName}${fileExtension}`
        const filepath = path.join(uploadsDir, filename)
        
        console.log('💾 Saving file to:', filepath)
        
        // Write file with proper error handling
        await writeFile(filepath, buffer, { mode: 0o644 })
        console.log('✅ File written successfully to:', filepath)
        
        // Verify file exists and get stats
        try {
          await access(filepath)
          console.log('✅ File verified - size:', ticketDesignFile.size, 'bytes')
          
          ticketDesignPath = `/uploads/${filename}`
          ticketDesignSize = ticketDesignFile.size
          ticketDesignType = ticketDesignFile.type

          console.log('🖼️ Ticket design saved successfully:', {
            path: ticketDesignPath,
            size: ticketDesignSize,
            type: ticketDesignType
          })

          // Validate path before saving to DB
          if (ticketDesignPath && (!ticketDesignPath.startsWith('/uploads/') || ticketDesignPath.includes('..'))) {
            throw new Error('Invalid ticket design path')
          }
        } catch (verifyError) {
          console.error('❌ File verification failed:', verifyError)
          throw new Error('Failed to verify saved file')
        }
      } catch (fileError) {
        console.error('❌ File upload error:', fileError)
        return NextResponse.json({ 
          message: 'Failed to upload ticket design: ' + (fileError instanceof Error ? fileError.message : 'Unknown error')
        }, { status: 500 })
      }
    }

    // Insert event into database
    console.log('💾 Inserting event into database...')
    const [eventResult] = await db.execute(`
      INSERT INTO events (name, slug, type, location, description, start_time, end_time, quota, ticket_design, ticket_design_size, ticket_design_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, slug, type, location, description, startTime, endTime, quota, ticketDesignPath, ticketDesignSize, ticketDesignType])

    const eventId = (eventResult as any).insertId
    console.log('🎉 Event created with ID:', eventId)

    // Track file upload in database if file was uploaded
    if (ticketDesignPath) {
      try {
        await db.execute(`
          INSERT INTO file_uploads (filename, original_name, file_path, file_size, file_type, upload_type, related_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [path.basename(ticketDesignPath), ticketDesignFile!.name, ticketDesignPath, ticketDesignSize, ticketDesignType, 'ticket_design', eventId])
        console.log('📝 File upload tracked in database')
      } catch (dbError) {
        console.error('⚠️ Failed to track file upload in database:', dbError)
      }
    }

    // Generate tickets with proper directory creation
    const ticketsDir = path.join(process.cwd(), 'public', 'tickets')
    try {
      await access(ticketsDir)
      console.log('✅ Tickets directory exists')
    } catch {
      await mkdir(ticketsDir, { recursive: true })
      console.log('✅ Created tickets directory')
    }
    
    console.log('🎫 Generating', quota, 'tickets...')

    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
    const tickets = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < quota; i++) {
      try {
        const token = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()
        const registrationUrl = `${serverUrl}/register?token=${token}`
        
        // Generate QR code with better error handling
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
        
        const qrCodePath = path.join(ticketsDir, `qr_${token}.png`)
        await writeFile(qrCodePath, qrCodeBuffer, { mode: 0o644 })
        
        // Add ticket to batch insert
        tickets.push([eventId, token, `/tickets/qr_${token}.png`, false])
        successCount++
        
        if ((i + 1) % 50 === 0 || i === quota - 1) {
          console.log(`✅ Generated ${i + 1}/${quota} tickets`)
        }
      } catch (ticketError) {
        console.error(`⚠️ Failed to generate ticket ${i + 1}:`, ticketError)
        errorCount++
      }
    }

    // Insert all tickets at once with better error handling
    if (tickets.length > 0) {
      try {
        const placeholders = tickets.map(() => '(?, ?, ?, ?)').join(', ')
        const values = tickets.flat()
        await db.execute(`
          INSERT INTO tickets (event_id, token, qr_code_url, is_verified) VALUES ${placeholders}
        `, values)
        console.log(`✅ Inserted ${tickets.length} tickets into database`)
      } catch (insertError) {
        console.error('❌ Failed to insert tickets:', insertError)
        return NextResponse.json({ 
          message: 'Event created but failed to generate some tickets',
          eventId: eventId,
          ticketsGenerated: successCount,
          ticketErrors: errorCount
        }, { status: 207 }) // 207 Multi-Status
      }
    }

    console.log('✅ Event creation completed successfully')

    return NextResponse.json({ 
      message: 'Event created successfully',
      eventId: eventId,
      ticketsGenerated: successCount,
      ticketErrors: errorCount,
      ticketDesign: ticketDesignPath
    })
  } catch (error) {
    console.error('❌ Error creating event:', error)
    return NextResponse.json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🔍 Starting GET /api/events...')
    
    // Test database connection first
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('❌ Database connection failed in GET /api/events')
      return NextResponse.json({ message: 'Database connection failed' }, { status: 500 })
    }

    console.log('🔍 Fetching all events with statistics...')

    // Enhanced query to get events with ticket statistics
    const [events] = await db.execute(`
      SELECT e.*, 
             COUNT(t.id) as total_tickets,
             COUNT(CASE WHEN t.is_verified = TRUE THEN 1 END) as verified_tickets
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `)

    // Process events to add statistics
    const eventsWithStats = (events as any[]).map(event => {
      const totalTickets = event.total_tickets || 0
      const verifiedTickets = event.verified_tickets || 0
      const availableTickets = totalTickets - verifiedTickets

      return {
        ...event,
        total_tickets: totalTickets,
        verified_tickets: verifiedTickets,
        available_tickets: availableTickets
      }
    })
    
    console.log('📊 Fetched', eventsWithStats.length, 'events with statistics')
    
    // Log sample event for debugging
    if (eventsWithStats.length > 0) {
      console.log('📝 Sample event data:', {
        id: eventsWithStats[0].id,
        name: eventsWithStats[0].name,
        total_tickets: eventsWithStats[0].total_tickets,
        verified_tickets: eventsWithStats[0].verified_tickets,
        ticket_design: eventsWithStats[0].ticket_design
      })
    }
    
    return NextResponse.json(eventsWithStats)
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json({ message: 'Event ID is required' }, { status: 400 })
    }

    // Get event details including file paths
    const [events] = await db.execute('SELECT ticket_design FROM events WHERE id = ?', [eventId])
    const eventArray = events as any[]
    
    if (eventArray.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = eventArray[0]

    // Delete associated files if they exist
    if (event.ticket_design) {
      try {
        const fs = require('fs').promises
        const filePath = path.join(process.cwd(), 'public', event.ticket_design)
        await fs.unlink(filePath)
        console.log('🗑️ Deleted file:', filePath)
      } catch (fileError) {
        console.error('⚠️ Error deleting file:', fileError)
      }
    }

    // Delete event (cascade will handle tickets, participants, certificates)
    await db.execute('DELETE FROM events WHERE id = ?', [eventId])

    console.log('🗑️ Event deleted:', eventId)

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting event:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}