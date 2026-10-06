import { initialLetters, initialMemories, Letter, Memory } from '@/data/initialData'

const LETTERS_KEY = 'birthday_letters_data'
const MEMORIES_KEY = 'birthday_memories_data'
const VIEWER_PASS_KEY = 'birthday_viewer_passcode'
const ADMIN_PASS_KEY = 'birthday_admin_passcode'
const VIEWER_AUTH_SESSION_KEY = 'birthday_viewer_session'
const ADMIN_AUTH_SESSION_KEY = 'birthday_admin_session'

const DEFAULT_VIEWER_PASS = 'happy_birthday'
const DEFAULT_ADMIN_PASS = 'admin_birthday'

export function getLetters(): Letter[] {
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

export function saveLetter(letter: Omit<Letter, 'id' | 'date'> & { id?: string; date?: string }): Letter {
  const letters = getLetters()
  const now = new Date().toISOString()
  if (letter.id) {
    const index = letters.findIndex((l) => l.id === letter.id)
    if (index !== -1) {
      letters[index] = { ...letters[index], ...letter, date: letter.date || letters[index].date }
      localStorage.setItem(LETTERS_KEY, JSON.stringify(letters))
      return letters[index]
    }
  }

  const newLetter: Letter = {
    id: `letter-${Date.now()}`,
    title: letter.title,
    content: letter.content,
    occasion: letter.occasion,
    date: letter.date || now,
  }

  const updated = [newLetter, ...letters]
  localStorage.setItem(LETTERS_KEY, JSON.stringify(updated))
  return newLetter
}

export function deleteLetter(id: string): void {
  const letters = getLetters().filter((l) => l.id !== id)
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters))
}

export function getMemories(): Memory[] {
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

export function saveMemory(memory: Omit<Memory, 'id' | 'date'> & { id?: string; date?: string }): Memory {
  const memories = getMemories()
  const now = new Date().toISOString()
  if (memory.id) {
    const index = memories.findIndex((m) => m.id === memory.id)
    if (index !== -1) {
      memories[index] = { ...memories[index], ...memory, date: memory.date || memories[index].date }
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories))
      return memories[index]
    }
  }

  const newMemory: Memory = {
    id: `memory-${Date.now()}`,
    title: memory.title,
    caption: memory.caption,
    imagePath: memory.imagePath,
    date: memory.date || now,
  }

  const updated = [newMemory, ...memories]
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(updated))
  return newMemory
}

export function deleteMemory(id: string): void {
  const memories = getMemories().filter((m) => m.id !== id)
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories))
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
    letters: getLetters(),
    memories: getMemories(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export function importAllData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString)
    if (Array.isArray(parsed.letters)) {
      localStorage.setItem(LETTERS_KEY, JSON.stringify(parsed.letters))
    }
    if (Array.isArray(parsed.memories)) {
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(parsed.memories))
    }
    return true
  } catch {
    return false
  }
}
