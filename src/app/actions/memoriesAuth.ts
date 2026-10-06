'use server'

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function getMemoriesWithPasscode(passcode: string) {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('admin_token')?.value === process.env.ADMIN_PASSWORD

  if (isAdmin || passcode === process.env.VIEWER_PASSWORD) {
    const memories = await prisma.memory.findMany({ orderBy: { date: 'desc' } })
    return { success: true, memories }
  }
  
  return { success: false, memories: null }
}

export async function checkAdminStatus() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_token')?.value === process.env.ADMIN_PASSWORD
}
