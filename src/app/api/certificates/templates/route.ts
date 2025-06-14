import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, access } from 'fs/promises'
import path from 'path'
import db from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('certificateTemplate') as File | null
    if (!file || file.size === 0) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Invalid file type' }, { status: 400 })
    }
    // Pastikan folder certificates ada
    const certDir = path.join(process.cwd(), 'public', 'certificates')
    try { await access(certDir) } catch { await mkdir(certDir, { recursive: true }) }
    // Nama file unik
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `certificate-template-${timestamp}${ext}`
    const filepath = path.join(certDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer, { mode: 0o644 })
    const templatePath = `/certificates/${filename}`
    // Simpan ke DB
    await db.execute('INSERT INTO certificate_templates (template_path, template_fields) VALUES (?, ?)', [templatePath, JSON.stringify({ name_position: { x: 0.5, y: 0.85 } })])
    return NextResponse.json({ message: 'Template uploaded', path: templatePath })
  } catch (error) {
    console.error('Error uploading certificate template:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 