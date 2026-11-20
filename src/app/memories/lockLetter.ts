/**
 * The "safe" letter: a letter with fill-in-the-blanks written as
 * `[placeholder|answer]` (edited in Admin Studio → Safe).
 */

export const DEFAULT_LETTER_TEXT = `To my dearest [pet name|baby],

From the very first time we went to [place|colombo], I knew you were someone special. I absolutely love your [feature|smile] and how you always make my days brighter. I can't wait to spend [time|forever] with you.

Yours always.`

export const LOCK_LETTER_TITLE = '[LOCK_LETTER]'

export type LetterPart =
  | { type: 'text'; key: string; content: string }
  | { type: 'blank'; key: string; id: string; index: number; placeholder: string; answer: string }

export type BlankPart = Extract<LetterPart, { type: 'blank' }>

const BLANK_RE = /\[([^[\]|]+)\|([^[\]]+)\]/g

export function parseLockLetter(raw: string): LetterPart[] {
  const text = (raw || '').replace(/\r\n?/g, '\n')
  const parts: LetterPart[] = []
  let lastIndex = 0
  let blankCount = 0
  BLANK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = BLANK_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', key: `t${parts.length}`, content: text.substring(lastIndex, match.index) })
    }
    const placeholder = match[1].trim()
    const answer = match[2].trim()
    if (answer) {
      blankCount += 1
      parts.push({ type: 'blank', key: `b${blankCount}`, id: `blank${blankCount}`, index: blankCount - 1, placeholder: placeholder || 'something', answer })
    } else {
      parts.push({ type: 'text', key: `t${parts.length}`, content: match[0] })
    }
    lastIndex = BLANK_RE.lastIndex
  }
  if (lastIndex < text.length) parts.push({ type: 'text', key: `t${parts.length}`, content: text.substring(lastIndex) })
  return parts
}

export function getBlanks(parts: LetterPart[]): BlankPart[] {
  return parts.filter((p): p is BlankPart => p.type === 'blank')
}

/**
 * Normalises an answer for comparison: case, curly quotes, surrounding
 * whitespace, repeated spaces and leading/trailing punctuation don't matter.
 */
export function normalizeAnswer(value: string): string {
  return (value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["'([{\s]+/, '')
    .replace(/[\s.,!?;:'")\]}…~-]+$/, '')
    .trim()
}

export function isAnswerCorrect(input: string, answer: string): boolean {
  const expected = normalizeAnswer(answer)
  const given = normalizeAnswer(input)
  // An answer that is pure punctuation (e.g. ":)") would normalise to nothing.
  if (!expected) return input.trim().toLowerCase() === answer.trim().toLowerCase() && input.trim() !== ''
  return given === expected
}
