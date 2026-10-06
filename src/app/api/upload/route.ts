import { NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import path from 'path'
import { mkdir } from 'fs/promises'
import { isSupabaseConfigured, uploadImageToSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return new NextResponse('No file uploaded', { status: 400 })

    let imagePath = ''
    if (isSupabaseConfigured) {
      imagePath = await uploadImageToSupabase(file)
    } else {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), 'public/uploads')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (e) {}

      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const filepath = path.join(uploadDir, filename)
      await writeFile(filepath, buffer)
      imagePath = `/uploads/${filename}`
    }

    return NextResponse.json({ path: imagePath })
  } catch (error) {
    console.error('Error uploading file:', error)
    return new NextResponse('Error uploading file', { status: 500 })
  }
}
