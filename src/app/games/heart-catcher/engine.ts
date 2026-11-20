/**
 * Heart Catcher engine: game rules, input and the requestAnimationFrame loop.
 * React only creates it, feeds it size/theme changes and listens to the
 * callbacks (HUD at most ~8×/s, status changes, game over).
 */

import { haptic, sfx } from '@/lib/sound'
import {
  BASE_RADIUS,
  COLORS_GOLD,
  COLORS_HIT,
  COLORS_PHOTO,
  COLORS_PINK,
  COLORS_POWER,
  COLORS_RAIN,
  COMBO_STEP,
  ENDING_SECONDS,
  INVULN_SECONDS,
  MAGNET_SECONDS,
  MAX_LIVES,
  MAX_MULT,
  POINTS,
  SLOW_SECONDS,
  SPEED_FACTOR,
  comboMultiplier,
  createWorld,
  fallSpeedAt,
  isBad,
  isGood,
  isPower,
  maxObstaclesAt,
  obstacleChanceAt,
  rampOf,
  spawnIntervalAt,
  type Item,
  type ItemKind,
  type ParticleShape,
  type World,
} from './entities'
import { buildPhotoSprites, buildSprites, getPalette, readFontFamilies, type Palette, type Sprites } from './sprites'
import { bannerFont, buildFonts, renderWorld, type FontSet, type View } from './draw'

export type EngineStatus = 'ready' | 'playing' | 'paused' | 'over'

export interface HudState {
  score: number
  lives: number
  combo: number
  mult: number
}

export interface GameResult {
  score: number
  caught: number
  golden: number
  bestCombo: number
  seconds: number
  /** indexes (into the photo list given to loadPhotos) of photos caught, in order */
  photos: number[]
}

export interface EngineCallbacks {
  onHud: (hud: HudState) => void
  onStatus: (status: EngineStatus) => void
  onGameOver: (result: GameResult) => void
}

const TAU = Math.PI * 2
const HUD_INTERVAL_MS = 125
const DRAG_GAIN = 1.2
const MILESTONES = [25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000]

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function isActivatable(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('button, a, summary, [role="button"]'))
}

export class HeartCatcherEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly cb: EngineCallbacks
  private readonly world: World = createWorld()
  private readonly view: View = { dpr: 1, ox: 0, oy: 0 }
  private readonly families = readFontFamilies()
  private sprites: Sprites | null = null
  private pal: Palette = getPalette(false)
  private fonts: FontSet
  private status: EngineStatus = 'ready'
  private destroyed = false

  private raf = 0
  private last = 0
  private lastHudAt = 0
  private hudUrgent = false
  private readonly emitted: HudState = { score: -1, lives: -1, combo: -1, mult: -1 }

  // input
  private keyLeft = false
  private keyRight = false
  private inputMode: 'pointer' | 'keys' = 'pointer'
  private dragId = -1
  private dragAnchorX = 0
  private dragStartX = 0

  // spawning & progress
  private spawnTimer = 0
  private showerTimer = 0
  private lastPowerAt = 0
  private lastSpawnX = -1000
  private milestone = 0
  private level = 1
  private warnedObstacle = false
  private overflowTimer = 0
  private particleCursor = 0
  private textCursor = 0
  private popCursor = 0
  private pendingSound: 0 | 1 | 2 = 0
  private lastMatchSound = 0

  // stats for the result
  private caught = 0
  private golden = 0
  private photosCaught: number[] = []

  // photos
  private photoImgs: (HTMLImageElement | null)[] = []
  private readyPhotos: number[] = []
  private photoDeck: number[] = []

  private messages: string[] = ['Nice catch!', 'You are on fire!', 'My heart is all yours', 'Unstoppable!']
  private startHint = 'move the jar to catch the hearts'

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not supported')
    this.canvas = canvas
    this.ctx = ctx
    this.cb = callbacks
    this.fonts = buildFonts(this.families, 1)

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerUp)
    canvas.addEventListener('lostpointercapture', this.onPointerUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false })
    canvas.addEventListener('contextmenu', this.onContextMenu)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onWindowBlur)
  }

  /* ---------------------------------------------------------------- */
  /* Public API                                                         */
  /* ---------------------------------------------------------------- */

  getStatus(): EngineStatus {
    return this.status
  }

  /** Call with the container's CSS size (ResizeObserver). */
  resize(cssWidth: number, cssHeight: number): void {
    if (this.destroyed) return
    const W = Math.max(1, Math.floor(cssWidth))
    const H = Math.max(1, Math.floor(cssHeight))
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    const w = this.world
    if (W === w.W && H === w.H && dpr === w.dpr && this.sprites) return

    const oldW = w.W
    const oldH = w.H
    w.W = W
    w.H = H
    w.dpr = dpr
    this.view.dpr = dpr
    // quantised so small height changes (mobile URL bar) don't rebuild everything at a new size
    w.unit = Math.round(clamp(Math.min(W / 420, H / 480), 0.6, 1.3) * 50) / 50
    w.hu = clamp(w.unit, 0.85, 1.15)
    const p = w.player
    p.w = 80 * w.unit
    p.h = 72 * w.unit
    w.groundY = H - 12 * w.unit

    this.canvas.width = Math.round(W * dpr)
    this.canvas.height = Math.round(H * dpr)

    if (oldW > 0 && oldH > 0) {
      const sx = W / oldW
      const sy = H / oldH
      p.x *= sx
      p.targetX *= sx
      p.vx *= sx
      for (const it of w.items) {
        if (!it.active) continue
        it.bx *= sx
        it.x *= sx
        it.y *= sy
        it.vy *= sy
        it.r = BASE_RADIUS[it.kind] * w.unit
      }
      for (const pt of w.particles) {
        pt.x *= sx
        pt.y *= sy
      }
      for (const t of w.texts) {
        t.x *= sx
        t.y *= sy
      }
      for (const pop of w.pops) {
        pop.x *= sx
        pop.y *= sy
      }
    } else {
      p.x = W / 2
      p.targetX = W / 2
    }
    const half = p.w / 2 + 4
    p.x = clamp(p.x, half, Math.max(half, W - half))
    p.targetX = clamp(p.targetX, half, Math.max(half, W - half))

    this.fonts = buildFonts(this.families, w.hu)
    this.rebuildSprites()
    this.render()
  }

  setTheme(dark: boolean): void {
    if (this.destroyed || (dark === this.world.dark && this.sprites)) return
    this.world.dark = dark
    this.pal = getPalette(dark)
    if (this.world.W > 0) {
      this.rebuildSprites()
      this.render()
    }
  }

  setReducedMotion(reduced: boolean): void {
    this.world.reduced = reduced
  }

  /** Milestone banners (score 25, 50, 100…) cycle through these. */
  setMessages(messages: string[], startHint?: string): void {
    if (messages.length > 0) this.messages = messages
    if (startHint) this.startHint = startHint
  }

  /** Preloads photo thumbnails; each becomes a "memory bubble" as soon as it decodes. */
  loadPhotos(urls: string[]): void {
    this.photoImgs = urls.map(() => null)
    this.readyPhotos = []
    this.photoDeck = []
    urls.forEach((url, index) => {
      const img = new Image()
      img.decoding = 'async'
      const done = () => {
        if (this.destroyed || this.photoImgs.length !== urls.length) return
        this.addPhoto(index, img)
      }
      img.onload = () => {
        if (typeof img.decode === 'function') img.decode().then(done, done)
        else done()
      }
      img.onerror = () => {
        /* skip photos that fail to load */
      }
      img.src = url
    })
  }

  start(): void {
    if (this.destroyed || this.world.W === 0) return
    this.reset()
    this.status = 'playing'
    this.world.hud = true
    this.showBanner('Catch my love!', this.startHint, 2.2)
    this.cb.onStatus('playing')
    this.emitHud(true)
    this.startLoop()
  }

  pause(): void {
    if (this.status !== 'playing' || this.world.ending >= 0) return
    this.status = 'paused'
    this.stopLoop()
    this.releaseInput()
    this.render()
    this.emitHud(true)
    this.cb.onStatus('paused')
  }

  resume(): void {
    if (this.status !== 'paused' || this.destroyed) return
    this.status = 'playing'
    this.cb.onStatus('playing')
    this.startLoop()
  }

  togglePause(): void {
    if (this.status === 'playing') this.pause()
    else if (this.status === 'paused') this.resume()
  }

  destroy(): void {
    this.destroyed = true
    this.stopLoop()
    const c = this.canvas
    c.removeEventListener('pointerdown', this.onPointerDown)
    c.removeEventListener('pointermove', this.onPointerMove)
    c.removeEventListener('pointerup', this.onPointerUp)
    c.removeEventListener('pointercancel', this.onPointerUp)
    c.removeEventListener('lostpointercapture', this.onPointerUp)
    c.removeEventListener('wheel', this.onWheel)
    c.removeEventListener('touchmove', this.onTouchMove)
    c.removeEventListener('contextmenu', this.onContextMenu)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onWindowBlur)
    this.photoImgs = []
    this.sprites = null
  }

  /* ---------------------------------------------------------------- */
  /* Loop                                                               */
  /* ---------------------------------------------------------------- */

  private startLoop(): void {
    this.stopLoop()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame = (now: number): void => {
    this.raf = 0
    if (this.status !== 'playing' || this.destroyed) return
    let dt = (now - this.last) / 1000
    this.last = now
    if (!(dt > 0)) dt = 0
    if (dt > 0.05) dt = 0.05
    this.update(dt)
    if (this.status !== 'playing') return
    this.render()
    if (this.hudUrgent || now - this.lastHudAt >= HUD_INTERVAL_MS) this.emitHud(false)
    this.raf = requestAnimationFrame(this.frame)
  }

  private render(): void {
    if (this.sprites && this.world.W > 0) renderWorld(this.ctx, this.world, this.sprites, this.pal, this.fonts, this.view)
  }

  private emitHud(force: boolean): void {
    const w = this.world
    const e = this.emitted
    this.lastHudAt = performance.now()
    this.hudUrgent = false
    if (!force && e.score === w.score && e.lives === w.lives && e.combo === w.combo && e.mult === w.mult) return
    e.score = w.score
    e.lives = w.lives
    e.combo = w.combo
    e.mult = w.mult
    this.cb.onHud({ score: w.score, lives: w.lives, combo: w.combo, mult: w.mult })
  }

  private rebuildSprites(): void {
    const w = this.world
    if (w.W === 0) return
    const sprites = buildSprites(this.ctx, w.W, w.H, w.unit, w.hu, w.dpr, w.player.w, w.player.h, w.dark)
    for (let i = 0; i < this.photoImgs.length; i++) {
      const img = this.photoImgs[i]
      if (!img) continue
      const ps = buildPhotoSprites(img, w.unit, w.dpr)
      sprites.photos[i] = ps ? ps.bubble : null
      sprites.polaroids[i] = ps ? ps.polaroid : null
    }
    this.sprites = sprites
  }

  private addPhoto(index: number, img: HTMLImageElement): void {
    if (!img.naturalWidth || !img.naturalHeight) return
    this.photoImgs[index] = img
    const w = this.world
    if (this.sprites && w.W > 0) {
      const ps = buildPhotoSprites(img, w.unit, w.dpr)
      if (!ps) return
      this.sprites.photos[index] = ps.bubble
      this.sprites.polaroids[index] = ps.polaroid
    }
    if (!this.readyPhotos.includes(index)) this.readyPhotos.push(index)
  }

  private nextPhoto(): number {
    if (this.photoDeck.length === 0) {
      const deck = this.readyPhotos.slice()
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = deck[i]
        deck[i] = deck[j]
        deck[j] = tmp
      }
      this.photoDeck = deck
    }
    return this.photoDeck.pop() ?? -1
  }

  /* ---------------------------------------------------------------- */
  /* Game rules                                                         */
  /* ---------------------------------------------------------------- */

  private reset(): void {
    const w = this.world
    for (const it of w.items) it.active = false
    for (const p of w.particles) p.active = false
    for (const t of w.texts) t.active = false
    for (const pop of w.pops) pop.active = false
    w.banner.active = false
    w.score = 0
    w.lives = MAX_LIVES
    w.combo = 0
    w.mult = 1
    w.bestCombo = 0
    w.liquid = 0
    w.magnet = 0
    w.slow = 0
    w.timeScale = 1
    w.shake = 0
    w.flash = 0
    w.comboPulse = 0
    w.ending = -1
    w.playTime = 0
    w.scoreText = '0'
    w.multText = '×1'
    w.comboText = ''
    const p = w.player
    p.x = w.W / 2
    p.targetX = p.x
    p.vx = 0
    p.squash = 0
    p.squashV = 0
    p.lean = 0
    p.invuln = 0
    p.glow = 0
    this.spawnTimer = 0.7
    this.showerTimer = 18 + Math.random() * 6
    this.lastPowerAt = 0
    this.lastSpawnX = -1000
    this.milestone = 0
    this.level = 1
    this.warnedObstacle = false
    this.overflowTimer = 0
    this.pendingSound = 0
    this.caught = 0
    this.golden = 0
    this.photosCaught = []
    this.releaseInput()
    this.inputMode = 'pointer'
  }

  private update(dt: number): void {
    const w = this.world
    w.time += dt

    if (w.ending >= 0) {
      w.ending -= dt
      w.timeScale += (0.25 - w.timeScale) * Math.min(1, dt * 4)
      this.updateItems(dt * w.timeScale, false)
      this.updateEffects(dt)
      this.updateSpring(dt)
      if (w.ending <= 0) this.finish()
      return
    }

    w.playTime += dt
    if (w.magnet > 0) w.magnet = Math.max(0, w.magnet - dt)
    if (w.slow > 0) w.slow = Math.max(0, w.slow - dt)
    const targetScale = w.slow > 0 ? 0.5 : 1
    w.timeScale += (targetScale - w.timeScale) * Math.min(1, dt * 6)
    const gdt = dt * w.timeScale

    this.updatePlayer(dt)
    this.updateSpawns(gdt)
    this.updateItems(gdt, true)
    this.updateEffects(dt)
    this.updateProgress()
    this.flushSounds()
  }

  private updatePlayer(dt: number): void {
    const w = this.world
    const p = w.player
    const maxSpeed = w.W * 1.35
    const min = p.w / 2 + 4
    const max = Math.max(min, w.W - p.w / 2 - 4)

    if (this.inputMode === 'keys') {
      const dir = (this.keyRight ? 1 : 0) - (this.keyLeft ? 1 : 0)
      if (dir !== 0) {
        // turning around is snappier than speeding up
        const accel = maxSpeed * (p.vx * dir < 0 ? 16 : 9)
        p.vx = clamp(p.vx + dir * accel * dt, -maxSpeed, maxSpeed)
      } else {
        const dec = maxSpeed * 10 * dt
        p.vx = Math.abs(p.vx) <= dec ? 0 : p.vx - Math.sign(p.vx) * dec
      }
      p.x += p.vx * dt
      if (p.x < min) {
        p.x = min
        p.vx = 0
      } else if (p.x > max) {
        p.x = max
        p.vx = 0
      }
      p.targetX = p.x
    } else {
      const prev = p.x
      const tx = clamp(p.targetX, min, max)
      p.x += (tx - p.x) * (1 - Math.exp(-dt * 24))
      p.vx = dt > 0 ? (p.x - prev) / dt : 0
    }

    const leanTarget = clamp(p.vx / maxSpeed, -1, 1) * (w.reduced ? 0.06 : 0.16)
    p.lean += (leanTarget - p.lean) * Math.min(1, dt * 12)
    p.invuln = Math.max(0, p.invuln - dt)
    p.glow = Math.max(0, p.glow - dt * 2.4)
    this.updateSpring(dt)
  }

  /** Squash & stretch spring for the jar. */
  private updateSpring(dt: number): void {
    const p = this.world.player
    const acc = -280 * p.squash - 15 * p.squashV
    p.squashV += acc * dt
    p.squash = clamp(p.squash + p.squashV * dt, -0.6, 0.6)
    if (Math.abs(p.squash) < 0.0005 && Math.abs(p.squashV) < 0.005) {
      p.squash = 0
      p.squashV = 0
    }
  }

  private updateSpawns(gdt: number): void {
    const w = this.world
    const ramp = rampOf(w.playTime)
    this.spawnTimer -= gdt
    if (this.spawnTimer <= 0) {
      this.spawnRandom(ramp)
      this.spawnTimer += spawnIntervalAt(ramp) * (0.75 + Math.random() * 0.5)
      if (this.spawnTimer < 0.05) this.spawnTimer = 0.05
    }
    this.showerTimer -= gdt
    if (this.showerTimer <= 0) {
      this.spawnShower(ramp)
      this.showerTimer = 26 + Math.random() * 10
    }
  }

  private countBad(): number {
    let n = 0
    const items = this.world.items
    for (let i = 0; i < items.length; i++) if (items[i].active && isBad(items[i].kind)) n++
    return n
  }

  private spawnRandom(ramp: number): void {
    const w = this.world
    const t = w.playTime
    let kind: ItemKind = 'heart'
    if (Math.random() < obstacleChanceAt(t, ramp) && this.countBad() < maxObstaclesAt(t)) {
      kind = Math.random() < 0.6 ? 'broken' : 'cloud'
    } else {
      const roll = Math.random()
      if (t > 6 && t - this.lastPowerAt > 11 && roll < 0.05) {
        if (w.lives < MAX_LIVES && t > 25 && Math.random() < 0.35) kind = 'life'
        else kind = Math.random() < 0.5 ? 'magnet' : 'slow'
        if (kind === 'magnet' && w.magnet > 0) kind = w.slow > 0 ? 'heart' : 'slow'
        else if (kind === 'slow' && w.slow > 0) kind = w.magnet > 0 ? 'heart' : 'magnet'
        this.lastPowerAt = t
      } else if (roll < 0.105) {
        kind = 'gold'
      } else if (roll < 0.21 && this.readyPhotos.length > 0) {
        kind = 'photo'
      }
    }
    this.spawnItem(kind, -1, 0, ramp)
  }

  /** A diagonal ribbon of hearts with a golden one tucked in. */
  private spawnShower(ramp: number): void {
    const w = this.world
    const n = 8
    const dir = Math.random() < 0.5 ? 1 : -1
    const r = BASE_RADIUS.heart * w.unit
    const margin = r * 1.5 + 10
    const speed = w.H * fallSpeedAt(ramp) * 0.95
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1)
      const x = margin + (dir > 0 ? f : 1 - f) * Math.max(0, w.W - margin * 2)
      const it = this.spawnItem(i === n - 3 ? 'gold' : 'heart', x, i * r * 2.6, ramp)
      if (it) {
        it.swayAmp = 0
        it.vy = speed * (i === n - 3 ? 1.05 : 1)
      }
    }
    this.spawnTimer = Math.max(this.spawnTimer, 1.4)
    this.showBanner('Love shower!', 'catch them all', 1.6)
  }

  private obtainItem(): Item | null {
    const items = this.world.items
    for (let i = 0; i < items.length; i++) if (!items[i].active) return items[i]
    return null
  }

  private spawnItem(kind: ItemKind, x: number, yOffset: number, ramp: number): Item | null {
    const w = this.world
    if (kind === 'photo' && this.readyPhotos.length === 0) kind = 'heart'
    const it = this.obtainItem()
    if (!it) return null
    const u = w.unit
    const r = BASE_RADIUS[kind] * u
    const sway =
      kind === 'cloud' ? (14 + Math.random() * 22) * u : isBad(kind) ? (2 + Math.random() * 6) * u : (3 + Math.random() * 9) * u
    const margin = Math.min(w.W / 2, r * (kind === 'cloud' ? 1.5 : 1.15) + sway + 4)
    const span = Math.max(0, w.W - margin * 2)
    let bx = x >= 0 ? x : margin + Math.random() * span
    if (x < 0 && Math.abs(bx - this.lastSpawnX) < r * 2.2) bx = margin + Math.random() * span
    bx = clamp(bx, margin, w.W - margin)
    if (x < 0) this.lastSpawnX = bx

    it.active = true
    it.kind = kind
    it.bx = bx
    it.x = bx
    it.r = r
    it.y = -r * 1.6 - yOffset
    it.vy = w.H * fallSpeedAt(ramp) * (0.88 + Math.random() * 0.24) * SPEED_FACTOR[kind]
    it.rot = (Math.random() - 0.5) * 0.5
    it.spin = kind === 'cloud' ? 0 : kind === 'photo' ? (Math.random() - 0.5) * 0.6 : (Math.random() - 0.5) * 1.6
    it.phase = Math.random() * TAU
    it.swayAmp = sway
    it.swaySpeed = 1.1 + Math.random() * 1.3
    it.photo = kind === 'photo' ? this.nextPhoto() : -1
    it.age = 0
    it.trail = 0
    if (kind === 'photo' && it.photo < 0) {
      it.kind = 'heart'
      it.r = BASE_RADIUS.heart * u
    }

    if (isBad(kind) && !this.warnedObstacle) {
      this.warnedObstacle = true
      if (!w.banner.active) this.showBanner('Watch out!', 'dodge broken hearts & rain clouds', 1.8)
    }
    return it
  }

  private updateItems(gdt: number, live: boolean): void {
    const w = this.world
    const p = w.player
    const items = w.items
    const mouthY = w.groundY - p.h
    const half = p.w / 2
    const magnetOn = live && w.magnet > 0
    const u = w.unit

    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.active) continue
      it.age += gdt
      const good = isGood(it.kind)
      const friendly = good || isPower(it.kind)

      if (magnetOn && friendly && it.y < mouthY + p.h * 0.3) {
        const dx = p.x - it.bx
        const pull = 1 - Math.min(1, Math.abs(dx) / (w.W * 0.75))
        it.bx += dx * Math.min(1, gdt * (2 + 5 * pull))
        it.swayAmp -= it.swayAmp * Math.min(1, gdt * 4)
        it.y += it.vy * 0.35 * gdt
        it.trail -= gdt
        if (it.trail <= 0) {
          it.trail = 0.09
          this.emit(it.x, it.y, (Math.random() - 0.5) * 30 * u, -20 * u, 4, 2, 0.45, 9 * u, 0)
        }
      } else if (it.kind === 'gold') {
        it.trail -= gdt
        if (it.trail <= 0) {
          it.trail = 0.07
          this.emit(it.x + (Math.random() - 0.5) * it.r, it.y - it.r * 0.3, (Math.random() - 0.5) * 20 * u, -30 * u, 4, 2, 0.5, 8 * u, 0)
        }
      }

      it.y += it.vy * gdt
      it.phase += it.swaySpeed * gdt
      it.x = clamp(it.bx + Math.sin(it.phase) * it.swayAmp, it.r * 0.6, w.W - it.r * 0.6)
      it.rot += it.spin * gdt

      if (live) {
        if (friendly) {
          if (it.y + it.r * 0.45 >= mouthY && it.y - it.r <= mouthY + p.h * 0.45 && Math.abs(it.x - p.x) <= half + it.r * 0.35) {
            this.catchItem(it)
            continue
          }
        } else {
          // obstacle vs. the jar body, a little forgiving
          const cx = clamp(it.x, p.x - half * 0.82, p.x + half * 0.82)
          const cy = clamp(it.y, mouthY + p.h * 0.1, w.groundY)
          const dx = it.x - cx
          const dy = it.y - cy
          const rr = it.r * (it.kind === 'cloud' ? 0.68 : 0.72)
          if (dx * dx + dy * dy < rr * rr) {
            this.hitBy(it)
            continue
          }
        }
      }

      if (it.y - it.r * 1.6 > w.H) {
        it.active = false
        if (live && good) this.breakCombo(it.x)
      }
    }
  }

  private catchItem(it: Item): void {
    const w = this.world
    const p = w.player
    const pal = this.pal
    const u = w.unit
    const k = it.kind
    it.active = false
    const cx = it.x
    const cy = Math.min(it.y, w.groundY - p.h)
    p.squashV += w.reduced ? 3 : 7.5
    p.glow = 1

    if (isGood(k)) {
      w.combo++
      if (w.combo > w.bestCombo) w.bestCombo = w.combo
      const mult = comboMultiplier(w.combo)
      if (mult !== w.mult) {
        const up = mult > w.mult
        w.mult = mult
        w.multText = `×${mult}`
        if (up) {
          w.comboPulse = 1
          this.addText(p.x, w.groundY - p.h - 44 * u, mult >= MAX_MULT ? `Max combo ×${mult}!` : `Combo ×${mult}!`, pal.goldText, true)
          this.burst(p.x, w.groundY - p.h, COLORS_GOLD, w.reduced ? 6 : 16, 1.1)
          this.pendingSound = 2
        }
      }
      w.comboText = `${w.combo} in a row`
      const pts = POINTS[k] * w.mult
      w.score += pts
      w.scoreText = String(w.score)
      this.caught++
      const color = k === 'gold' ? pal.goldText : k === 'photo' ? pal.photoText : pal.heartText
      this.addText(cx, cy - 10 * u, `+${pts}`, color, k !== 'heart')
      if (k === 'gold') {
        this.golden++
        this.burst(cx, cy, COLORS_GOLD, w.reduced ? 10 : 24, 1.3)
        haptic(12)
      } else if (k === 'photo') {
        this.photosCaught.push(it.photo)
        this.burst(cx, cy, COLORS_PHOTO, w.reduced ? 8 : 16, 1.1)
        this.popPhoto(it.photo, cx, cy)
      } else {
        this.burst(cx, cy, COLORS_PINK, w.reduced ? 6 : 12, 1)
      }
      if (this.pendingSound === 0) this.pendingSound = 1
      return
    }

    // power-ups
    if (k === 'magnet') {
      w.magnet = MAGNET_SECONDS
      this.addText(cx, cy - 12 * u, 'Magnet!', pal.goldText, true)
    } else if (k === 'slow') {
      w.slow = SLOW_SECONDS
      this.addText(cx, cy - 12 * u, 'Slow-mo', pal.powerText, true)
    } else if (k === 'life') {
      w.lives = Math.min(MAX_LIVES, w.lives + 1)
      this.hudUrgent = true
      this.addText(cx, cy - 12 * u, '+1 life', pal.heartText, true)
    }
    this.burst(cx, cy, COLORS_POWER, w.reduced ? 10 : 22, 1.25)
    this.pendingSound = 2
    haptic(15)
  }

  private hitBy(it: Item): void {
    const w = this.world
    const p = w.player
    it.active = false
    this.burst(it.x, it.y, it.kind === 'cloud' ? COLORS_RAIN : COLORS_HIT, w.reduced ? 6 : 14, 0.9)
    if (p.invuln > 0) return

    w.lives = Math.max(0, w.lives - 1)
    this.hudUrgent = true
    w.combo = 0
    w.mult = 1
    w.multText = '×1'
    w.comboText = ''
    p.invuln = INVULN_SECONDS
    p.squashV -= w.reduced ? 2 : 6
    w.shake = w.reduced ? 0 : 0.35
    w.flash = 1
    this.addText(p.x, w.groundY - p.h - 22 * w.unit, w.lives > 0 ? 'Ouch!' : 'Oh no…', this.pal.hitText, true)
    sfx.miss()
    haptic(w.lives > 0 ? 60 : [80, 60, 120])
    if (w.lives <= 0) this.beginEnding()
  }

  private breakCombo(x: number): void {
    const w = this.world
    if (w.combo >= COMBO_STEP) {
      this.addText(clamp(x, 50, w.W - 50), w.groundY - 30 * w.unit, 'combo lost', this.pal.mutedText, false)
    }
    w.combo = 0
    w.mult = 1
    w.multText = '×1'
    w.comboText = ''
  }

  private beginEnding(): void {
    const w = this.world
    const p = w.player
    w.ending = ENDING_SECONDS
    w.magnet = 0
    w.slow = 0
    this.releaseInput()
    this.burst(p.x, w.groundY - p.h * 0.5, COLORS_PINK, w.reduced ? 12 : 36, 1.6)
    this.showBanner('Game over', `${w.score} ${w.score === 1 ? 'point' : 'points'} of love`, ENDING_SECONDS + 0.6)
  }

  private finish(): void {
    const w = this.world
    w.ending = 0
    w.magnet = 0
    w.slow = 0
    this.status = 'over'
    this.stopLoop()
    // freeze the banner fully visible on the final frame
    if (w.banner.active) w.banner.life = Math.max(w.banner.life, 0.5)
    this.render()
    this.emitHud(true)
    this.cb.onStatus('over')
    this.cb.onGameOver({
      score: w.score,
      caught: this.caught,
      golden: this.golden,
      bestCombo: w.bestCombo,
      seconds: Math.round(w.playTime),
      photos: this.photosCaught.slice(),
    })
  }

  private updateProgress(): void {
    const w = this.world
    if (this.milestone < MILESTONES.length && w.score >= MILESTONES[this.milestone]) {
      const reached = MILESTONES[this.milestone]
      const msg = this.messages[this.milestone % this.messages.length]
      this.milestone++
      this.showBanner(msg, `${reached} points!`, 2)
      this.pendingSound = 2
    }
    const level = 1 + Math.floor(w.playTime / 30)
    if (level > this.level) {
      this.level = level
      if (!w.banner.active) this.showBanner(`Level ${level}`, 'the hearts fall a little faster', 1.6)
    }
  }

  private updateEffects(dt: number): void {
    const w = this.world
    const u = w.unit
    w.bgScroll += dt * 16 * u * w.timeScale * (w.reduced ? 0.35 : 1)
    if (w.bgScroll > 1e6) w.bgScroll = 0

    const damp = Math.exp(-dt * 2.2)
    const ps = w.particles
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i]
      if (!p.active) continue
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        continue
      }
      p.vx *= damp
      p.vy = p.vy * damp + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
    }

    const textDamp = Math.exp(-dt * 2.5)
    const texts = w.texts
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i]
      if (!t.active) continue
      t.life -= dt
      if (t.life <= 0) {
        t.active = false
        continue
      }
      t.y += t.vy * dt
      t.vy *= textDamp
    }

    const pops = w.pops
    for (let i = 0; i < pops.length; i++) {
      const pop = pops[i]
      if (!pop.active) continue
      pop.life -= dt
      if (pop.life <= 0) pop.active = false
    }

    const b = w.banner
    if (b.active) {
      b.life -= dt
      if (b.life <= 0) b.active = false
    }

    w.shake = Math.max(0, w.shake - dt)
    w.flash = Math.max(0, w.flash - dt * 2.2)
    w.comboPulse = Math.max(0, w.comboPulse - dt * 3)
    const liquidTarget = Math.min(1, w.combo / (COMBO_STEP * (MAX_MULT - 1)))
    w.liquid += (liquidTarget - w.liquid) * Math.min(1, dt * 5)

    // the jar overflows with sparkles at max combo
    if (w.mult >= MAX_MULT && w.ending < 0) {
      this.overflowTimer -= dt
      if (this.overflowTimer <= 0) {
        this.overflowTimer = w.reduced ? 0.3 : 0.11
        const p = w.player
        this.emit(p.x + (Math.random() - 0.5) * p.w * 0.6, w.groundY - p.h, (Math.random() - 0.5) * 50 * u, -(70 + Math.random() * 60) * u, Math.random() < 0.5 ? 4 : 0, Math.random() < 0.5 ? 2 : 1, 0.7, 9 * u, 120 * u)
      }
    }
  }

  private flushSounds(): void {
    if (this.pendingSound === 2) {
      sfx.sparkle()
    } else if (this.pendingSound === 1) {
      const now = this.world.time
      if (now - this.lastMatchSound > 0.06) {
        this.lastMatchSound = now
        sfx.match()
      }
    }
    this.pendingSound = 0
  }

  /* ---------------------------------------------------------------- */
  /* Effects                                                            */
  /* ---------------------------------------------------------------- */

  private emit(x: number, y: number, vx: number, vy: number, color: number, shape: ParticleShape, life: number, size: number, gravity: number): void {
    const ps = this.world.particles
    let p = ps[this.particleCursor]
    for (let n = 0; n < ps.length; n++) {
      this.particleCursor = (this.particleCursor + 1) % ps.length
      const candidate = ps[this.particleCursor]
      if (!candidate.active) {
        p = candidate
        break
      }
    }
    p.active = true
    p.x = x
    p.y = y
    p.vx = vx
    p.vy = vy
    p.life = life
    p.max = life
    p.size = size
    p.color = color
    p.shape = shape
    p.rot = Math.random() * TAU
    p.spin = (Math.random() - 0.5) * 6
    p.gravity = gravity
  }

  private burst(x: number, y: number, colors: readonly number[], count: number, power: number): void {
    const u = this.world.unit
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU
      const speed = (60 + Math.random() * 170) * u * power
      const shape: ParticleShape = i % 3 === 0 ? 1 : i % 3 === 1 ? 0 : 2
      this.emit(
        x,
        y,
        Math.cos(a) * speed,
        Math.sin(a) * speed - 70 * u * power,
        colors[i % colors.length],
        shape,
        0.5 + Math.random() * 0.5,
        (shape === 1 ? 10 : 8) * u * (0.7 + Math.random() * 0.6),
        300 * u,
      )
    }
  }

  private addText(x: number, y: number, text: string, color: string, big: boolean): void {
    const w = this.world
    const texts = w.texts
    let t = texts[this.textCursor]
    for (let n = 0; n < texts.length; n++) {
      this.textCursor = (this.textCursor + 1) % texts.length
      if (!texts[this.textCursor].active) {
        t = texts[this.textCursor]
        break
      }
    }
    t.active = true
    t.x = clamp(x, 36, w.W - 36)
    t.y = y
    t.vy = -75 * w.unit
    t.life = big ? 1.1 : 0.85
    t.max = t.life
    t.text = text
    t.color = color
    t.big = big
  }

  private popPhoto(photo: number, x: number, y: number): void {
    if (photo < 0) return
    const w = this.world
    const pops = w.pops
    this.popCursor = (this.popCursor + 1) % pops.length
    const pop = pops[this.popCursor]
    pop.active = true
    pop.photo = photo
    pop.x = x
    pop.y = y - 10 * w.unit
    pop.dx = (x < w.W / 2 ? 1 : -1) * (30 + Math.random() * 30) * w.unit
    pop.dy = -w.H * 0.24
    pop.rot = (Math.random() - 0.5) * 0.6
    pop.life = 1.5
    pop.max = 1.5
  }

  private showBanner(text: string, sub: string, seconds: number): void {
    const w = this.world
    const b = w.banner
    let size = this.fonts.bannerSize
    this.ctx.font = bannerFont(this.fonts, size)
    const width = this.ctx.measureText(text).width
    const maxW = w.W * 0.86
    if (width > maxW && width > 0) size = Math.max(14, Math.floor((size * maxW) / width))
    b.active = true
    b.text = text
    b.sub = sub
    b.life = seconds
    b.max = seconds
    b.font = bannerFont(this.fonts, size)
  }

  /* ---------------------------------------------------------------- */
  /* Input                                                              */
  /* ---------------------------------------------------------------- */

  private releaseInput(): void {
    this.keyLeft = false
    this.keyRight = false
    if (this.dragId !== -1) {
      try {
        if (this.canvas.hasPointerCapture(this.dragId)) this.canvas.releasePointerCapture(this.dragId)
      } catch {
        /* ignore */
      }
    }
    this.dragId = -1
  }

  private moveBounds(): [number, number] {
    const w = this.world
    const min = w.player.w / 2 + 4
    return [min, Math.max(min, w.W - w.player.w / 2 - 4)]
  }

  private directMove(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width <= 0) return
    const x = ((e.clientX - rect.left) * this.world.W) / rect.width
    const [min, max] = this.moveBounds()
    this.world.player.targetX = clamp(x, min, max)
    this.inputMode = 'pointer'
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.status !== 'playing' || this.world.ending >= 0) return
    e.preventDefault()
    if (e.pointerType === 'touch') {
      if (this.dragId !== -1) return
      const p = this.world.player
      this.dragId = e.pointerId
      this.dragAnchorX = e.clientX
      p.targetX = p.x
      this.dragStartX = p.x
      this.inputMode = 'pointer'
      try {
        this.canvas.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    } else {
      this.directMove(e)
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (this.status !== 'playing' || this.world.ending >= 0) return
    if (e.pointerType !== 'touch') {
      this.directMove(e)
      return
    }
    if (e.pointerId !== this.dragId) return
    const [min, max] = this.moveBounds()
    let target = this.dragStartX + (e.clientX - this.dragAnchorX) * DRAG_GAIN
    // re-anchor at the walls so reversing direction responds immediately
    if (target < min) {
      this.dragAnchorX = e.clientX - (min - this.dragStartX) / DRAG_GAIN
      target = min
    } else if (target > max) {
      this.dragAnchorX = e.clientX - (max - this.dragStartX) / DRAG_GAIN
      target = max
    }
    this.world.player.targetX = target
    this.inputMode = 'pointer'
  }

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.dragId) return
    this.dragId = -1
    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  private onWheel = (e: WheelEvent): void => {
    if (this.status === 'playing') e.preventDefault()
  }

  private onTouchMove = (e: TouchEvent): void => {
    if (this.status === 'playing' && e.cancelable) e.preventDefault()
  }

  private onContextMenu = (e: Event): void => {
    if (this.status === 'playing') e.preventDefault()
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (this.status !== 'playing' || isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keyLeft = true
        this.inputMode = 'keys'
        e.preventDefault()
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keyRight = true
        this.inputMode = 'keys'
        e.preventDefault()
        break
      case 'ArrowUp':
      case 'ArrowDown':
      case ' ':
      case 'PageUp':
      case 'PageDown':
        // keep the page still while playing (but let Space press a focused button, e.g. Pause)
        if (!isActivatable(e.target)) e.preventDefault()
        break
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keyLeft = false
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keyRight = false
        break
    }
  }

  private onWindowBlur = (): void => {
    this.keyLeft = false
    this.keyRight = false
  }
}
