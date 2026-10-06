'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAdmin(formData: FormData) {
  const password = formData.get('password') as string
  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', password, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    redirect('/admin')
  } else {
    throw new Error('Invalid Admin Password')
  }
}

export async function loginViewer(formData: FormData) {
  const password = formData.get('password') as string
  if (password === process.env.VIEWER_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('viewer_token', password, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/' })
    redirect('/memories')
  } else {
    throw new Error('Invalid Password')
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  cookieStore.delete('viewer_token')
  redirect('/')
}
