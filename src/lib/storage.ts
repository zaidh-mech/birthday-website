import { initialLetters, initialMemories, Letter, Memory } from '@/data/initialData'
import { getSupabaseClient, uploadImageToSupabase } from './supabase'

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
  const expected = localStorage.getItem(key) || (type === 'viewer' ? DEFAULT_VIEWER_PASS : DEFAULT_ADMIN_PASS)
  return input.trim() === expected.trim()
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
        return {
          id: insertedData.id,
          imagePath: insertedData.image_url,
          caption: insertedData.caption || '',
          createdAt: new Date(insertedData.created_at).getTime()
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    const existing = await fetchPolaroids();
    localStorage.setItem(POLAROIDS_KEY, JSON.stringify([newPolaroid, ...existing]));
  }
  return newPolaroid;
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
