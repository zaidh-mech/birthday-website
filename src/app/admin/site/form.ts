import { DEFAULT_SITE_CONFIG, type Coupon, type SiteConfig, type WheelPrize } from '@/data/love'

/**
 * The Site & Games form keeps the comma/line separated fields as raw text while
 * he types (so commas and blank lines don't jump around), and turns them into
 * a SiteConfig only when comparing or saving.
 */
export interface SiteForm {
  herName: string
  fromName: string
  anniversaryDate: string
  birthdayDate: string
  yearsTogether: string
  nicknamesText: string
  reasonsText: string
  coupons: Coupon[]
  wheelPrizes: WheelPrize[]
  secretWordsText: string
  whatsappNumber: string
}

export function configToForm(config: SiteConfig): SiteForm {
  return {
    herName: config.herName,
    fromName: config.fromName,
    anniversaryDate: config.anniversaryDate,
    birthdayDate: config.birthdayDate,
    yearsTogether: String(config.yearsTogether),
    nicknamesText: config.nicknames.join(', '),
    reasonsText: config.reasons.join('\n'),
    coupons: config.coupons.map((c) => ({ ...c })),
    wheelPrizes: config.wheelPrizes.map((p) => ({ ...p })),
    secretWordsText: config.secretWords.join(', '),
    whatsappNumber: config.whatsappNumber,
  }
}

export const splitComma = (text: string) =>
  text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)

export const splitLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)

export function parseSecretWords(text: string): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  for (const raw of text.split(/[\s,;]+/).map((w) => w.trim()).filter(Boolean)) {
    const word = raw.toUpperCase()
    if (/^[A-Z]{5}$/.test(word)) {
      if (!valid.includes(word)) valid.push(word)
    } else {
      invalid.push(raw)
    }
  }
  return { valid, invalid }
}

export const digitsOnly = (text: string) => text.replace(/\D/g, '')

function trimStrings<T extends object>(item: T): T {
  const next = { ...item } as Record<string, unknown>
  for (const [key, value] of Object.entries(next)) {
    if (typeof value === 'string') next[key] = value.trim()
  }
  return next as T
}

export function formToConfig(form: SiteForm): SiteConfig {
  const years = Number.parseInt(form.yearsTogether, 10)
  return {
    herName: form.herName.trim(),
    fromName: form.fromName.trim(),
    anniversaryDate: form.anniversaryDate,
    birthdayDate: form.birthdayDate,
    yearsTogether: Number.isFinite(years) ? years : DEFAULT_SITE_CONFIG.yearsTogether,
    nicknames: splitComma(form.nicknamesText),
    reasons: splitLines(form.reasonsText),
    coupons: form.coupons.map(trimStrings).filter((c) => c.title),
    wheelPrizes: form.wheelPrizes.map(trimStrings).filter((p) => p.label),
    secretWords: parseSecretWords(form.secretWordsText).valid,
    whatsappNumber: digitsOnly(form.whatsappNumber),
  }
}

export interface FormProblems {
  fromName?: string
  yearsTogether?: string
  anniversaryDate?: string
  birthdayDate?: string
  whatsappNumber?: string
}

const isValidDate = (v: string) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime()))

/** Problems that block saving. Softer issues (fallbacks to defaults) are shown as hints instead. */
export function validateForm(form: SiteForm): FormProblems {
  const problems: FormProblems = {}
  if (!form.fromName.trim()) problems.fromName = 'Tell her who it is from.'
  const years = Number(form.yearsTogether)
  if (!Number.isInteger(years) || years < 1 || years > 100) problems.yearsTogether = 'Use a whole number between 1 and 100.'
  if (!isValidDate(form.anniversaryDate)) problems.anniversaryDate = 'That date is not valid.'
  else if (form.anniversaryDate && new Date(`${form.anniversaryDate}T00:00:00`) > new Date()) problems.anniversaryDate = 'The anniversary date is in the future.'
  if (!isValidDate(form.birthdayDate)) problems.birthdayDate = 'That date is not valid.'
  const digits = digitsOnly(form.whatsappNumber)
  if (form.whatsappNumber.trim() && (digits.length < 8 || digits.length > 15)) {
    problems.whatsappNumber = 'Use the full international number, 8–15 digits (e.g. 94741234567).'
  }
  return problems
}

let counter = 0
export function newId(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
