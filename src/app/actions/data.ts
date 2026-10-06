'use server'

import { prisma } from '@/lib/prisma'
import { checkAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { isSupabaseConfigured, uploadImageToSupabase } from '@/lib/supabase'

export async function createLetter(formData: FormData) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
  await prisma.letter.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      occasion: formData.get('occasion') as string,
    }
  })
  revalidatePath('/letters')
  revalidatePath('/admin/letters')
}

export async function deleteLetter(id: string) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
  await prisma.letter.delete({ where: { id } })
  revalidatePath('/letters')
  revalidatePath('/admin/letters')
}

export async function createMemory(formData: FormData) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
  
  const title = formData.get('title') as string
  const caption = formData.get('caption') as string
  const file = formData.get('file') as File | null

  if (!file) throw new Error('File is required')

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

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)
    imagePath = `/uploads/${filename}`
  }

  await prisma.memory.create({
    data: {
      title,
      caption,
      imagePath,
    }
  })

  revalidatePath('/memories')
  revalidatePath('/admin/memories')
}

export async function deleteMemory(id: string) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
  await prisma.memory.delete({ where: { id } })
  revalidatePath('/memories')
  revalidatePath('/admin/memories')
}
