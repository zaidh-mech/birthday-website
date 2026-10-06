import { cookies } from 'next/headers'

export async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')
  return token?.value === process.env.ADMIN_PASSWORD
}

export async function checkViewer() {
  const cookieStore = await cookies()
  // Admin can view anything
  if (cookieStore.get('admin_token')?.value === process.env.ADMIN_PASSWORD) return true
  return cookieStore.get('viewer_token')?.value === process.env.VIEWER_PASSWORD
}
