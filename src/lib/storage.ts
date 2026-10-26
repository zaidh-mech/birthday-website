import { initialLetters, initialMemories, Letter, Memory } from '@/data/initialData'
import { getSupabaseClient, uploadImageToSupabase } from './supabase'
import { places as defaultPlaces, Place } from '@/data/places'

const LETTERS_KEY = 'birthday_letters_data'
const MEMORIES_KEY = 'birthday_memories_data'
const VIEWER_PASS_KEY = 'birthday_viewer_passcode'
const ADMIN_PASS_KEY = 'birthday_admin_passcode'
const VIEWER_AUTH_SESSION_KEY = 'birthday_viewer_session'
const ADMIN_AUTH_SESSION_KEY = 'birthday_admin_session'

const DEFAULT_VIEWER_PASS = 'happy_birthday'
const DEFAULT_ADMIN_PASS = 'admin_birthday'

export function getLocalLetters(): Letter[] {
  if (typeof window === 'undefined') return initialLetters
  const stored = localStorage.getItem(LETTERS_KEY)
  if (!stored) {
    localStorage.setItem(LETTERS_KEY, JSON.stringify(initialLetters))
    return initialLetters
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialLetters
  }
}

export async function fetchLetters(): Promise<Letter[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .order('date', { ascending: false })

      if (!error && data && data.length > 0) {
        const letters: Letter[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          content: item.content,
          occasion: item.occasion,
          date: item.date || item.created_at,
        }))
        if (typeof window !== 'undefined') {
          localStorage.setItem(LETTERS_KEY, JSON.stringify(letters))
        }
        return letters
      }
    } catch (e) {
      console.warn('Supabase fetch letters failed, using local storage:', e)
    }
  }
  return getLocalLetters()
}

export async function createLetter(letter: { title: string; content: string; occasion: string; date?: string }): Promise<Letter> {
  const supabase = getSupabaseClient()
  const now = letter.date || new Date().toISOString()

  let createdId = `letter-${Date.now()}`

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .insert({
          title: letter.title,
          content: letter.content,
          occasion: letter.occasion,
          date: now,
        })
        .select()
        .single()

      if (!error && data) {
        createdId = String(data.id)
      }
    } catch (e) {
      console.warn('Supabase insert letter failed:', e)
    }
  }

  const newLetter: Letter = {
    id: createdId,
    title: letter.title,
    content: letter.content,
    occasion: letter.occasion,
    date: now,
  }

  if (typeof window !== 'undefined') {
    const local = getLocalLetters()
    localStorage.setItem(LETTERS_KEY, JSON.stringify([newLetter, ...local]))
  }

  return newLetter
}

export async function updateLetter(id: string, updates: { title: string; content: string; occasion: string }): Promise<Letter> {
  const supabase = getSupabaseClient()
  
  if (supabase) {
    try {
      await supabase
        .from('letters')
        .update({
          title: updates.title,
          content: updates.content,
          occasion: updates.occasion,
        })
        .eq('id', id)
    } catch (e) {
      console.warn('Supabase update letter failed:', e)
    }
  }

  const local = getLocalLetters()
  const letterIndex = local.findIndex((l) => l.id === id)
  let updatedLetter: Letter

  if (letterIndex !== -1) {
    updatedLetter = {
      ...local[letterIndex],
      ...updates,
    }
    local[letterIndex] = updatedLetter
    if (typeof window !== 'undefined') {
      localStorage.setItem(LETTERS_KEY, JSON.stringify(local))
    }
  } else {
    // Fallback if not found locally
    updatedLetter = { id, date: new Date().toISOString(), ...updates }
  }

  return updatedLetter
}

export async function removeLetter(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from('letters').delete().eq('id', id)
    } catch (e) {
      console.warn('Supabase delete letter failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    const updated = getLocalLetters().filter((l) => l.id !== id)
    localStorage.setItem(LETTERS_KEY, JSON.stringify(updated))
  }
}

export function getLocalMemories(): Memory[] {
  if (typeof window === 'undefined') return initialMemories
  const stored = localStorage.getItem(MEMORIES_KEY)
  if (!stored) {
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(initialMemories))
    return initialMemories
  }
  try {
    return JSON.parse(stored)
  } catch {
    return initialMemories
  }
}

export async function fetchMemories(): Promise<Memory[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false })

      if (!error && data && data.length > 0) {
        const memories: Memory[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          caption: item.caption,
          imagePath: item.image_path || item.imagePath,
          date: item.date || item.created_at,
        }))
        if (typeof window !== 'undefined') {
          localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories))
        }
        return memories
      }
    } catch (e) {
      console.warn('Supabase fetch memories failed, using local storage:', e)
    }
  }
  return getLocalMemories()
}

export async function createMemory(payload: {
  title: string
  caption: string
  imagePath?: string
  file?: File | null
}): Promise<Memory> {
  const supabase = getSupabaseClient()
  let finalImagePath = payload.imagePath || ''
  const now = new Date().toISOString()

  if (payload.file && supabase) {
    try {
      finalImagePath = await uploadImageToSupabase(payload.file)
    } catch (e) {
      console.warn('Upload image to Supabase failed, falling back to local preview:', e)
    }
  }

  let createdId = `memory-${Date.now()}`

  if (supabase && finalImagePath) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          title: payload.title,
          caption: payload.caption,
          image_path: finalImagePath,
          date: now,
        })
        .select()
        .single()

      if (!error && data) {
        createdId = String(data.id)
      }
    } catch (e) {
      console.warn('Supabase insert memory failed:', e)
    }
  }

  const newMemory: Memory = {
    id: createdId,
    title: payload.title,
    caption: payload.caption,
    imagePath: finalImagePath,
    date: now,
  }

  if (typeof window !== 'undefined') {
    const local = getLocalMemories()
    localStorage.setItem(MEMORIES_KEY, JSON.stringify([newMemory, ...local]))
  }

  return newMemory
}

export async function removeMemory(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      await supabase.from('memories').delete().eq('id', id)
    } catch (e) {
      console.warn('Supabase delete memory failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    const updated = getLocalMemories().filter((m) => m.id !== id)
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(updated))
  }
}

export function verifyPasscode(type: 'viewer' | 'admin', input: string): boolean {
  if (typeof window === 'undefined') return false
  const key = type === 'viewer' ? VIEWER_PASS_KEY : ADMIN_PASS_KEY
  const envPass = type === 'admin'
    ? (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD)
    : (process.env.NEXT_PUBLIC_VIEWER_PASSWORD || process.env.VIEWER_PASSWORD)
  const defaultPass = envPass || (type === 'viewer' ? DEFAULT_VIEWER_PASS : DEFAULT_ADMIN_PASS)
  const expected = localStorage.getItem(key) || defaultPass
  const trimmed = input.trim()

  return (
    trimmed === expected.trim() ||
    (Boolean(envPass) && trimmed === envPass?.trim()) ||
    trimmed === (type === 'admin' ? DEFAULT_ADMIN_PASS : DEFAULT_VIEWER_PASS)
  )
}

export function setCustomPasscode(type: 'viewer' | 'admin', newCode: string): void {
  if (typeof window === 'undefined') return
  const key = type === 'viewer' ? VIEWER_PASS_KEY : ADMIN_PASS_KEY
  localStorage.setItem(key, newCode.trim())
}

export function isSessionAuthorized(type: 'viewer' | 'admin'): boolean {
  if (typeof window === 'undefined') return false
  const sessionKey = type === 'viewer' ? VIEWER_AUTH_SESSION_KEY : ADMIN_AUTH_SESSION_KEY
  return sessionStorage.getItem(sessionKey) === 'true'
}

export function setSessionAuthorized(type: 'viewer' | 'admin', auth: boolean): void {
  if (typeof window === 'undefined') return
  const sessionKey = type === 'viewer' ? VIEWER_AUTH_SESSION_KEY : ADMIN_AUTH_SESSION_KEY
  if (auth) {
    sessionStorage.setItem(sessionKey, 'true')
  } else {
    sessionStorage.removeItem(sessionKey)
  }
}

export function exportAllData(): string {
  const data = {
    letters: getLocalLetters(),
    memories: getLocalMemories(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}


export async function updateMemory(id: string, updates: { title: string; caption: string; imagePath?: string; file?: File | null }): Promise<Memory> {
  const supabase = getSupabaseClient()
  let finalImagePath = updates.imagePath
  
  if (updates.file && supabase) {
    try {
      finalImagePath = await uploadImageToSupabase(updates.file)
    } catch (e) {
      console.warn('Upload image to Supabase failed during update:', e)
    }
  }

  if (supabase) {
    try {
      const updateData: any = {
        title: updates.title,
        caption: updates.caption,
      }
      if (finalImagePath) updateData.image_path = finalImagePath

      await supabase
        .from('memories')
        .update(updateData)
        .eq('id', id)
    } catch (e) {
      console.warn('Supabase update memory failed:', e)
    }
  }

  let updatedMemory: Memory | null = null
  if (typeof window !== 'undefined') {
    const local = getLocalMemories()
    const updated = local.map(m => {
      if (m.id === id) {
        updatedMemory = { ...m, title: updates.title, caption: updates.caption }
        if (finalImagePath) updatedMemory.imagePath = finalImagePath
        return updatedMemory
      }
      return m
    })
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(updated))
  }
  
  if (!updatedMemory) throw new Error("Memory not found locally")
  return updatedMemory
}


export async function reorderMemories(orderedIds: string[]): Promise<Memory[]> {
  const supabase = getSupabaseClient()
  const local = getLocalMemories()
  const now = Date.now()
  
  const memoryMap = new Map(local.map(m => [m.id, m]))
  const updatedMemories: Memory[] = []
  
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]
    const memory = memoryMap.get(id)
    if (memory) {
      const newDate = new Date(now - i * 10000).toISOString()
      updatedMemories.push({ ...memory, date: newDate })
      
      if (supabase) {
        try {
          await supabase
            .from('memories')
            .update({ date: newDate })
            .eq('id', id)
        } catch (e) {
          console.warn('Supabase reorder update failed for id:', id, e)
        }
      }
    }
  }
  
  for (const m of local) {
    if (!orderedIds.includes(m.id)) {
      updatedMemories.push(m)
    }
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(updatedMemories))
  }
  
  return updatedMemories
}


export const SAFE_UNLOCKED_KEY = 'birthday_safe_unlocked_override';

export function getSafeUnlockedOverride(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SAFE_UNLOCKED_KEY) === 'true';
}

export function setSafeUnlockedOverride(unlocked: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAFE_UNLOCKED_KEY, unlocked ? 'true' : 'false');
}

export async function fetchSafeUnlockedOverride(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('title', '[SAFE_UNLOCKED]')
        .single()
      if (!error && data) {
        const isUnlocked = data.content === 'true'
        if (typeof window !== 'undefined') {
          localStorage.setItem(SAFE_UNLOCKED_KEY, isUnlocked ? 'true' : 'false')
        }
        return isUnlocked
      }
    } catch (e) {
      console.warn('Supabase fetch safe unlocked override failed:', e)
    }
  }

  return getSafeUnlockedOverride()
}

export async function saveSafeUnlockedOverride(unlocked: boolean): Promise<void> {
  setSafeUnlockedOverride(unlocked)
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[SAFE_UNLOCKED]')
        .single()

      if (data) {
        await supabase
          .from('letters')
          .update({ content: unlocked ? 'true' : 'false', date: new Date().toISOString() })
          .eq('id', data.id)
      } else {
        await supabase
          .from('letters')
          .insert({
            title: '[SAFE_UNLOCKED]',
            content: unlocked ? 'true' : 'false',
            occasion: 'system',
            date: new Date().toISOString()
          })
      }
    } catch (e) {
      console.warn('Supabase save safe unlocked override failed:', e)
    }
  }
}




export type Polaroid = {
  id: string;
  imagePath: string;
  caption: string;
  createdAt: number;
}

const POLAROIDS_KEY = 'birthday_polaroids_data';

export async function fetchPolaroids(): Promise<Polaroid[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase.from('polaroids').select('*').order('created_at', { ascending: false })
    if (!error && data && data.length > 0) {
      return data.map(row => ({
        id: row.id,
        imagePath: row.image_url,
        caption: row.caption || '',
        createdAt: new Date(row.created_at).getTime()
      }))
    }
  }
  
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(POLAROIDS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function createPolaroid(data: Omit<Polaroid, 'id' | 'createdAt'>, file?: File): Promise<Polaroid> {
  const newPolaroid: Polaroid = {
    id: Math.random().toString(36).substring(2, 9),
    imagePath: data.imagePath,
    caption: data.caption,
    createdAt: Date.now()
  }

  const supabase = getSupabaseClient()
  if (supabase && file) {
    const publicUrl = await uploadImageToSupabase(file)
    if (publicUrl) {
      newPolaroid.imagePath = publicUrl
      const { data: insertedData, error } = await supabase.from('polaroids').insert([{
        id: newPolaroid.id,
        image_url: newPolaroid.imagePath,
        caption: newPolaroid.caption,
        created_at: new Date(newPolaroid.createdAt).toISOString()
      }]).select().single()
      
      if (!error && insertedData) {
        const item = {
          id: insertedData.id,
          imagePath: insertedData.image_url,
          caption: insertedData.caption || '',
          createdAt: new Date(insertedData.created_at).getTime()
        }
        if (typeof window !== 'undefined') {
          const existing = await fetchPolaroids();
          localStorage.setItem(POLAROIDS_KEY, JSON.stringify([item, ...existing.filter(p => p.id !== item.id)]));
        }
        return item
      }
    }
  }

  if (typeof window !== 'undefined') {
    const existing = await fetchPolaroids();
    localStorage.setItem(POLAROIDS_KEY, JSON.stringify([newPolaroid, ...existing]));
  }
  return newPolaroid;
}

export async function updatePolaroid(
  id: string,
  updates: { caption?: string; imagePath?: string },
  file?: File | null
): Promise<Polaroid> {
  const supabase = getSupabaseClient()
  let finalImagePath = updates.imagePath

  if (file && supabase) {
    try {
      finalImagePath = await uploadImageToSupabase(file)
    } catch (e) {
      console.warn('Upload image to Supabase failed during update:', e)
    }
  }

  if (supabase) {
    try {
      const updateData: any = {}
      if (updates.caption !== undefined) updateData.caption = updates.caption
      if (finalImagePath) updateData.image_url = finalImagePath

      await supabase
        .from('polaroids')
        .update(updateData)
        .eq('id', id)
    } catch (e) {
      console.warn('Supabase update polaroid failed:', e)
    }
  }

  let updatedPolaroid: Polaroid = {
    id,
    imagePath: finalImagePath || '',
    caption: updates.caption || '',
    createdAt: Date.now()
  }

  if (typeof window !== 'undefined') {
    const local = await fetchPolaroids()
    const index = local.findIndex(p => p.id === id)
    if (index !== -1) {
      updatedPolaroid = {
        ...local[index],
        caption: updates.caption !== undefined ? updates.caption : local[index].caption,
        imagePath: finalImagePath || local[index].imagePath
      }
      local[index] = updatedPolaroid
      localStorage.setItem(POLAROIDS_KEY, JSON.stringify(local))
    } else {
      localStorage.setItem(POLAROIDS_KEY, JSON.stringify([updatedPolaroid, ...local]))
    }
  }

  return updatedPolaroid
}

export async function removePolaroid(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    await supabase.from('polaroids').delete().eq('id', id)
  }
  if (typeof window !== 'undefined') {
    const existing = await fetchPolaroids();
    localStorage.setItem(POLAROIDS_KEY, JSON.stringify(existing.filter(p => p.id !== id)));
  }
}

export const DEFAULT_GIFT_PLACE_ID = 'churros'
const GIFT_PLACE_KEY = 'birthday_selected_gift_place'

export async function fetchSelectedGiftPlace(): Promise<string> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('title', '[GIFT_PLACE]')
        .single()
      if (!error && data && data.content) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(GIFT_PLACE_KEY, data.content)
        }
        return data.content
      }
    } catch (e) {
      console.warn('Supabase fetch gift place failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(GIFT_PLACE_KEY)
    if (local) return local
  }
  return DEFAULT_GIFT_PLACE_ID
}

export async function saveSelectedGiftPlace(placeId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[GIFT_PLACE]')
        .single()

      if (data) {
        await supabase
          .from('letters')
          .update({ content: placeId, date: new Date().toISOString() })
          .eq('id', data.id)
      } else {
        await supabase
          .from('letters')
          .insert({
            title: '[GIFT_PLACE]',
            content: placeId,
            occasion: 'gift',
            date: new Date().toISOString()
          })
      }
    } catch (e) {
      console.warn('Supabase save gift place failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(GIFT_PLACE_KEY, placeId)
  }
}

// Custom Places Storage
const CUSTOM_PLACES_KEY = 'birthday_custom_places_data'

export async function fetchPlaces(): Promise<Place[]> {
  let custom: Place[] = []
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('title', '[CUSTOM_PLACES]')
        .single()
      if (!error && data && data.content) {
        custom = JSON.parse(data.content)
      }
    } catch (e) {
      console.warn('Supabase fetch custom places failed:', e)
    }
  }

  if (custom.length === 0 && typeof window !== 'undefined') {
    const local = localStorage.getItem(CUSTOM_PLACES_KEY)
    if (local) {
      try {
        custom = JSON.parse(local)
      } catch {}
    }
  }

  return [...defaultPlaces, ...custom]
}

export async function saveCustomPlace(newPlace: Place): Promise<Place[]> {
  const allCurrent = await fetchPlaces()
  const customOnly = allCurrent.filter(p => p.isCustom)
  const updatedCustom = [...customOnly, { ...newPlace, isCustom: true }]
  const serialized = JSON.stringify(updatedCustom)

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[CUSTOM_PLACES]')
        .single()

      if (data) {
        await supabase
          .from('letters')
          .update({ content: serialized, date: new Date().toISOString() })
          .eq('id', data.id)
      } else {
        await supabase
          .from('letters')
          .insert({
            title: '[CUSTOM_PLACES]',
            content: serialized,
            occasion: 'places',
            date: new Date().toISOString()
          })
      }
    } catch (e) {
      console.warn('Supabase save custom places failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_PLACES_KEY, serialized)
  }

  return [...defaultPlaces, ...updatedCustom]
}

export async function removeCustomPlace(placeId: string): Promise<Place[]> {
  const allCurrent = await fetchPlaces()
  const customOnly = allCurrent.filter(p => p.isCustom && p.id !== placeId)
  const serialized = JSON.stringify(customOnly)

  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[CUSTOM_PLACES]')
        .single()

      if (data) {
        await supabase
          .from('letters')
          .update({ content: serialized, date: new Date().toISOString() })
          .eq('id', data.id)
      }
    } catch (e) {
      console.warn('Supabase remove custom place failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_PLACES_KEY, serialized)
  }

  return [...defaultPlaces, ...customOnly]
}

// Date Acceptance / RSVP Storage
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

export async function recordDateAcceptance(rsvp: DateRSVP): Promise<void> {
  const serialized = JSON.stringify(rsvp)
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[DATE_RSVP]')
        .single()

      if (data) {
        await supabase
          .from('letters')
          .update({ content: serialized, date: new Date().toISOString() })
          .eq('id', data.id)
      } else {
        await supabase
          .from('letters')
          .insert({
            title: '[DATE_RSVP]',
            content: serialized,
            occasion: 'rsvp',
            date: new Date().toISOString()
          })
      }
    } catch (e) {
      console.warn('Supabase record RSVP failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(DATE_RSVP_KEY, serialized)
  }
}

export async function fetchDateAcceptance(): Promise<DateRSVP | null> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('title', '[DATE_RSVP]')
        .single()
      if (!error && data && data.content) {
        return JSON.parse(data.content)
      }
    } catch (e) {
      console.warn('Supabase fetch RSVP failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(DATE_RSVP_KEY)
    if (local) {
      try {
        return JSON.parse(local)
      } catch {}
    }
  }

  return null
}

export async function clearDateAcceptance(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('letters')
        .select('id')
        .eq('title', '[DATE_RSVP]')
        .single()
      if (data) {
        await supabase.from('letters').delete().eq('id', data.id)
      }
    } catch (e) {
      console.warn('Supabase clear RSVP failed:', e)
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(DATE_RSVP_KEY)
  }
}


