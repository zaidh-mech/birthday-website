'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus, Check, Download, ExternalLink, LoaderCircle, MapPin, MessageCircle } from 'lucide-react'
import { useInterval, useIsCoarsePointer } from '@/lib/hooks'
import { sfx } from '@/lib/sound'
import TicketCard from './TicketCard'
import { renderTicketPng, type TicketInfo } from './ticketCanvas'
import { buildIcs, downloadBlob, googleCalendarUrl, type CalendarEvent } from './calendar'

function isDarkNow(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function Countdown({ start, end, reduce }: { start: Date; end: Date; reduce: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useInterval(() => setNow(Date.now()), 1000)

  const diff = start.getTime() - now
  if (diff <= 0) {
    const happening = now < end.getTime()
    return (
      <p className="rounded-2xl bg-rose-50 px-5 py-4 text-center font-serif text-lg font-semibold text-rose-600 dark:bg-white/5 dark:text-purple-200">
        {happening ? "It's happening right now! Go go go 💃🕺" : 'We had our date 🥰 Thank you for the most perfect day.'}
      </p>
    )
  }

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  const parts: [string, number][] = [
    ['Days', days],
    ['Hours', hours],
    ['Mins', mins],
    ['Secs', secs],
  ]

  return (
    <div role="timer" aria-label={`${days} days, ${hours} hours and ${mins} minutes until our date`} className="grid grid-cols-4 gap-2 sm:gap-3">
      {parts.map(([label, value]) => (
        <div
          key={label}
          className="flex flex-col items-center rounded-2xl border border-rose-100 bg-white/70 px-1 py-2.5 shadow-sm backdrop-blur-md sm:py-3 dark:border-white/10 dark:bg-white/5"
        >
          <span className="relative h-8 overflow-hidden font-serif text-2xl font-bold tabular-nums text-gray-900 sm:h-9 sm:text-3xl dark:text-gray-50" aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                className="block"
                initial={reduce ? false : { y: -18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: 18, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {String(value).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-400 dark:text-purple-300">{label}</span>
        </div>
      ))}
    </div>
  )
}

interface TicketStepProps {
  info: TicketInfo
  event: CalendarEvent
  start: Date
  end: Date
  reduce: boolean
  customMessage: string
  onMessageChange: (value: string) => void
  /** wa.me link with the current message, used as a real <a> so iOS never blocks it */
  whatsappHref: string
  onWhatsAppSent: () => void
  waSent: boolean
  waBlocked: boolean
  acceptHref: string | null
  onChangePlace: () => void
}

export default function TicketStep({
  info,
  event,
  start,
  end,
  reduce,
  customMessage,
  onMessageChange,
  whatsappHref,
  onWhatsAppSent,
  waSent,
  waBlocked,
  acceptHref,
  onChangePlace,
}: TicketStepProps) {
  const coarse = useIsCoarsePointer()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const cacheRef = useRef<{ key: string; blob: Blob } | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const infoKey = JSON.stringify(info)

  const flash = (text: string) => {
    setNotice(text)
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 3200)
  }

  useEffect(() => () => {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
  }, [])

  // Pre-render the PNG in the background so "Save" can share/download instantly
  // (mobile share sheets need to open while the tap is still "fresh").
  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      const dark = isDarkNow()
      renderTicketPng(info, dark)
        .then((blob) => {
          if (!cancelled && blob) cacheRef.current = { key: `${infoKey}|${dark}`, blob }
        })
        .catch(() => {})
    }, 900)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [infoKey])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const dark = isDarkNow()
      const key = `${infoKey}|${dark}`
      let blob = cacheRef.current?.key === key ? cacheRef.current.blob : null
      if (!blob) {
        blob = await renderTicketPng(info, dark)
        if (blob) cacheRef.current = { key, blob }
      }
      if (!blob) throw new Error('render failed')
      const filename = `our-date-ticket-${info.dateISO}.png`

      if (coarse && typeof navigator.share === 'function' && typeof File !== 'undefined') {
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Our date ticket 💌' })
            sfx.chime()
            flash('Ticket ready to keep forever 💌')
            return
          } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') return
            // Share not allowed here — fall back to a download.
          }
        }
      }
      downloadBlob(blob, filename)
      sfx.chime()
      flash('Ticket saved 💾 Keep it safe!')
    } catch {
      sfx.miss()
      flash("Hmm, it didn't save. A screenshot works too 📸")
    } finally {
      setSaving(false)
    }
  }

  const handleCalendar = () => {
    try {
      const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
      downloadBlob(blob, `our-date-${info.dateISO}.ics`)
      sfx.chime()
      flash('Calendar invite downloaded 📅 Open it to add our date.')
    } catch {
      flash("Couldn't create the calendar file, sorry!")
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 text-center">
        <motion.div
          initial={reduce ? false : { scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.1 }}
          className="mb-4 text-6xl"
          aria-hidden="true"
        >
          💖
        </motion.div>
        <h2 className="bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text font-serif text-4xl font-bold text-transparent md:text-5xl dark:from-rose-300 dark:to-purple-300">
          It&apos;s a Date!
        </h2>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Mwah, I love youuuuuu</p>
      </div>

      <TicketCard info={info} reduce={reduce} />

      <section className="mt-8" aria-label="Countdown to our date">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-400 dark:text-purple-300">Counting down to us</p>
        <Countdown start={start} end={end} reduce={reduce} />
      </section>

      <div className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-black active:scale-95 disabled:opacity-60 dark:bg-white/15 dark:hover:bg-white/25"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          Save ticket
        </button>
        <button
          type="button"
          onClick={handleCalendar}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-rose-100 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white active:scale-95 dark:bg-white/5 dark:text-gray-100 dark:ring-white/10 dark:hover:bg-white/10"
        >
          <CalendarPlus className="h-4 w-4 text-rose-500 dark:text-purple-300" aria-hidden="true" />
          Add to calendar
        </button>
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-rose-500 hover:underline dark:text-gray-400 dark:hover:text-purple-200"
        >
          Google Calendar <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      <p className="mt-2 min-h-[1.5rem] text-center text-sm font-medium text-rose-500 dark:text-purple-200" aria-live="polite">
        {notice}
      </p>

      {/* RSVP */}
      <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-rose-100/70 bg-white/60 p-5 text-center shadow-xl backdrop-blur-md sm:p-8 dark:border-white/10 dark:bg-[#1a1b26]/60">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-rose-400 to-purple-400" />
        <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100">Send me a little note 💌</h3>
        <p className="mx-auto mb-5 mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
          Write anything you want. It pops up right in my WhatsApp, together with our plan.
        </p>
        {waBlocked && acceptHref && (
          <p className="mx-auto mb-4 max-w-md rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            WhatsApp didn&apos;t open by itself.{' '}
            <a href={acceptHref} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
              Tap here to send your yes
            </a>{' '}
            💕
          </p>
        )}
        <label htmlFor="rsvp-message" className="sr-only">
          Your message to me
        </label>
        <textarea
          id="rsvp-message"
          value={customMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          maxLength={600}
          placeholder="I can't wait! 🥰"
          className="mb-1 min-h-[120px] w-full resize-none rounded-2xl border border-rose-100 bg-white p-4 text-base text-gray-800 shadow-inner outline-none transition focus:ring-2 focus:ring-rose-400 sm:p-5 dark:border-white/10 dark:bg-black/40 dark:text-gray-200 dark:focus:ring-purple-400"
        />
        <p className="mb-4 text-right text-[11px] tabular-nums text-gray-400">{customMessage.length}/600</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsAppSent}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#1DA851] py-4 font-bold text-white shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:from-[#1DA851] hover:to-[#128C7E] hover:shadow-green-500/40 active:scale-[0.99]"
        >
          {waSent ? <Check className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
          {waSent ? 'Sent! Send another?' : 'Send to my WhatsApp'}
        </a>
        {waSent && <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">I&apos;m probably blushing right now 🙈</p>}
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onChangePlace}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-rose-500 hover:underline dark:text-gray-400 dark:hover:text-purple-200"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" /> Changed your mind? Pick another place
        </button>
      </div>
    </div>
  )
}
