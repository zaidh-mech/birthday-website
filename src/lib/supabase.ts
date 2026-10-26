import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://mugtcupwehermhxcssji.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RjdXB3ZWhlcm1oeGNzc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTQxMjksImV4cCI6MjEwNjgzMDEyOX0.7IA4YtHM3iu7TT-mImKz_jFuNICVfthX985gsmDYxaA'

export function getSupabaseCredentials() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

  if (typeof window !== 'undefined') {
    const localUrl = localStorage.getItem('birthday_supabase_url')
    const localKey = localStorage.getItem('birthday_supabase_key')
    return {
      url: localUrl || envUrl || DEFAULT_SUPABASE_URL,
      key: localKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
    }
  }

  return {
    url: envUrl,
    key: envKey,
  }
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('birthday_supabase_url', url.trim())
    localStorage.setItem('birthday_supabase_key', key.trim())
  }
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseCredentials()
  if (url && key) {
    try {
      return createClient(url, key)
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e)
      return null
    }
  }
  return null
}

export async function uploadImageToSupabase(file: File): Promise<string> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase client is not connected')
  }

  const fileExt = file.name.split('.').pop() || 'jpg'
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '')
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt || 'jpg'}`
  const bytes = await file.arrayBuffer()

  const { error } = await client.storage
    .from('memories')
    .upload(fileName, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  const { data } = client.storage.from('memories').getPublicUrl(fileName)
  return data.publicUrl
}
