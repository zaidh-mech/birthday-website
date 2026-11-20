import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase connection, uploads and the small "settings row" helpers.
 *
 * Settings (gift place, safe unlock flag, site config, …) live as rows in the
 * `letters` table with a bracketed title such as "[GIFT_PLACE]". Use
 * getSetting / upsertSetting / deleteSetting for them: they always read the
 * newest row and clean up duplicates, so a stray second row can never freeze a
 * setting again.
 */

const DEFAULT_SUPABASE_URL = 'https://mugtcupwehermhxcssji.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z3RjdXB3ZWhlcm1oeGNzc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTQxMjksImV4cCI6MjEwNjgzMDEyOX0.7IA4YtHM3iu7TT-mImKz_jFuNICVfthX985gsmDYxaA'

const LOCAL_URL_KEY = 'birthday_supabase_url'
const LOCAL_KEY_KEY = 'birthday_supabase_key'

/** The public storage bucket every uploaded photo goes into. */
export const STORAGE_BUCKET = 'memories'

/** Plain database requests give up after this long, uploads get more time. */
const REQUEST_TIMEOUT_MS = 15_000
const UPLOAD_TIMEOUT_MS = 120_000

function readLocal(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function stripSlash(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = stripSlash(process.env.NEXT_PUBLIC_SUPABASE_URL || '') || DEFAULT_SUPABASE_URL
  const envKey =
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim() ||
    DEFAULT_SUPABASE_ANON_KEY

  const localUrl = stripSlash(readLocal(LOCAL_URL_KEY) || '')
  const localKey = (readLocal(LOCAL_KEY_KEY) || '').trim()
  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  }
}

/** Saves a per-device override of the Supabase project. Empty values go back to the built-in project. */
export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window === 'undefined') return
  try {
    const cleanUrl = stripSlash(url)
    const cleanKey = key.trim()
    if (cleanUrl) window.localStorage.setItem(LOCAL_URL_KEY, cleanUrl)
    else window.localStorage.removeItem(LOCAL_URL_KEY)
    if (cleanKey) window.localStorage.setItem(LOCAL_KEY_KEY, cleanKey)
    else window.localStorage.removeItem(LOCAL_KEY_KEY)
  } catch (e) {
    console.warn('Could not store Supabase credentials on this device:', e)
  }
}

/** Forgets the per-device override so the built-in / env project is used again. */
export function clearSupabaseCredentials() {
  saveSupabaseCredentials('', '')
}

export function isValidSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

/** fetch with a timeout so a sleeping/unreachable project never leaves a page waiting forever. */
const fetchWithTimeout: typeof fetch = (input, init) => {
  const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const ms = target.includes('/storage/v1/') ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  const controller = new AbortController()
  const outer = init?.signal
  if (outer) {
    if (outer.aborted) controller.abort(outer.reason)
    else outer.addEventListener('abort', () => controller.abort(outer.reason), { once: true })
  }
  const timer = setTimeout(() => controller.abort(new DOMException('The cloud took too long to answer.', 'TimeoutError')), ms)
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

const clients = new Map<string, SupabaseClient>()

/**
 * Returns the shared Supabase client (one per project URL + key), or null when
 * no project is configured. Never throws.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials()
  if (!url || !key || !isValidSupabaseUrl(url)) return null
  const cacheKey = `${url}\n${key}`
  const existing = clients.get(cacheKey)
  if (existing) return existing
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetchWithTimeout },
    })
    clients.set(cacheKey, client)
    return client
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e)
    return null
  }
}

/** true when a cloud project is configured (it may still be unreachable). */
export function isCloudConfigured(): boolean {
  return getSupabaseClient() !== null
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

interface ErrorLike {
  message?: string
  code?: string
  name?: string
  details?: string | null
  hint?: string | null
}

/**
 * Turns a Supabase/network failure into an Error whose message makes sense in
 * the admin UI, e.g. "Couldn't save the letter: the cloud database refused …".
 */
export function cloudError(action: string, err: unknown): Error {
  const e = (err && typeof err === 'object' ? err : { message: String(err ?? '') }) as ErrorLike
  const raw = e.message || ''
  let reason: string
  if (e.name === 'AbortError' || e.name === 'TimeoutError' || /timed? ?out|took too long/i.test(raw)) {
    reason = 'the cloud took too long to answer. Check your connection and try again.'
  } else if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    reason = "the cloud database couldn't be reached. Check your internet connection (or the project may be paused in Supabase)."
  } else if (e.code === '42501' || /row-level security|permission denied/i.test(raw)) {
    reason = 'the database refused the change (permissions). Run the setup SQL from "Cloud Database" in the sidebar.'
  } else if (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|could not find the table/i.test(raw)) {
    reason = 'a table is missing in the cloud database. Run the setup SQL from "Cloud Database" in the sidebar.'
  } else if (/bucket not found/i.test(raw)) {
    reason = 'the "memories" storage bucket is missing. Run the setup SQL from "Cloud Database" in the sidebar.'
  } else if (/payload too large|exceeded the maximum allowed size|entity too large/i.test(raw)) {
    reason = 'the file is too large for the storage bucket.'
  } else {
    reason = raw || 'unknown error.'
  }
  const error = new Error(`Couldn't ${action}: ${reason}`)
  ;(error as Error & { cause?: unknown }).cause = err
  return error
}

// ---------------------------------------------------------------------------
// Settings rows (letters table, bracketed titles)
// ---------------------------------------------------------------------------

export type SettingResult = { reachable: true; content: string | null } | { reachable: false }

/**
 * Reads the newest settings row with this title.
 * `reachable: false` means the cloud is not configured or could not be read:
 * callers should fall back to their local copy. Never throws.
 */
export async function getSetting(title: string): Promise<SettingResult> {
  const supabase = getSupabaseClient()
  if (!supabase) return { reachable: false }
  try {
    const { data, error } = await supabase
      .from('letters')
      .select('content, date')
      .eq('title', title)
      .order('date', { ascending: false, nullsFirst: false })
      .limit(1)
    if (error) {
      console.warn(`Supabase read ${title} failed:`, error.message)
      return { reachable: false }
    }
    const row = (data ?? [])[0] as { content?: unknown } | undefined
    return { reachable: true, content: row && typeof row.content === 'string' ? row.content : null }
  } catch (e) {
    console.warn(`Supabase read ${title} failed:`, e)
    return { reachable: false }
  }
}

/**
 * Writes a settings row: updates the newest row with this title, deletes any
 * older duplicates, or inserts the row when it doesn't exist yet.
 * Returns false when no cloud is configured (local-only), true when saved.
 * Throws a readable Error when the cloud write fails.
 */
export async function upsertSetting(title: string, content: string, occasion = 'system'): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const action = `save ${title}`
  const now = new Date().toISOString()

  let existing: { id: string | number }[]
  try {
    const { data, error } = await supabase
      .from('letters')
      .select('id')
      .eq('title', title)
      .order('date', { ascending: false, nullsFirst: false })
    if (error) throw cloudError(action, error)
    existing = (data ?? []) as { id: string | number }[]
  } catch (e) {
    throw e instanceof Error && e.message.startsWith("Couldn't") ? e : cloudError(action, e)
  }

  try {
    if (existing.length > 0) {
      const [keep, ...dupes] = existing
      const { data, error } = await supabase.from('letters').update({ content, date: now }).eq('id', keep.id).select('id')
      if (error) throw cloudError(action, error)
      if (!data || data.length === 0) {
        throw new Error(`Couldn't ${action}: the database didn't accept the change. Run the setup SQL from "Cloud Database".`)
      }
      if (dupes.length > 0) {
        const { error: delError } = await supabase.from('letters').delete().in('id', dupes.map((d) => d.id))
        if (delError) console.warn(`Could not remove duplicate ${title} rows:`, delError.message)
      }
    } else {
      const { error } = await supabase.from('letters').insert({ title, content, occasion, date: now })
      if (error) throw cloudError(action, error)
    }
  } catch (e) {
    throw e instanceof Error && e.message.startsWith("Couldn't") ? e : cloudError(action, e)
  }
  return true
}

/** Removes every settings row with this title. Returns false when local-only. Throws on cloud failure. */
export async function deleteSetting(title: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  let result
  try {
    result = await supabase.from('letters').delete().eq('title', title)
  } catch (e) {
    throw cloudError(`clear ${title}`, e)
  }
  if (result.error) throw cloudError(`clear ${title}`, result.error)
  return true
}

/**
 * Read-only health check used by the admin "Cloud Database" panel.
 * Each entry is null when OK or a short error message.
 */
export async function checkCloudConnection(): Promise<{ ok: boolean; checks: Record<string, string | null> }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, checks: { connection: 'No Supabase project configured.' } }
  const tables = ['letters', 'memories', 'polaroids'] as const
  const checks: Record<string, string | null> = {}
  await Promise.all(
    tables.map(async (table) => {
      try {
        const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
        checks[table] = error ? cloudError('read', error).message.replace(/^Couldn't read: /, '') : null
      } catch (e) {
        checks[table] = cloudError('read', e).message.replace(/^Couldn't read: /, '')
      }
    }),
  )
  return { ok: Object.values(checks).every((v) => v === null), checks }
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image format cannot be read by the browser.'))
    }
    img.src = url
  })
}

/**
 * Shrinks a photo in the browser (keeps EXIF orientation) and re-encodes it as
 * JPEG. Returns the original file when it is already small, when the browser
 * can't decode it (e.g. HEIC outside Safari), or when shrinking doesn't help.
 */
export async function compressImage(
  file: File | Blob,
  { maxEdge = 2048, quality = 0.86, minBytes = 1_200_000 }: { maxEdge?: number; quality?: number; minBytes?: number } = {},
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file
  if (!/^image\/(jpe?g|png|webp|heic|heif|avif)$/i.test(file.type)) return file
  try {
    const img = await loadImage(file)
    const longest = Math.max(img.naturalWidth, img.naturalHeight)
    if (!longest) return file
    if (longest <= maxEdge && file.size <= minBytes) return file
    const scale = Math.min(1, maxEdge / longest)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#ffffff' // transparent PNG areas become white instead of black
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size === 0) return file
    return blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

function extensionFor(type: string, fallbackName: string): string {
  const fromType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }
  if (fromType[type]) return fromType[type]
  const ext = (fallbackName.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return ext || 'jpg'
}

/**
 * Uploads a photo to the public "memories" bucket (optionally inside a folder
 * such as "memories" or "polaroids") and returns its public URL. Large photos
 * are shrunk first. Throws a readable Error on failure.
 */
export async function uploadImageToSupabase(file: File, folder?: string): Promise<string> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error("Couldn't upload the photo: no cloud database is connected.")
  }

  const prepared = await compressImage(file)
  const contentType = prepared.type || file.type || 'image/jpeg'
  const ext = extensionFor(contentType, file.name)
  const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
  const fileName = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/${randomName}` : randomName

  let result
  try {
    const bytes = await prepared.arrayBuffer()
    result = await client.storage.from(STORAGE_BUCKET).upload(fileName, bytes, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
  } catch (e) {
    throw cloudError('upload the photo', e)
  }

  if (result.error) {
    console.error('Supabase storage upload error:', result.error)
    throw cloudError('upload the photo', result.error)
  }

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

/**
 * Path of an object inside our bucket for one of its public URLs, e.g.
 * ".../storage/v1/object/public/memories/polaroids/123.jpg" -> "polaroids/123.jpg".
 * Returns null for anything that isn't a file in this project's bucket.
 */
export function storagePathFromPublicUrl(publicUrl: string): string | null {
  if (!publicUrl) return null
  try {
    const target = new URL(publicUrl)
    const project = new URL(getSupabaseCredentials().url)
    if (target.host !== project.host) return null
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    const index = target.pathname.indexOf(marker)
    if (index === -1) return null
    const path = decodeURIComponent(target.pathname.slice(index + marker.length))
    return path && !path.endsWith('/') ? path : null
  } catch {
    return null
  }
}

/** Best-effort removal of an uploaded file by its public URL. Never throws. */
export async function removeUploadedImage(publicUrl: string): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const path = storagePathFromPublicUrl(publicUrl)
    if (!client || !path) return false
    const { error } = await client.storage.from(STORAGE_BUCKET).remove([path])
    if (error) {
      console.warn('Could not remove the old photo from storage:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('Could not remove the old photo from storage:', e)
    return false
  }
}
