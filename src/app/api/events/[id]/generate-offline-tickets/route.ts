import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import PDFDocument from 'pdfkit'
import bwipjs from 'bwip-js'

function isImageFile(file: File) {
  return file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.name?.endsWith('.png') || file.name?.endsWith('.jpg') || file.name?.endsWith('.jpeg'))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData()
    const templateFile = formData.get('template')
    const barcodeX = Number(formData.get('barcode_x'))
    const barcodeY = Number(formData.get('barcode_y'))
    const barcodeWidth = Number(formData.get('barcode_width'))
    const barcodeHeight = Number(formData.get('barcode_height'))
    const participants = JSON.parse(formData.get('participants') as string) as { name: string, token: string }[]

    console.log('📝 Processing offline ticket generation request...')
    console.log('Participants count:', participants.length)
    console.log('Barcode position:', { barcodeX, barcodeY, barcodeWidth, barcodeHeight })

    // Type guard for templateFile
    if (typeof templateFile !== 'object' || typeof (templateFile as any).arrayBuffer !== 'function' || typeof (templateFile as any).type !== 'string') {
      return NextResponse.json({ error: 'Invalid template file (not File/Blob)' }, { status: 400 })
    }

    const file = templateFile as File
    console.log('Template file:', file.name, file.type, file.size)

    if (!isImageFile(file)) {
      return NextResponse.json({ error: 'Template file must be PNG or JPG' }, { status: 400 })
    }

    if (participants.length === 0) {
      return NextResponse.json({ error: 'No participants to generate tickets for' }, { status: 400 })
    }

    if (participants.length > 1000) {
      return NextResponse.json({ error: 'Too many tickets, maximum 1000 per batch' }, { status: 400 })
    }

    let templateBuffer = Buffer.from(new Uint8Array(await file.arrayBuffer())) as Buffer

    // Convert JPG to PNG if needed
    if (file.type === 'image/jpeg' || file.name?.endsWith('.jpg') || file.name?.endsWith('.jpeg')) {
      try {
        templateBuffer = await sharp(templateBuffer).png().toBuffer()
        console.log('✅ Converted JPG to PNG')
      } catch (err) {
        return NextResponse.json({ error: 'Failed to convert JPG to PNG', detail: String(err) }, { status: 400 })
      }
    }

    // Get template dimensions
    const templateMeta = await sharp(templateBuffer).metadata()
    const templateWidth = templateMeta.width || 0
    const templateHeight = templateMeta.height || 0
    
    console.log('Template dimensions:', { templateWidth, templateHeight })
    console.log('Original barcode params:', { barcodeX, barcodeY, barcodeWidth, barcodeHeight })

    // Validate barcode position
    if (barcodeX < 0 || barcodeY < 0 || barcodeWidth <= 0 || barcodeHeight <= 0) {
      return NextResponse.json({ error: 'Invalid barcode position or size' }, { status: 400 })
    }

    if (barcodeX + barcodeWidth > templateWidth || barcodeY + barcodeHeight > templateHeight) {
      return NextResponse.json({
        error: `Barcode position exceeds template bounds. Template: ${templateWidth}x${templateHeight}px, Barcode: (${barcodeX},${barcodeY},${barcodeWidth},${barcodeHeight})`,
        templateWidth,
        templateHeight,
        barcodeX,
        barcodeY,
        barcodeWidth,
        barcodeHeight
      }, { status: 400 })
    }

    // Standard ticket size for A4 layout (2 columns x 5 rows)
    const PAGE_W = 2480 // A4 width at 300dpi
    const PAGE_H = 3508 // A4 height at 300dpi
    const TICKET_W = 1200 // Ticket width
    const TICKET_H = 680  // Ticket height
    const COLS = 2
    const ROWS = 5
    const MARGIN_X = 40
    const MARGIN_Y = 40
    const TICKETS_PER_PAGE = COLS * ROWS

    console.log('PDF layout:', { PAGE_W, PAGE_H, TICKET_W, TICKET_H, COLS, ROWS, TICKETS_PER_PAGE })

    // Resize template to fit ticket size while maintaining aspect ratio
    let resizedTemplateBuffer: Buffer
    try {
      resizedTemplateBuffer = await sharp(templateBuffer)
        .resize(TICKET_W, TICKET_H, { 
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer()
      
      console.log('✅ Template resized to ticket dimensions')
    } catch (err) {
      return NextResponse.json({ error: 'Failed to resize template', detail: String(err) }, { status: 500 })
    }

    // Calculate scaling factors
    const scaleX = TICKET_W / templateWidth
    const scaleY = TICKET_H / templateHeight
    const scale = Math.min(scaleX, scaleY) // Use uniform scaling to maintain aspect ratio

    // Calculate scaled barcode position and size
    const scaledBarcodeX = Math.round(barcodeX * scale)
    const scaledBarcodeY = Math.round(barcodeY * scale)
    const scaledBarcodeWidth = Math.max(100, Math.round(barcodeWidth * scale)) // Minimum 100px width
    const scaledBarcodeHeight = Math.max(50, Math.round(barcodeHeight * scale)) // Minimum 50px height

    console.log('Scaled barcode params:', { 
      scale, 
      scaledBarcodeX, 
      scaledBarcodeY, 
      scaledBarcodeWidth, 
      scaledBarcodeHeight 
    })

    // Ensure barcode fits within ticket bounds
    const finalBarcodeX = Math.min(scaledBarcodeX, TICKET_W - scaledBarcodeWidth)
    const finalBarcodeY = Math.min(scaledBarcodeY, TICKET_H - scaledBarcodeHeight)
    const finalBarcodeWidth = Math.min(scaledBarcodeWidth, TICKET_W - finalBarcodeX)
    const finalBarcodeHeight = Math.min(scaledBarcodeHeight, TICKET_H - finalBarcodeY)

    console.log('Final barcode params:', { 
      finalBarcodeX, 
      finalBarcodeY, 
      finalBarcodeWidth, 
      finalBarcodeHeight 
    })

    // Generate ticket images
    const ticketImages: Buffer[] = []
    console.log('🎫 Generating ticket images...')

    for (let i = 0; i < participants.length; i++) {
      const participant = participants[i]
      try {
        // Generate barcode with proper dimensions
        const barcodeBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: participant.token,
          scale: 2,
          height: Math.max(10, Math.floor(finalBarcodeHeight / 4)), // Height in mm
          width: Math.max(1, Math.floor(finalBarcodeWidth / 20)),   // Width multiplier
          includetext: false,
          backgroundcolor: 'FFFFFF',
          paddingwidth: 0,
          paddingheight: 0,
        })

        // Resize barcode to exact dimensions needed
        const resizedBarcodeBuffer = await sharp(barcodeBuffer)
          .resize(finalBarcodeWidth, finalBarcodeHeight, { fit: 'fill' })
          .png()
          .toBuffer()

        // Composite barcode onto template
        const ticketImg = await sharp(resizedTemplateBuffer)
          .composite([
            { 
              input: resizedBarcodeBuffer, 
              left: finalBarcodeX, 
              top: finalBarcodeY 
            }
          ])
          .png()
          .toBuffer()

        ticketImages.push(ticketImg)

        if ((i + 1) % 10 === 0 || i === participants.length - 1) {
          console.log(`✅ Generated ${i + 1}/${participants.length} ticket images`)
        }
      } catch (err) {
        console.error('Barcode/template error for token:', participant.token, err)
        return NextResponse.json({ 
          error: 'Failed to generate barcode/ticket', 
          detail: String(err), 
          token: participant.token 
        }, { status: 500 })
      }
    }

    console.log('📄 Generating PDF...')

    // Generate PDF with grid layout
    const doc = new PDFDocument({ 
      size: [PAGE_W, PAGE_H], 
      margin: 0,
      bufferPages: true
    })
    
    const pdfChunks: Buffer[] = []
    doc.on('data', chunk => pdfChunks.push(chunk))
    doc.on('end', () => {})

    let ticketIndex = 0
    while (ticketIndex < ticketImages.length) {
      if (ticketIndex > 0) {
        doc.addPage()
      }

      // Place tickets in grid
      for (let row = 0; row < ROWS && ticketIndex < ticketImages.length; row++) {
        for (let col = 0; col < COLS && ticketIndex < ticketImages.length; col++) {
          const x = col * (TICKET_W + MARGIN_X) + MARGIN_X
          const y = row * (TICKET_H + MARGIN_Y) + MARGIN_Y

          try {
            doc.image(ticketImages[ticketIndex], x, y, { 
              width: TICKET_W, 
              height: TICKET_H 
            })
            ticketIndex++
          } catch (err) {
            console.error('Error placing ticket in PDF:', err)
          }
        }
      }
    }

    doc.end()
    await new Promise(resolve => doc.on('end', resolve))
    
    const pdfBuffer = Buffer.concat(pdfChunks)
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="offline-tickets-${params.id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (err) {
    console.error('Generate offline tickets error:', err, (err instanceof Error ? err.stack : ''))
    return NextResponse.json({ 
      error: 'Failed to generate tickets', 
      detail: String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}