'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarHeart,
  Check,
  ExternalLink,
  Heart,
  KeyRound,
  Loader2,
  MessageCircle,
  Save,
  Ticket,
  Undo2,
  Users,
  Dices,
  X,
} from 'lucide-react'
import { fetchSiteConfig, saveSiteConfig, timeSince, daysUntilNext, whatsappLink } from '@/lib/siteConfig'
import { DEFAULT_SITE_CONFIG, type Coupon, type SiteConfig, type WheelPrize } from '@/data/love'
import { GAMES } from '@/data/games'
import { PageHeader, errorMessage, ui } from '../_components/ui'
import ListEditor from './ListEditor'
import Section from './Section'
import { configToForm, digitsOnly, formToConfig, newId, parseSecretWords, splitComma, splitLines, validateForm, type SiteForm } from './form'

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string }

const SECTIONS = [
  { id: 'names', label: 'Names' },
  { id: 'dates', label: 'Dates' },
  { id: 'reasons', label: 'Reasons' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'wheel', label: 'Wheel' },
  { id: 'words', label: 'Secret words' },
  { id: 'whatsapp', label: 'WhatsApp' },
]

const DEFAULT_FORM = configToForm(DEFAULT_SITE_CONFIG)

function gameHref(id: string): string | null {
  return GAMES.find((g) => g.id === id)?.href ?? null
}

function GameLink({ id, children }: { id: string; children: string }) {
  const href = gameHref(id)
  if (!href) return null
  return (
    <Link href={href} target="_blank" className="inline-flex items-center gap-1 text-rose-600 hover:underline">
      {children} <ExternalLink className="w-3 h-3" aria-hidden="true" />
    </Link>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
    </p>
  )
}

function DateField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={ui.input}
        />
        <button type="button" onClick={() => onChange('')} disabled={!value} className={`${ui.secondaryButton} shrink-0`} aria-label={`Clear ${label.toLowerCase()}`}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
      {hint && !error && <div className="mt-1.5 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}

export default function SiteSettingsPage() {
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState<SiteForm>(DEFAULT_FORM)
  const [savedConfig, setSavedConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const [showProblems, setShowProblems] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchSiteConfig(true).then((config) => {
      if (cancelled) return
      setSavedConfig(config)
      setForm(configToForm(config))
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const current = useMemo(() => formToConfig(form), [form])
  const baseline = useMemo(() => JSON.stringify(formToConfig(configToForm(savedConfig))), [savedConfig])
  const dirty = loaded && JSON.stringify(current) !== baseline
  const problems = useMemo(() => validateForm(form), [form])
  const hasProblems = Object.keys(problems).length > 0
  const visibleProblems = showProblems || dirty ? problems : {}
  const words = useMemo(() => parseSecretWords(form.secretWordsText), [form.secretWordsText])

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // "Saved" fades back to idle.
  useEffect(() => {
    if (saveState.kind !== 'saved') return
    const t = window.setTimeout(() => setSaveState({ kind: 'idle' }), 3500)
    return () => window.clearTimeout(t)
  }, [saveState])

  const set = <K extends keyof SiteForm>(key: K, value: SiteForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (saveState.kind === 'error' || saveState.kind === 'saved') setSaveState({ kind: 'idle' })
  }
  const reset = (...keys: (keyof SiteForm)[]) => {
    setForm((prev) => {
      const next = { ...prev }
      for (const key of keys) (next as Record<keyof SiteForm, unknown>)[key] = DEFAULT_FORM[key]
      return next
    })
  }
  const isDefault = (...keys: (keyof SiteForm)[]) => keys.every((k) => JSON.stringify(form[k]) === JSON.stringify(DEFAULT_FORM[k]))

  const handleSave = async () => {
    setShowProblems(true)
    if (hasProblems) {
      setSaveState({ kind: 'error', message: 'Please fix the highlighted fields first.' })
      return
    }
    setSaveState({ kind: 'saving' })
    try {
      const saved = await saveSiteConfig(current)
      setSavedConfig(saved)
      setForm(configToForm(saved))
      setShowProblems(false)
      setSaveState({ kind: 'saved' })
    } catch (err) {
      setSaveState({ kind: 'error', message: errorMessage(err) })
    }
  }

  const handleDiscard = () => {
    setForm(configToForm(savedConfig))
    setShowProblems(false)
    setSaveState({ kind: 'idle' })
  }

  // Live previews
  const together = form.anniversaryDate && !problems.anniversaryDate ? timeSince(form.anniversaryDate) : null
  const daysToAnniversary = together ? daysUntilNext(form.anniversaryDate) : null
  const nextAnniversaryYears = together && daysToAnniversary !== null ? (daysToAnniversary === 0 ? together.years : together.years + 1) : null
  const daysToBirthday = form.birthdayDate && !problems.birthdayDate ? daysUntilNext(form.birthdayDate) : null
  const nicknames = splitComma(form.nicknamesText)
  const reasons = splitLines(form.reasonsText)
  const validCoupons = form.coupons.filter((c) => c.title.trim()).length
  const validPrizes = form.wheelPrizes.filter((p) => p.label.trim()).length
  const whatsappDigits = digitsOnly(form.whatsappNumber)

  if (!loaded) {
    return (
      <div className="py-16 flex justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading site settings" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Site & Games"
        subtitle="Names, special dates and all the little words the site and the games use. Changes go live for her as soon as you save."
      />

      {/* Section shortcuts (scrolls inside itself on small phones) */}
      <nav aria-label="Sections" className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-2 w-max">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block whitespace-nowrap rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:border-rose-300 hover:text-rose-600 transition-colors">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section
        id="names"
        icon={Users}
        title="The two of you"
        description="How the site greets her and how you sign off."
        onReset={() => reset('herName', 'fromName', 'yearsTogether', 'nicknamesText')}
        resetDisabled={isDefault('herName', 'fromName', 'yearsTogether', 'nicknamesText')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="her-name" className={ui.label}>
              Her name
            </label>
            <input id="her-name" type="text" value={form.herName} onChange={(e) => set('herName', e.target.value)} placeholder="Leave empty to use her nicknames" maxLength={40} className={ui.input} />
          </div>
          <div>
            <label htmlFor="from-name" className={ui.label}>
              Signed by
            </label>
            <input
              id="from-name"
              type="text"
              value={form.fromName}
              onChange={(e) => set('fromName', e.target.value)}
              placeholder="Your babyboy"
              maxLength={40}
              aria-invalid={Boolean(visibleProblems.fromName)}
              aria-describedby={visibleProblems.fromName ? 'from-name-error' : undefined}
              className={ui.input}
            />
            <FieldError id="from-name-error" message={visibleProblems.fromName} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="nicknames" className={ui.label}>
              Her nicknames <span className="font-normal text-gray-400">(comma separated)</span>
            </label>
            <input id="nicknames" type="text" value={form.nicknamesText} onChange={(e) => set('nicknamesText', e.target.value)} placeholder="baby, baba, sweetheart" className={ui.input} />
            <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
              {nicknames.length > 0 ? (
                nicknames.map((n, i) => (
                  <span key={`${n}-${i}`} className="rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-xs font-medium">
                    {n}
                  </span>
                ))
              ) : (
                <span className={ui.hint}>Empty: the default nicknames will be used.</span>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="years-together" className={ui.label}>
              Years together
            </label>
            <input
              id="years-together"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              step={1}
              value={form.yearsTogether}
              onChange={(e) => set('yearsTogether', e.target.value)}
              aria-invalid={Boolean(visibleProblems.yearsTogether)}
              aria-describedby={visibleProblems.yearsTogether ? 'years-error' : 'years-hint'}
              className={ui.input}
            />
            <FieldError id="years-error" message={visibleProblems.yearsTogether} />
            {!visibleProblems.yearsTogether && (
              <p id="years-hint" className={`${ui.hint} mt-1`}>
                Used in headlines like &ldquo;Happy {form.yearsTogether || '5'} Years&rdquo;.
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section
        id="dates"
        icon={CalendarHeart}
        title="Special dates"
        description="Leave a date empty to hide what it powers."
        onReset={() => reset('anniversaryDate', 'birthdayDate')}
        resetDisabled={isDefault('anniversaryDate', 'birthdayDate')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DateField
            id="anniversary-date"
            label="The day you got together"
            value={form.anniversaryDate}
            onChange={(v) => set('anniversaryDate', v)}
            error={visibleProblems.anniversaryDate}
            hint={
              together ? (
                <span className="text-rose-700">
                  Together for {together.years} year{together.years === 1 ? '' : 's'}, {together.months} month{together.months === 1 ? '' : 's'} and {together.days} day
                  {together.days === 1 ? '' : 's'} ({together.totalDays.toLocaleString()} days).
                  {nextAnniversaryYears !== null && daysToAnniversary !== null && (
                    <>
                      {' '}
                      {daysToAnniversary === 0 ? `Today is your ${nextAnniversaryYears}-year anniversary!` : `Year ${nextAnniversaryYears} in ${daysToAnniversary} day${daysToAnniversary === 1 ? '' : 's'}.`}
                      {String(nextAnniversaryYears) !== form.yearsTogether && nextAnniversaryYears > 0 && (
                        <button type="button" onClick={() => set('yearsTogether', String(nextAnniversaryYears))} className="ml-1 font-semibold underline underline-offset-2 hover:text-rose-900">
                          Use {nextAnniversaryYears} years
                        </button>
                      )}
                    </>
                  )}
                </span>
              ) : (
                'The home page "together for…" counter appears once this date is set.'
              )
            }
          />
          <DateField
            id="birthday-date"
            label="Her birthday"
            value={form.birthdayDate}
            onChange={(v) => set('birthdayDate', v)}
            error={visibleProblems.birthdayDate}
            hint={
              daysToBirthday !== null ? (
                <span className="text-rose-700">{daysToBirthday === 0 ? "It's her birthday today! 🎂" : `${daysToBirthday} day${daysToBirthday === 1 ? '' : 's'} until her birthday.`}</span>
              ) : (
                'Powers the birthday countdown. Any year works; only the day and month matter.'
              )
            }
          />
        </div>
      </Section>

      <Section
        id="reasons"
        icon={Heart}
        title="Reasons I love you"
        description={`One reason per line (${reasons.length}). They show up one by one around the site.`}
        onReset={() => reset('reasonsText')}
        resetDisabled={isDefault('reasonsText')}
      >
        <label htmlFor="reasons-text" className="sr-only">
          Reasons, one per line
        </label>
        <textarea id="reasons-text" value={form.reasonsText} onChange={(e) => set('reasonsText', e.target.value)} rows={10} className={ui.textarea} />
        {reasons.length === 0 && <p className={`${ui.hint} mt-1`}>Empty: the default reasons will be used.</p>}
      </Section>

      <Section
        id="coupons"
        icon={Ticket}
        title="Love coupons"
        description={
          <>
            Coupons she scratches and redeems in the <GameLink id="love-coupons">Love Coupons</GameLink> game.
          </>
        }
        onReset={() => reset('coupons')}
        resetDisabled={isDefault('coupons')}
      >
        <ListEditor<Coupon>
          items={form.coupons}
          onChange={(items) => set('coupons', items)}
          itemName="coupon"
          makeNew={() => ({ id: newId('coupon'), emoji: '💝', title: '', description: '' })}
          fields={[
            { key: 'emoji', label: 'Emoji', kind: 'emoji' },
            { key: 'title', label: 'Title', placeholder: 'e.g. Breakfast in bed', maxLength: 60 },
            { key: 'description', label: 'Description', placeholder: 'What she gets when she redeems it', kind: 'long' },
          ]}
        />
        {validCoupons === 0 && <p className="mt-2 text-xs text-amber-700">No coupons with a title: the default coupons will be used.</p>}
      </Section>

      <Section
        id="wheel"
        icon={Dices}
        title="Wheel of Love prizes"
        description={
          <>
            Slices on the <GameLink id="love-wheel">Wheel of Love</GameLink>. Short labels fit best on small phones.
          </>
        }
        onReset={() => reset('wheelPrizes')}
        resetDisabled={isDefault('wheelPrizes')}
      >
        <ListEditor<WheelPrize>
          items={form.wheelPrizes}
          onChange={(items) => set('wheelPrizes', items)}
          itemName="prize"
          makeNew={() => ({ id: newId('prize'), emoji: '🎁', label: '', detail: '' })}
          fields={[
            { key: 'emoji', label: 'Emoji', kind: 'emoji' },
            { key: 'label', label: 'Label', placeholder: 'e.g. 10 kisses', maxLength: 24 },
            { key: 'detail', label: 'Detail', placeholder: 'What exactly she won', kind: 'long' },
          ]}
        />
        {validPrizes < 2 && <p className="mt-2 text-xs text-amber-700">The wheel needs at least 2 prizes with a label, otherwise the default prizes are used.</p>}
      </Section>

      <Section
        id="words"
        icon={KeyRound}
        title="Secret words"
        description={
          <>
            Five-letter words for the <GameLink id="secret-word">Secret Word</GameLink> game (letters A–Z only).
          </>
        }
        onReset={() => reset('secretWordsText')}
        resetDisabled={isDefault('secretWordsText')}
      >
        <label htmlFor="secret-words" className="sr-only">
          Secret words, comma separated
        </label>
        <textarea
          id="secret-words"
          value={form.secretWordsText}
          onChange={(e) => set('secretWordsText', e.target.value)}
          rows={3}
          autoCapitalize="characters"
          spellCheck={false}
          className={`${ui.textarea} uppercase`}
        />
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
          {words.valid.map((w) => (
            <span key={w} className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-mono font-semibold tracking-widest">
              {w}
            </span>
          ))}
          {words.invalid.map((w, i) => (
            <span key={`${w}-${i}`} className="rounded-md bg-red-50 text-red-700 px-2 py-0.5 text-xs font-mono line-through" title="Needs exactly 5 letters A–Z">
              {w}
            </span>
          ))}
        </div>
        <p className={`${ui.hint} mt-2`}>
          {words.valid.length} valid word{words.valid.length === 1 ? '' : 's'}
          {words.invalid.length > 0 && (
            <span className="text-red-600">
              {' '}
              · {words.invalid.length} invalid (struck through) will be skipped: they need exactly 5 letters A–Z
            </span>
          )}
          {words.valid.length === 0 && <span className="text-amber-700"> · none valid: the default words will be used</span>}
        </p>
      </Section>

      <Section
        id="whatsapp"
        icon={MessageCircle}
        title="WhatsApp"
        description="Where her date RSVP and coupon redemptions are sent."
        onReset={() => reset('whatsappNumber')}
        resetDisabled={isDefault('whatsappNumber')}
      >
        <label htmlFor="whatsapp-number" className={ui.label}>
          Your number (international format, no +)
        </label>
        <div className="flex flex-col min-[420px]:flex-row gap-2">
          <input
            id="whatsapp-number"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={form.whatsappNumber}
            onChange={(e) => set('whatsappNumber', e.target.value)}
            placeholder="94741234567"
            aria-invalid={Boolean(visibleProblems.whatsappNumber)}
            aria-describedby={visibleProblems.whatsappNumber ? 'whatsapp-error' : undefined}
            className={ui.input}
          />
          {whatsappDigits.length >= 8 && (
            <a
              href={whatsappLink(whatsappDigits, 'Testing the link from Admin Studio 💌')}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ui.secondaryButton} shrink-0 whitespace-nowrap`}
            >
              Test link <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
        <FieldError id="whatsapp-error" message={visibleProblems.whatsappNumber} />
        {!form.whatsappNumber.trim() && <p className={`${ui.hint} mt-1`}>Empty: the built-in number will be used.</p>}
      </Section>

      {/* Sticky save bar (kept above the floating theme/sound buttons on phones) */}
      <div className="sticky bottom-20 md:bottom-4 z-30">
        <div
          className={`flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md transition-colors ${
            saveState.kind === 'error' ? 'bg-red-50/95 border-red-200' : dirty ? 'bg-white/95 border-rose-200' : 'bg-white/90 border-gray-200'
          }`}
        >
          <p className="flex-1 min-w-0 text-sm" role="status" aria-live="polite">
            {saveState.kind === 'saving' && <span className="text-gray-600">Saving…</span>}
            {saveState.kind === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-4 h-4" aria-hidden="true" /> Saved. She&apos;ll see it next time a page loads.
              </span>
            )}
            {saveState.kind === 'error' && <span className="text-red-700 break-words">{saveState.message}</span>}
            {saveState.kind === 'idle' && (dirty ? <span className="text-rose-700 font-medium">You have unsaved changes.</span> : <span className="text-gray-500">All changes saved.</span>)}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={handleDiscard} disabled={!dirty || saveState.kind === 'saving'} className={`${ui.secondaryButton} flex-1 min-[480px]:flex-none`}>
              <Undo2 className="w-4 h-4" aria-hidden="true" /> Discard
            </button>
            <button type="button" onClick={handleSave} disabled={!dirty || saveState.kind === 'saving'} className={`${ui.roseButton} flex-1 min-[480px]:flex-none`}>
              {saveState.kind === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              <span className="min-[400px]:hidden">Save</span>
              <span className="hidden min-[400px]:inline">Save changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
