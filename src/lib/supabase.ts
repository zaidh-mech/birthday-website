import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null

export async function uploadImageToSupabase(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase is not configured')
  }

  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabase.storage
    .from('memories')
    .upload(fileName, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  const { data } = supabase.storage.from('memories').getPublicUrl(fileName)
  return data.publicUrl
}
