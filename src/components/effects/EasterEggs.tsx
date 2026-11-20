'use client'

import { useEffect, useRef } from 'react'
import { useSiteConfig } from '@/lib/siteConfig'
import { fireworks, heartRain } from '@/lib/celebrate'
import { sfx } from '@/lib/sound'
import { toast } from './Toast'

/**
 * Little secrets for her to stumble on:
 *  - type one of her nicknames (e.g. "cutie") anywhere outside a text field → it rains hearts
 *  - type "iloveyou" → it rains hearts, and I love her more
 *  - type her name (when set in the site config) → a sweet reply
 *  - ↑ ↑ ↓ ↓ ← → ← → B A → fireworks and a secret message
 *  - glance at the clock at 11:11 → make a wish
 *
 * Words are ignored on game pages (the Secret Word game is literally typing
 * those words), but the arrow-key code works everywhere.
 */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const LOVE_WORDS = ['iloveyou', 'iloveu', 'iluvu']
const IDLE_RESET_MS = 2000
const COOLDOWN_MS = 2500
const WISH_KEY = 'birthday_wish_1111'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function lettersOnly(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

interface EasterEggsProps {
  inGame: boolean
}

export default function EasterEggs({ inGame }: EasterEggsProps) {
  const { config } = useSiteConfig()
  const inGameRef = useRef(inGame)

  useEffect(() => {
    inGameRef.current = inGame
  }, [inGame])

  // Typed words + the arrow-key code
  useEffect(() => {
    const nicknames = Array.from(new Set(config.nicknames.map(lettersOnly).filter((w) => w.length >= 3)))
    const herName = lettersOnly(config.herName)
    const displayName = config.herName.trim()

    let buffer = ''
    let konamiIndex = 0
    let idleTimer = 0
    let readyAt = 0

    const reset = () => {
      buffer = ''
      konamiIndex = 0
    }

    const trigger = (fn: () => void) => {
      const now = Date.now()
      if (now < readyAt) return
      readyAt = now + COOLDOWN_MS
      buffer = ''
      fn()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      if (isEditable(e.target)) return

      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(reset, IDLE_RESET_MS)

      // ↑↑↓↓←→←→BA
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === KONAMI[konamiIndex]) {
        konamiIndex += 1
        if (konamiIndex === KONAMI.length) {
          konamiIndex = 0
          trigger(() => {
            fireworks(3500)
            sfx.win()
            toast('Secret code accepted: you unlocked unlimited love. No refunds, no expiry.', { emoji: '🎆', duration: 5200 })
          })
          return
        }
      } else {
        konamiIndex = key === KONAMI[0] ? 1 : 0
      }

      if (inGameRef.current || !/^[a-z]$/i.test(e.key)) return
      buffer = (buffer + e.key.toLowerCase()).slice(-24)

      if (LOVE_WORDS.some((w) => buffer.endsWith(w))) {
        trigger(() => {
          heartRain()
          sfx.sparkle()
          toast('I love you more. Always have, always will.', { emoji: '💞', duration: 4200 })
        })
        return
      }

      if (herName.length >= 3 && buffer.endsWith(herName)) {
        trigger(() => {
          heartRain()
          sfx.chime()
          toast(`${displayName || capitalise(herName)}: my favourite word in every language`, { emoji: '💗', duration: 4200 })
        })
        return
      }

      const nick = nicknames.find((n) => buffer.endsWith(n))
      if (nick) {
        trigger(() => {
          heartRain()
          sfx.chime()
          toast(`Yes, ${nick}? I love you more`, { emoji: '🥺', duration: 4200 })
        })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(idleTimer)
    }
  }, [config.nicknames, config.herName])

  // 11:11 — make a wish (once per 11:11, morning or night)
  useEffect(() => {
    let shown = ''
    const check = () => {
      const now = new Date()
      if (now.getHours() % 12 !== 11 || now.getMinutes() !== 11) return
      const stamp = `${now.toDateString()}-${now.getHours()}`
      if (shown === stamp) return
      shown = stamp
      try {
        if (window.sessionStorage.getItem(WISH_KEY) === stamp) return
        window.sessionStorage.setItem(WISH_KEY, stamp)
      } catch {
        /* storage blocked: still show it */
      }
      sfx.sparkle()
      toast('It is 11:11. Make a wish… mine already came true.', { emoji: '🌠', duration: 6000 })
    }
    check()
    const id = window.setInterval(check, 20000)
    return () => window.clearInterval(id)
  }, [])

  return null
}
