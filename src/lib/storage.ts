import { initialLetters, initialMemories, Letter, Memory } from '@/data/initialData'
import {
  cloudError,
  compressImage,
  deleteSetting,
  getSetting,
  getSupabaseClient,
  removeUploadedImage,
  uploadImageToSupabase,
  upsertSetting,
} from './supabase'
import { places as defaultPlaces, Place } from '@/data/places'

/**
 * Data layer for letters, memories, polaroids and the small settings rows.
 *
 * Rules of thumb:
 * - Reads never throw. They use the cloud when it answers (an empty answer is
 *   a real answer) and fall back to the copy cached on this device otherwise.
 * - Admin writes throw a readable Error when the cloud is connected but the
 *   write fails, so the admin UI can say so instead of pretending it worked.
 */

export { getSetting, upsertSetting, deleteSetting } from './supabase'

const LETTERS_KEY = 'birthday_letters_data'
const MEMORIES_KEY = 'birthday_memories_data'
const VIEWER_PASS_KEY = 'birthday_viewer_passcode'
const ADMIN_PASS_KEY = 'birthday_admin_passcode'
const VIEWER_AUTH_SESSION_KEY = 'birthday_viewer_session'
const ADMIN_AUTH_SESSION_KEY = 'birthday_admin_session'

const DEFAULT_VIEWER_PASS = 'happy_birthday'
const DEFAULT_ADMIN_PASS = 'admin_birthday'

type Row = Record<string, unknown>
type CloudResponse<T> = { data: T | null; error: { message: string; code?: string } | null }

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isBrowser = () => typeof window !== 'undefined'

function readString(key: string): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeString(key: string, value: string): boolean {
  if (!isBrowser()) return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (e) {
    console.warn(`Couldn't save "${key}" on this device (storage full or blocked):`, e)
    return false
  }
}

function removeKey(key: string) {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

function readJson<T>(key: string): T | null {
  const raw = readString(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  return writeString(key, JSON.stringify(value))
}

/** The cached list for a key, or [] (no placeholder seeding). */
function readList<T>(key: string): T[] {
  const list = readJson<unknown>(key)
  return Array.isArray(list) ? (list as T[]) : []
}

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v))

/** IDs made on this device only ("letter-123", "memory-123") never exist in the cloud. */
const isLocalOnlyId = (id: string) => /^(letter|memory)-/.test(id)

/** Runs a Supabase query and turns `{ error }` results and network failures into readable Errors. */
async function cloud<T>(action: string, op: () => PromiseLike<CloudResponse<T>>): Promise<T | null> {
  let result: CloudResponse<T>
  try {
    result = await op()
  } catch (e) {
    throw cloudError(action, e)
  }
  if (result.error) throw cloudError(action, result.error)
  return result.data
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file.'))
    reader.readAsDataURL(blob)
  })
}

/** Small JPEG data URL for keeping a photo on this device when no cloud is connected. */
async function fileToLocalDataUrl(file: File): Promise<string> {
  const small = await compressImage(file, { maxEdge: 1024, quality: 0.75, minBytes: 0 })
  if (small.size > 900_000) {
    throw new Error('That photo is too large to keep on this device without the cloud database. Connect the cloud or pick a smaller photo.')
  }
  return blobToDataUrl(small)
}

/** Drops temporary preview URLs that must never be saved. */
function cleanImagePath(path: string | undefined | null): string {
  const p = (path || '').trim()
  return p.startsWith('blob:') ? '' : p
}

function rowToLetter(r: Row): Letter {
  return {
    id: str(r.id),
    title: str(r.title),
    content: str(r.content),
    occasion: str(r.occasion),
    date: str(r.date) || str(r.created_at) || new Date().toISOString(),
  }
}

function rowToMemory(r: Row): Memory {
  return {
    id: str(r.id),
    title: str(r.title),
    caption: str(r.caption),
    imagePath: str(r.image_path) || str(r.imagePath),
    date: str(r.date) || str(r.created_at) || new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Letters
// ---------------------------------------------------------------------------

export function getLocalLetters(): Letter[] {
  if (!isBrowser()) return initialLetters
  const stored = readJson<unknown>(LETTERS_KEY)
  if (Array.isArray(stored)) return stored as Letter[]
  writeJson(LETTERS_KEY, initialLetters)
  return initialLetters
}

/** Letters for merging after a write: placeholders only when no cloud is connected. */
function lettersForMerge(cloudConnected: boolean): Letter[] {
  return cloudConnected ? readList<Letter>(LETTERS_KEY) : getLocalLetters()
}

/**
 * All letter rows, newest first — including settings rows whose titles start
 * with "[" (filter those out for display).
 */
export async function fetchLetters(): Promise<Letter[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase.from('letters').select('*').order('date', { ascending: false, nullsFirst: false })
      if (error) throw error
      const letters = ((data ?? []) as Row[]).map(rowToLetter)
      writeJson(LETTERS_KEY, letters)
      return letters
    } catch (e) {
      console.warn('Supabase fetch letters failed, using the copy on this device:', e)
    }
  }
  return getLocalLetters()
}

export async function createLetter(letter: { title: string; content: string; occasion: string; date?: string }): Promise<Letter> {
  const supabase = getSupabaseClient()
  const now = letter.date || new Date().toISOString()

  let created: Letter = {
    id: `letter-${Date.now()}`,
    title: letter.title,
    content: letter.content,
    occasion: letter.occasion,
    date: now,
  }

  if (supabase) {
    const row = await cloud<Row>('save the letter', () =>
      supabase
        .from('letters')
        .insert({ title: letter.title, content: letter.content, occasion: letter.occasion, date: now })
        .select()
        .single(),
    )
    if (row) created = rowToLetter(row)
  }

  const saved = writeJson(LETTERS_KEY, [created, ...lettersForMerge(Boolean(supabase)).filter((l) => l.id !== created.id)])
  if (!supabase && !saved) throw new Error("Couldn't save the letter: this device's storage is full.")
  return created
}

export async function updateLetter(id: string, updates: { title: string; content: string; occasion: string }): Promise<Letter> {
  const supabase = getSupabaseClient()
  let updated: Letter | null = null

  if (supabase && !isLocalOnlyId(id)) {
    const rows = await cloud<Row[]>('update the letter', () =>
      supabase
        .from('letters')
        .update({ title: updates.title, content: updates.content, occasion: updates.occasion })
        .eq('id', id)
        .select(),
    )
    if (!rows || rows.length === 0) {
      throw new Error("Couldn't update the letter: it wasn't found in the cloud (maybe it was deleted on another device). Refresh the page and try again.")
    }
    updated = rowToLetter(rows[0])
  }

  const local = lettersForMerge(Boolean(supabase))
  const index = local.findIndex((l) => l.id === id)
  if (!updated) {
    updated = index !== -1 ? { ...local[index], ...updates } : { id, date: new Date().toISOString(), ...updates }
  }
  if (index !== -1) local[index] = updated
  else local.unshift(updated)
  writeJson(LETTERS_KEY, local)

  return updated
}

export async function removeLetter(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase && !isLocalOnlyId(id)) {
    await cloud('delete the letter', () => supabase.from('letters').delete().eq('id', id))
  }
  writeJson(LETTERS_KEY, lettersForMerge(Boolean(supabase)).filter((l) => l.id !== id))
}

// ---------------------------------------------------------------------------
// Memories
// ---------------------------------------------------------------------------

export function getLocalMemories(): Memory[] {
  if (!isBrowser()) return initialMemories
  const stored = readJson<unknown>(MEMORIES_KEY)
  if (Array.isArray(stored)) return stored as Memory[]
  writeJson(MEMORIES_KEY, initialMemories)
  return initialMemories
}

function memoriesForMerge(cloudConnected: boolean): Memory[] {
  return cloudConnected ? readList<Memory>(MEMORIES_KEY) : getLocalMemories()
}

const isMemoryPhoto = (path: string) =>
  path.includes('/memories/memories/') ||
  /1791(?:34|35|80)/.test(path)

const isPolaroidPhoto = (path: string) =>
  path.includes('/polaroids/') ||
  (path.includes('/memories/') && !isMemoryPhoto(path))

export async function fetchMemories(): Promise<Memory[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.from('memories').select('*').order('date', { ascending: false, nullsFirst: false })
      if (error) throw error

      let cloudMemories = ((data ?? []) as Row[])
        .filter((item) => !isPolaroidPhoto(str(item.image_path)))
        .map(rowToMemory)

      const hasCustom = cloudMemories.some((m) => !m.imagePath.includes('images.unsplash.com'))
      if (hasCustom) {
        cloudMemories = cloudMemories.filter((m) => !m.imagePath.includes('images.unsplash.com'))
      }

      writeJson(MEMORIES_KEY, cloudMemories)
      // The cloud answered: an empty list is the real answer, not a reason to show placeholders.
      return cloudMemories
    } catch (e) {
      console.warn('Supabase fetch memories failed, using the copy on this device:', e)
    }
  }

  let localMemories = readList<Memory>(MEMORIES_KEY).filter((m) => m && typeof m.imagePath === 'string')
  localMemories = localMemories.filter((m) => !isPolaroidPhoto(m.imagePath))
  let result = localMemories.length > 0 ? localMemories : initialMemories
  const hasCustom = result.some((m) => !m.imagePath.includes('images.unsplash.com'))
  if (hasCustom) {
    result = result.filter((m) => !m.imagePath.includes('images.unsplash.com'))
  }

  return result.length > 0 ? result : initialMemories
}

export async function createMemory(payload: {
  title: string
  caption: string
  imagePath?: string
  file?: File | null
}): Promise<Memory> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()
  let imagePath = cleanImagePath(payload.imagePath)
  let uploaded = false

  if (payload.file) {
    if (supabase) {
      imagePath = await uploadImageToSupabase(payload.file, 'memories')
      uploaded = true
    } else {
      imagePath = await fileToLocalDataUrl(payload.file)
    }
  }

  if (!imagePath) throw new Error('Please choose a photo (or paste a photo link) first.')
  if (supabase && imagePath.startsWith('data:')) {
    throw new Error('Please choose the photo file again so it can be uploaded to the cloud.')
  }

  let created: Memory = {
    id: `memory-${Date.now()}`,
    title: payload.title,
    caption: payload.caption,
    imagePath,
    date: now,
  }

  if (supabase) {
    try {
      const row = await cloud<Row>('save the memory', () =>
        supabase
          .from('memories')
          .insert({ title: payload.title, caption: payload.caption, image_path: imagePath, date: now })
          .select()
          .single(),
      )
      if (row) created = rowToMemory(row)
    } catch (e) {
      if (uploaded) void removeUploadedImage(imagePath)
      throw e
    }
  }

  const saved = writeJson(MEMORIES_KEY, [created, ...memoriesForMerge(Boolean(supabase)).filter((m) => m.id !== created.id)])
  if (!supabase && !saved) throw new Error("Couldn't save the memory: this device's storage is full.")
  return created
}

export async function removeMemory(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase && !isLocalOnlyId(id)) {
    await cloud('delete the memory', () => supabase.from('memories').delete().eq('id', id))
  }
  writeJson(MEMORIES_KEY, memoriesForMerge(Boolean(supabase)).filter((m) => m.id !== id))
}

export async function updateMemory(
  id: string,
  updates: { title: string; caption: string; imagePath?: string; file?: File | null },
): Promise<Memory> {
  const supabase = getSupabaseClient()
  let imagePath = cleanImagePath(updates.imagePath)

  if (updates.file) {
    imagePath = supabase ? await uploadImageToSupabase(updates.file, 'memories') : await fileToLocalDataUrl(updates.file)
  }
  // Never push an inline (data:) image to the cloud; keep the stored one instead.
  if (supabase && imagePath.startsWith('data:')) imagePath = ''

  let updated: Memory | null = null

  if (supabase && !isLocalOnlyId(id)) {
    const patch: Row = { title: updates.title, caption: updates.caption }
    if (imagePath) patch.image_path = imagePath
    const rows = await cloud<Row[]>('update the memory', () => supabase.from('memories').update(patch).eq('id', id).select())
    if (!rows || rows.length === 0) {
      throw new Error("Couldn't update the memory: it wasn't found in the cloud (maybe it was deleted on another device). Refresh the page and try again.")
    }
    updated = rowToMemory(rows[0])
  }

  const local = memoriesForMerge(Boolean(supabase))
  const index = local.findIndex((m) => m.id === id)
  const base = index !== -1 ? local[index] : null
  if (!updated) {
    // Not in the cloud and/or not cached here: build the result from what we know.
    updated = {
      id,
      date: base?.date ?? new Date().toISOString(),
      title: updates.title,
      caption: updates.caption,
      imagePath: imagePath || base?.imagePath || '',
    }
  }
  if (index !== -1) local[index] = updated
  else local.unshift(updated)
  const saved = writeJson(MEMORIES_KEY, local)
  if (!supabase && !saved) throw new Error("Couldn't update the memory: this device's storage is full.")

  return updated
}

/**
 * Saves a new album order (first id = shown first) by re-dating the memories.
 * All cloud updates run in parallel; throws if any of them failed.
 */
export async function reorderMemories(orderedIds: string[]): Promise<Memory[]> {
  const supabase = getSupabaseClient()
  const now = Date.now()
  const dates = new Map(orderedIds.map((id, i) => [id, new Date(now - i * 10000).toISOString()]))

  if (supabase) {
    const cloudIds = orderedIds.filter((id) => !isLocalOnlyId(id))
    const failures = (
      await Promise.all(
        cloudIds.map(async (id) => {
          try {
            await cloud('save the new order', () => supabase.from('memories').update({ date: dates.get(id) }).eq('id', id))
            return null
          } catch (e) {
            return e instanceof Error ? e : new Error(String(e))
          }
        }),
      )
    ).filter((e): e is Error => e !== null)

    if (failures.length > 0) {
      throw new Error(
        failures.length === cloudIds.length
          ? failures[0].message
          : `${failures[0].message} (${failures.length} of ${cloudIds.length} photos weren't moved — refresh to see the saved order.)`,
      )
    }
  }

  const local = memoriesForMerge(Boolean(supabase))
  const byId = new Map(local.map((m) => [m.id, m]))
  const updatedMemories: Memory[] = []
  for (const id of orderedIds) {
    const memory = byId.get(id)
    if (memory) updatedMemories.push({ ...memory, date: dates.get(id) as string })
  }
  for (const m of local) {
    if (!dates.has(m.id)) updatedMemories.push(m)
  }
  writeJson(MEMORIES_KEY, updatedMemories)

  return updatedMemories
}

// ---------------------------------------------------------------------------
// Passcodes & sessions
// ---------------------------------------------------------------------------

function configuredPasscodes(type: 'viewer' | 'admin'): string[] {
  const envPass =
    type === 'admin'
      ? process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
      : process.env.NEXT_PUBLIC_VIEWER_PASSWORD || process.env.VIEWER_PASSWORD
  const custom = readString(type === 'viewer' ? VIEWER_PASS_KEY : ADMIN_PASS_KEY)
  return [envPass, custom].map((p) => (p || '').trim()).filter(Boolean)
}

/**
 * Checks a passcode. The env passcode (NEXT_PUBLIC_ADMIN_PASSWORD /
 * NEXT_PUBLIC_VIEWER_PASSWORD) and a custom passcode set on this device are
 * accepted; the built-in default only works while neither is configured.
 */
export function verifyPasscode(type: 'viewer' | 'admin', input: string): boolean {
  if (!isBrowser()) return false
  const trimmed = input.trim()
  if (!trimmed) return false
  const configured = configuredPasscodes(type)
  const accepted = configured.length > 0 ? configured : [type === 'viewer' ? DEFAULT_VIEWER_PASS : DEFAULT_ADMIN_PASS]
  return accepted.includes(trimmed)
}

export function setCustomPasscode(type: 'viewer' | 'admin', newCode: string): void {
  const key = type === 'viewer' ? VIEWER_PASS_KEY : ADMIN_PASS_KEY
  const code = newCode.trim()
  if (code) writeString(key, code)
  else removeKey(key)
}

export function isSessionAuthorized(type: 'viewer' | 'admin'): boolean {
  if (!isBrowser()) return false
  const sessionKey = type === 'viewer' ? VIEWER_AUTH_SESSION_KEY : ADMIN_AUTH_SESSION_KEY
  try {
    return window.sessionStorage.getItem(sessionKey) === 'true'
  } catch {
    return false
  }
}

export function setSessionAuthorized(type: 'viewer' | 'admin', auth: boolean): void {
  if (!isBrowser()) return
  const sessionKey = type === 'viewer' ? VIEWER_AUTH_SESSION_KEY : ADMIN_AUTH_SESSION_KEY
  try {
    if (auth) window.sessionStorage.setItem(sessionKey, 'true')
    else window.sessionStorage.removeItem(sessionKey)
  } catch {
    /* storage blocked: the session simply won't be remembered */
  }
}

/** Backup of what is cached on this device (letters + memories). See exportBackup for the full cloud copy. */
export function exportAllData(): string {
  const data = {
    letters: getLocalLetters(),
    memories: getLocalMemories(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

/** Full backup straight from the cloud (falls back to this device's copies). */
export async function exportBackup(extra: Record<string, unknown> = {}): Promise<string> {
  const [letters, memories, polaroids, places, giftPlace, rsvp, safeUnlocked] = await Promise.all([
    fetchLetters(),
    fetchMemories(),
    fetchPolaroids(),
    fetchPlaces(),
    fetchSelectedGiftPlace(),
    fetchDateAcceptance(),
    fetchSafeUnlockedOverride(),
  ])
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      letters,
      memories,
      polaroids,
      customPlaces: places.filter((p) => p.isCustom),
      selectedGiftPlace: giftPlace,
      dateRsvp: rsvp,
      safeUnlocked,
      ...extra,
    },
    null,
    2,
  )
}

// ---------------------------------------------------------------------------
// Love Letter Safe
// ---------------------------------------------------------------------------

export const SAFE_UNLOCKED_KEY = 'birthday_safe_unlocked_override'
const SAFE_UNLOCKED_TITLE = '[SAFE_UNLOCKED]'
export const LOCK_LETTER_TITLE = '[LOCK_LETTER]'

export function getSafeUnlockedOverride(): boolean {
  return readString(SAFE_UNLOCKED_KEY) === 'true'
}

export function setSafeUnlockedOverride(unlocked: boolean) {
  writeString(SAFE_UNLOCKED_KEY, unlocked ? 'true' : 'false')
}

export async function fetchSafeUnlockedOverride(): Promise<boolean> {
  const result = await getSetting(SAFE_UNLOCKED_TITLE)
  if (result.reachable) {
    const isUnlocked = result.content === 'true'
    setSafeUnlockedOverride(isUnlocked)
    return isUnlocked
  }
  return getSafeUnlockedOverride()
}

export async function saveSafeUnlockedOverride(unlocked: boolean): Promise<void> {
  await upsertSetting(SAFE_UNLOCKED_TITLE, unlocked ? 'true' : 'false', 'system')
  setSafeUnlockedOverride(unlocked)
}

/** The fill-in-the-blanks letter that guards the Memories page, or null when none was saved. */
export async function fetchLockLetter(): Promise<string | null> {
  const result = await getSetting(LOCK_LETTER_TITLE)
  if (result.reachable) return result.content
  return getLocalLetters().find((l) => l.title === LOCK_LETTER_TITLE)?.content ?? null
}

export async function saveLockLetter(text: string): Promise<void> {
  const savedToCloud = await upsertSetting(LOCK_LETTER_TITLE, text, 'lock')
  if (savedToCloud) {
    // Refresh the cached letters so the Memories page sees the new text offline too.
    await fetchLetters()
    return
  }
  const local = getLocalLetters().filter((l) => l.title !== LOCK_LETTER_TITLE)
  const saved = writeJson(LETTERS_KEY, [
    { id: `letter-lock-${Date.now()}`, title: LOCK_LETTER_TITLE, content: text, occasion: 'lock', date: new Date().toISOString() },
    ...local,
  ])
  if (!saved) throw new Error("Couldn't save the letter: this device's storage is full.")
}

// ---------------------------------------------------------------------------
// Polaroids
// ---------------------------------------------------------------------------

export type Polaroid = {
  id: string
  imagePath: string
  caption: string
  createdAt: number
}

const POLAROIDS_KEY = 'birthday_polaroids_data'

function rowToPolaroid(r: Row): Polaroid {
  const created = new Date(str(r.created_at)).getTime()
  return {
    id: str(r.id),
    imagePath: str(r.image_url),
    caption: str(r.caption),
    createdAt: Number.isFinite(created) ? created : Date.now(),
  }
}

function readLocalPolaroids(): Polaroid[] {
  return readList<Polaroid>(POLAROIDS_KEY).filter((p) => p && typeof p.imagePath === 'string' && !isMemoryPhoto(p.imagePath))
}

export async function fetchPolaroids(): Promise<Polaroid[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.from('polaroids').select('*').order('created_at', { ascending: false })
      if (error) throw error
      const polaroids = ((data ?? []) as Row[])
        .filter((row) => !isMemoryPhoto(str(row.image_url)))
        .map(rowToPolaroid)
      writeJson(POLAROIDS_KEY, polaroids)
      return polaroids
    } catch (e) {
      console.warn('Supabase fetch polaroids failed, using the copy on this device:', e)
    }
  }

  return readLocalPolaroids()
}

export async function createPolaroid(data: Omit<Polaroid, 'id' | 'createdAt'>, file?: File): Promise<Polaroid> {
  const supabase = getSupabaseClient()
  let imagePath = cleanImagePath(data.imagePath)
  let uploaded = false

  if (file) {
    if (supabase) {
      imagePath = await uploadImageToSupabase(file, 'polaroids')
      uploaded = true
    } else {
      imagePath = await fileToLocalDataUrl(file)
    }
  }
  if (!imagePath) throw new Error('Please choose a photo first.')
  if (supabase && imagePath.startsWith('data:')) {
    throw new Error('Please choose the photo file again so it can be uploaded to the cloud.')
  }

  let created: Polaroid = {
    id: Math.random().toString(36).substring(2, 9),
    imagePath,
    caption: data.caption,
    createdAt: Date.now(),
  }

  if (supabase) {
    try {
      const row = await cloud<Row>('save the polaroid', () =>
        supabase
          .from('polaroids')
          .insert([{ id: created.id, image_url: imagePath, caption: created.caption, created_at: new Date(created.createdAt).toISOString() }])
          .select()
          .single(),
      )
      if (row) created = rowToPolaroid(row)
    } catch (e) {
      if (uploaded) void removeUploadedImage(imagePath)
      throw e
    }
  }

  const saved = writeJson(POLAROIDS_KEY, [created, ...readLocalPolaroids().filter((p) => p.id !== created.id)])
  if (!supabase && !saved) throw new Error("Couldn't save the polaroid: this device's storage is full.")
  return created
}

export async function updatePolaroid(
  id: string,
  updates: { caption?: string; imagePath?: string },
  file?: File | null,
): Promise<Polaroid> {
  const supabase = getSupabaseClient()
  let imagePath = cleanImagePath(updates.imagePath)

  if (file) {
    imagePath = supabase ? await uploadImageToSupabase(file, 'polaroids') : await fileToLocalDataUrl(file)
  }
  if (supabase && imagePath.startsWith('data:')) imagePath = ''

  let updated: Polaroid | null = null

  if (supabase) {
    const patch: Row = {}
    if (updates.caption !== undefined) patch.caption = updates.caption
    if (imagePath) patch.image_url = imagePath
    if (Object.keys(patch).length > 0) {
      const rows = await cloud<Row[]>('update the polaroid', () => supabase.from('polaroids').update(patch).eq('id', id).select())
      if (!rows || rows.length === 0) {
        throw new Error("Couldn't update the polaroid: it wasn't found in the cloud (maybe it was deleted on another device). Refresh the page and try again.")
      }
      updated = rowToPolaroid(rows[0])
    }
  }

  const local = readLocalPolaroids()
  const index = local.findIndex((p) => p.id === id)
  if (!updated) {
    const base = index !== -1 ? local[index] : null
    updated = {
      id,
      imagePath: imagePath || base?.imagePath || '',
      caption: updates.caption !== undefined ? updates.caption : base?.caption ?? '',
      createdAt: base?.createdAt ?? Date.now(),
    }
  }
  if (index !== -1) local[index] = updated
  else local.unshift(updated)
  const saved = writeJson(POLAROIDS_KEY, local)
  if (!supabase && !saved) throw new Error("Couldn't update the polaroid: this device's storage is full.")

  return updated
}

export async function removePolaroid(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    // Remember the photo so it can be cleaned out of storage once the row is gone.
    let imageUrl = ''
    try {
      const { data } = await supabase.from('polaroids').select('image_url').eq('id', id).limit(1)
      imageUrl = str(((data ?? []) as Row[])[0]?.image_url)
    } catch {
      /* cleanup is optional */
    }

    await cloud('delete the polaroid', () => supabase.from('polaroids').delete().eq('id', id))

    // Only files that belong to polaroids (never memory photos) are removed. Best effort, never throws.
    if (imageUrl && !isMemoryPhoto(imageUrl)) {
      await removeUploadedImage(imageUrl)
    }
  }

  writeJson(POLAROIDS_KEY, readLocalPolaroids().filter((p) => p.id !== id))
}

// ---------------------------------------------------------------------------
// Gift: featured place, custom places, RSVP
// ---------------------------------------------------------------------------

export const DEFAULT_GIFT_PLACE_ID = 'churros'
const GIFT_PLACE_KEY = 'birthday_selected_gift_place'
const GIFT_PLACE_TITLE = '[GIFT_PLACE]'

export async function fetchSelectedGiftPlace(): Promise<string> {
  const result = await getSetting(GIFT_PLACE_TITLE)
  if (result.reachable) {
    const id = (result.content || '').trim() || DEFAULT_GIFT_PLACE_ID
    writeString(GIFT_PLACE_KEY, id)
    return id
  }
  return readString(GIFT_PLACE_KEY) || DEFAULT_GIFT_PLACE_ID
}

export async function saveSelectedGiftPlace(placeId: string): Promise<void> {
  await upsertSetting(GIFT_PLACE_TITLE, placeId, 'gift')
  writeString(GIFT_PLACE_KEY, placeId)
}

const CUSTOM_PLACES_KEY = 'birthday_custom_places_data'
const CUSTOM_PLACES_TITLE = '[CUSTOM_PLACES]'
const DEFAULT_PLACE_IDS = new Set(defaultPlaces.map((p) => p.id))

function parsePlaces(raw: string | null): Place[] | null {
  if (!raw) return null
  try {
    const list: unknown = JSON.parse(raw)
    if (!Array.isArray(list)) return null
    return list
      .filter((p): p is Place => Boolean(p && typeof p === 'object' && typeof (p as Place).id === 'string' && typeof (p as Place).name === 'string'))
      .filter((p) => !DEFAULT_PLACE_IDS.has(p.id))
      .map((p) => ({ ...p, isCustom: true }))
  } catch {
    return null
  }
}

/** Custom places for a write: must come from the cloud when it is connected, so stale copies never overwrite it. */
async function readCustomPlacesForWrite(): Promise<Place[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return parsePlaces(readString(CUSTOM_PLACES_KEY)) ?? []
  const result = await getSetting(CUSTOM_PLACES_TITLE)
  if (!result.reachable) {
    throw new Error("Couldn't save the places: the cloud database couldn't be reached. Check your connection and try again.")
  }
  return parsePlaces(result.content) ?? []
}

export async function fetchPlaces(): Promise<Place[]> {
  let custom: Place[]
  const result = await getSetting(CUSTOM_PLACES_TITLE)
  if (result.reachable) {
    custom = parsePlaces(result.content) ?? []
    writeJson(CUSTOM_PLACES_KEY, custom)
  } else {
    custom = parsePlaces(readString(CUSTOM_PLACES_KEY)) ?? []
  }
  return [...defaultPlaces, ...custom]
}

export async function saveCustomPlace(newPlace: Place): Promise<Place[]> {
  const current = await readCustomPlacesForWrite()
  const updatedCustom = [...current.filter((p) => p.id !== newPlace.id), { ...newPlace, isCustom: true }]
  const serialized = JSON.stringify(updatedCustom)
  await upsertSetting(CUSTOM_PLACES_TITLE, serialized, 'places')
  writeString(CUSTOM_PLACES_KEY, serialized)
  return [...defaultPlaces, ...updatedCustom]
}

export async function removeCustomPlace(placeId: string): Promise<Place[]> {
  const current = await readCustomPlacesForWrite()
  const customOnly = current.filter((p) => p.id !== placeId)
  const serialized = JSON.stringify(customOnly)
  await upsertSetting(CUSTOM_PLACES_TITLE, serialized, 'places')
  writeString(CUSTOM_PLACES_KEY, serialized)
  return [...defaultPlaces, ...customOnly]
}

export interface DateRSVP {
  placeId: string
  placeName: string
  placeSubtitle: string
  date: string
  formattedDate: string
  dayName: string
  time: string
  format: string
  price: string
  color: string
  acceptedAt: string
  customMessage?: string
}

const DATE_RSVP_KEY = 'birthday_date_rsvp_data'
const DATE_RSVP_TITLE = '[DATE_RSVP]'

function parseRsvp(raw: string | null): DateRSVP | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object' && typeof (value as DateRSVP).placeName === 'string' ? (value as DateRSVP) : null
  } catch {
    return null
  }
}

/**
 * Records her answer. Called from the public gift page, so it never throws:
 * the answer is always kept on her device and resolves to true once it is
 * also in the cloud.
 */
export async function recordDateAcceptance(rsvp: DateRSVP): Promise<boolean> {
  const serialized = JSON.stringify(rsvp)
  writeString(DATE_RSVP_KEY, serialized)
  try {
    return await upsertSetting(DATE_RSVP_TITLE, serialized, 'rsvp')
  } catch (e) {
    console.warn('Supabase record RSVP failed:', e)
    return false
  }
}

export async function fetchDateAcceptance(): Promise<DateRSVP | null> {
  const result = await getSetting(DATE_RSVP_TITLE)
  if (result.reachable) return parseRsvp(result.content)
  return parseRsvp(readString(DATE_RSVP_KEY))
}

export async function clearDateAcceptance(): Promise<void> {
  await deleteSetting(DATE_RSVP_TITLE)
  removeKey(DATE_RSVP_KEY)
}
