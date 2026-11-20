'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_SITE_CONFIG, SiteConfig, Coupon, WheelPrize } from '@/data/love'
import { getSetting, isCloudConfigured, upsertSetting } from './supabase'

/**
 * Editable site content (names, dates, reasons, coupons, wheel prizes, words).
 * Stored like the other settings: one row in the `letters` table titled
 * "[SITE_CONFIG]" whose content is JSON, mirrored to localStorage.
 */

export type { SiteConfig, Coupon, WheelPrize }

const TITLE = '[SITE_CONFIG]'
const LOCAL_KEY = 'birthday_site_config'

function sanitize(raw: unknown): SiteConfig {
  const d = DEFAULT_SITE_CONFIG
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<SiteConfig>
  const strList = (v: unknown, fallback: string[]) =>
    Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter(Boolean) : fallback
  const nonEmpty = <T,>(list: T[], fallback: T[]) => (list.length > 0 ? list : fallback)
  // Duplicate lines would stop "seen them all" features (e.g. the reasons jar) from ever completing.
  const unique = (list: string[]) => [...new Set(list)]

  const coupons = Array.isArray(r.coupons)
    ? r.coupons
        .filter((c): c is Coupon => Boolean(c && typeof c === 'object' && (c as Coupon).title))
        .map((c, i) => ({ id: String(c.id || `coupon-${i}`), emoji: String(c.emoji || '💝'), title: String(c.title), description: String(c.description || '') }))
    : d.coupons
  const wheelPrizes = Array.isArray(r.wheelPrizes)
    ? r.wheelPrizes
        .filter((p): p is WheelPrize => Boolean(p && typeof p === 'object' && (p as WheelPrize).label))
        .map((p, i) => ({ id: String(p.id || `prize-${i}`), emoji: String(p.emoji || '💝'), label: String(p.label), detail: String(p.detail || '') }))
    : d.wheelPrizes
  const secretWords = strList(r.secretWords, d.secretWords)
    .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter((w) => w.length === 5)

  return {
    herName: typeof r.herName === 'string' ? r.herName.trim() : d.herName,
    fromName: typeof r.fromName === 'string' && r.fromName.trim() ? r.fromName.trim() : d.fromName,
    anniversaryDate: isDateString(r.anniversaryDate) ? r.anniversaryDate : '',
    birthdayDate: isDateString(r.birthdayDate) ? r.birthdayDate : '',
    yearsTogether: Number.isFinite(Number(r.yearsTogether)) && Number(r.yearsTogether) > 0 ? Math.round(Number(r.yearsTogether)) : d.yearsTogether,
    nicknames: nonEmpty(unique(strList(r.nicknames, d.nicknames)), d.nicknames),
    reasons: nonEmpty(unique(strList(r.reasons, d.reasons)), d.reasons),
    coupons: nonEmpty(coupons, d.coupons),
    wheelPrizes: wheelPrizes.length >= 2 ? wheelPrizes : d.wheelPrizes,
    secretWords: nonEmpty(secretWords, d.secretWords),
    whatsappNumber: typeof r.whatsappNumber === 'string' && r.whatsappNumber.replace(/\D/g, '') ? r.whatsappNumber.replace(/\D/g, '') : d.whatsappNumber,
  }
}

function isDateString(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime())
}

function readLocal(): SiteConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeLocal(config: SiteConfig) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}

let inflight: Promise<SiteConfig> | null = null
let current: SiteConfig | null = null
const listeners = new Set<(c: SiteConfig) => void>()

/**
 * The cloud config, else the local copy, else the defaults. `cloudUnreadable`
 * is true when a connected cloud couldn't be read, i.e. the config returned may
 * not be the one that is actually saved.
 */
async function loadConfig(): Promise<{ config: SiteConfig; cloudUnreadable: boolean }> {
  const result = await getSetting(TITLE)
  if (result.reachable && result.content) {
    try {
      const parsed = sanitize(JSON.parse(result.content))
      writeLocal(parsed)
      return { config: parsed, cloudUnreadable: false }
    } catch (e) {
      console.warn('Site config in the cloud is not valid JSON, using local copy:', e)
    }
  }
  return { config: readLocal() ?? DEFAULT_SITE_CONFIG, cloudUnreadable: !result.reachable && isCloudConfigured() }
}

/**
 * For the admin editor: a fresh load that also says whether the cloud couldn't
 * be read. Saving a form built from a fallback copy would overwrite the real
 * settings, so the editor must not save in that case.
 */
export function fetchSiteConfigForEditing(): Promise<{ config: SiteConfig; cloudUnreadable: boolean }> {
  return loadConfig()
}

/** Loads the config from the cloud (falls back to the local copy, then defaults). Cached per page load. */
export function fetchSiteConfig(force = false): Promise<SiteConfig> {
  if (inflight && !force) return inflight
  inflight = loadConfig().then((r) => r.config)
  inflight.then((c) => {
    current = c
    listeners.forEach((l) => l(c))
  })
  return inflight
}

/** Saves the config to the cloud (when connected) and locally. */
export async function saveSiteConfig(config: SiteConfig): Promise<SiteConfig> {
  const clean = sanitize(config)
  // Throws a readable Error when the cloud is connected but the write fails.
  await upsertSetting(TITLE, JSON.stringify(clean), 'config')
  writeLocal(clean)
  current = clean
  inflight = Promise.resolve(clean)
  listeners.forEach((l) => l(clean))
  return clean
}

/**
 * React hook — returns the defaults (or the last local copy) immediately,
 * then the cloud version once loaded. `loaded` turns true after the fetch.
 */
export function useSiteConfig(): { config: SiteConfig; loaded: boolean } {
  const [state, setState] = useState<{ config: SiteConfig; loaded: boolean }>(() => ({
    config: current ?? DEFAULT_SITE_CONFIG,
    loaded: current !== null,
  }))

  useEffect(() => {
    if (!current) {
      const local = readLocal()
      if (local) setState({ config: local, loaded: false })
    }
    const listener = (c: SiteConfig) => setState({ config: c, loaded: true })
    listeners.add(listener)
    fetchSiteConfig().then(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return state
}

/** Whole days/hours/minutes/seconds since a YYYY-MM-DD date (local time). */
export function timeSince(dateStr: string, now = new Date()) {
  const start = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) {
    // Unknown or future date: count nothing rather than mixing negative calendar maths.
    return { totalDays: 0, hours: 0, minutes: 0, seconds: 0, years: 0, months: 0, days: 0 }
  }
  let ms = now.getTime() - start.getTime()
  const totalDays = Math.floor(ms / 86400000)
  ms -= totalDays * 86400000
  const hours = Math.floor(ms / 3600000)
  ms -= hours * 3600000
  const minutes = Math.floor(ms / 60000)
  ms -= minutes * 60000
  const seconds = Math.floor(ms / 1000)

  // Calendar years/months/days for the friendly headline.
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { totalDays, hours, minutes, seconds, years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days) }
}

/** Days until the next occurrence of a month/day (0 = today). */
export function daysUntilNext(dateStr: string, now = new Date()): number {
  const [, m, d] = dateStr.split('-').map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), m - 1, d)
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
}
