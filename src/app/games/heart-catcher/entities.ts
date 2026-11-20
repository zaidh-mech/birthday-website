/**
 * Heart Catcher: plain data types, object pools and tuning constants.
 * Nothing in here touches the DOM, so the engine can reuse every object
 * instead of allocating in the hot loop.
 */

export type ItemKind = 'heart' | 'gold' | 'photo' | 'magnet' | 'slow' | 'life' | 'broken' | 'cloud'

export interface Item {
  active: boolean
  kind: ItemKind
  /** x before sway is applied */
  bx: number
  x: number
  y: number
  /** fall speed, px per second */
  vy: number
  r: number
  rot: number
  spin: number
  phase: number
  swayAmp: number
  swaySpeed: number
  /** index into the loaded photo list, -1 when not a photo */
  photo: number
  age: number
  /** countdown until the next sparkle of a glittery trail */
  trail: number
}

/** Base radius in "unit" pixels (multiplied by world.unit). */
export const BASE_RADIUS: Record<ItemKind, number> = {
  heart: 19,
  gold: 20,
  photo: 25,
  magnet: 20,
  slow: 20,
  life: 20,
  broken: 19,
  cloud: 22,
}

export const SPEED_FACTOR: Record<ItemKind, number> = {
  heart: 1,
  gold: 1.18,
  photo: 0.92,
  magnet: 0.85,
  slow: 0.85,
  life: 0.85,
  broken: 1.04,
  cloud: 0.82,
}

export const POINTS: Record<ItemKind, number> = {
  heart: 1,
  gold: 5,
  photo: 3,
  magnet: 0,
  slow: 0,
  life: 0,
  broken: 0,
  cloud: 0,
}

export function isGood(kind: ItemKind): boolean {
  return kind === 'heart' || kind === 'gold' || kind === 'photo'
}

export function isBad(kind: ItemKind): boolean {
  return kind === 'broken' || kind === 'cloud'
}

export function isPower(kind: ItemKind): boolean {
  return kind === 'magnet' || kind === 'slow' || kind === 'life'
}

export const MAGNET_SECONDS = 6
export const SLOW_SECONDS = 5
export const MAX_LIVES = 3
export const MAX_MULT = 5
/** Consecutive catches needed per multiplier step (x2 after 5, x3 after 10...). */
export const COMBO_STEP = 5
export const INVULN_SECONDS = 1.4
export const ENDING_SECONDS = 1.25

export function comboMultiplier(combo: number): number {
  return Math.min(MAX_MULT, 1 + Math.floor(combo / COMBO_STEP))
}

/** 0 → 1 over the first couple of minutes, then keeps creeping towards 1. */
export function rampOf(playSeconds: number): number {
  return 1 - Math.exp(-playSeconds / 75)
}

/** Seconds between random spawns. */
export function spawnIntervalAt(ramp: number): number {
  return 0.9 - 0.58 * ramp
}

/** Fall speed in canvas-heights per second. */
export function fallSpeedAt(ramp: number): number {
  return 0.3 + 0.48 * ramp
}

export function obstacleChanceAt(playSeconds: number, ramp: number): number {
  return playSeconds < 4 ? 0 : 0.1 + 0.26 * ramp
}

export function maxObstaclesAt(playSeconds: number): number {
  return Math.min(5, 1 + Math.floor(playSeconds / 22))
}

export function createItems(count: number): Item[] {
  const list: Item[] = []
  for (let i = 0; i < count; i++) {
    list.push({
      active: false,
      kind: 'heart',
      bx: 0,
      x: 0,
      y: 0,
      vy: 0,
      r: 0,
      rot: 0,
      spin: 0,
      phase: 0,
      swayAmp: 0,
      swaySpeed: 0,
      photo: -1,
      age: 0,
      trail: 0,
    })
  }
  return list
}

/* ------------------------------------------------------------------ */
/* Particles                                                            */
/* ------------------------------------------------------------------ */

/** Shapes: 0 = soft dot, 1 = tiny heart, 2 = sparkle */
export type ParticleShape = 0 | 1 | 2

export interface Particle {
  active: boolean
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  /** index into PARTICLE_COLORS */
  color: number
  shape: ParticleShape
  rot: number
  spin: number
  gravity: number
}

/** Fixed palette so every particle sprite can be pre-rendered once. */
export const PARTICLE_COLORS = [
  '#fb7185', // 0 rose
  '#f472b6', // 1 pink
  '#fda4af', // 2 blush
  '#ffffff', // 3 white
  '#fde68a', // 4 light gold
  '#fbbf24', // 5 gold
  '#c084fc', // 6 purple
  '#a78bfa', // 7 lavender
  '#9ca3af', // 8 grey
  '#f43f5e', // 9 red-rose
  '#60a5fa', // 10 rain blue
] as const

export const COLORS_PINK: readonly number[] = [0, 1, 2, 3, 0, 1]
export const COLORS_GOLD: readonly number[] = [4, 5, 3, 5, 4]
export const COLORS_PHOTO: readonly number[] = [0, 2, 3, 6, 1]
export const COLORS_POWER: readonly number[] = [6, 7, 4, 3, 5]
export const COLORS_HIT: readonly number[] = [8, 8, 9, 3]
export const COLORS_RAIN: readonly number[] = [10, 10, 8, 3]

export function createParticles(count: number): Particle[] {
  const list: Particle[] = []
  for (let i = 0; i < count; i++) {
    list.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 4, color: 0, shape: 0, rot: 0, spin: 0, gravity: 0 })
  }
  return list
}

/* ------------------------------------------------------------------ */
/* Floating "+3" texts, photo pops, banners                             */
/* ------------------------------------------------------------------ */

export interface FloatText {
  active: boolean
  x: number
  y: number
  vy: number
  life: number
  max: number
  text: string
  color: string
  /** larger font (golden hearts, power-ups) */
  big: boolean
}

export function createTexts(count: number): FloatText[] {
  const list: FloatText[] = []
  for (let i = 0; i < count; i++) {
    list.push({ active: false, x: 0, y: 0, vy: 0, life: 0, max: 1, text: '', color: '#fff', big: false })
  }
  return list
}

/** A caught photo pops out of the jar as a tiny polaroid. */
export interface PhotoPop {
  active: boolean
  photo: number
  x: number
  y: number
  dx: number
  dy: number
  rot: number
  life: number
  max: number
}

export function createPops(count: number): PhotoPop[] {
  const list: PhotoPop[] = []
  for (let i = 0; i < count; i++) {
    list.push({ active: false, photo: -1, x: 0, y: 0, dx: 0, dy: 0, rot: 0, life: 0, max: 1 })
  }
  return list
}

export interface Banner {
  active: boolean
  text: string
  sub: string
  life: number
  max: number
  /** canvas font string, computed once when the banner is shown so it always fits the width */
  font: string
}

export function createBanner(): Banner {
  return { active: false, text: '', sub: '', life: 0, max: 1, font: '' }
}

/* ------------------------------------------------------------------ */
/* Background parallax                                                  */
/* ------------------------------------------------------------------ */

export interface BgDot {
  /** 0–1 normalised position so resizes don't need recalculation */
  nx: number
  ny: number
  size: number
  /** 0.2 (far) – 1 (near) */
  depth: number
  phase: number
  twinkle: number
  /** 0 = dot / star, 1 = heart */
  kind: 0 | 1
}

export function createBackground(count: number, random: () => number = Math.random): BgDot[] {
  const list: BgDot[] = []
  for (let i = 0; i < count; i++) {
    const depth = 0.2 + random() * 0.8
    list.push({
      nx: random(),
      ny: random(),
      size: 0.6 + random() * 1.4,
      depth,
      phase: random() * Math.PI * 2,
      twinkle: 0.8 + random() * 2.2,
      kind: random() < 0.28 ? 1 : 0,
    })
  }
  return list
}

/* ------------------------------------------------------------------ */
/* Player                                                               */
/* ------------------------------------------------------------------ */

export interface Player {
  x: number
  vx: number
  targetX: number
  /** jar size in px */
  w: number
  h: number
  /** spring value: >0 squashed, <0 stretched */
  squash: number
  squashV: number
  lean: number
  invuln: number
  /** 1 right after a catch, fades to 0 */
  glow: number
}

export function createPlayer(): Player {
  return { x: 0, vx: 0, targetX: 0, w: 80, h: 72, squash: 0, squashV: 0, lean: 0, invuln: 0, glow: 0 }
}

/* ------------------------------------------------------------------ */
/* World: everything the renderer needs to draw a frame                 */
/* ------------------------------------------------------------------ */

export interface World {
  /** canvas size in CSS px */
  W: number
  H: number
  dpr: number
  /** size scale relative to a ~420px wide board */
  unit: number
  /** HUD scale (clamped so text stays readable) */
  hu: number
  /** y of the jar's bottom */
  groundY: number
  /** seconds of animation time (keeps running during the ending) */
  time: number
  /** seconds of actual play, drives difficulty */
  playTime: number
  dark: boolean
  reduced: boolean
  /** draw the score / lives HUD */
  hud: boolean
  player: Player
  items: Item[]
  particles: Particle[]
  texts: FloatText[]
  pops: PhotoPop[]
  banner: Banner
  bg: BgDot[]
  bgScroll: number
  score: number
  lives: number
  combo: number
  mult: number
  bestCombo: number
  /** smoothed 0–1 jar fill level */
  liquid: number
  /** seconds left on each power-up */
  magnet: number
  slow: number
  /** item time multiplier (slow-motion eases it to 0.5) */
  timeScale: number
  shake: number
  flash: number
  comboPulse: number
  /** seconds left in the game-over animation, or -1 */
  ending: number
  scoreText: string
  multText: string
  comboText: string
}

export function createWorld(): World {
  return {
    W: 0,
    H: 0,
    dpr: 1,
    unit: 1,
    hu: 1,
    groundY: 0,
    time: 0,
    playTime: 0,
    dark: false,
    reduced: false,
    hud: false,
    player: createPlayer(),
    items: createItems(48),
    particles: createParticles(320),
    texts: createTexts(24),
    pops: createPops(4),
    banner: createBanner(),
    bg: createBackground(34),
    bgScroll: 0,
    score: 0,
    lives: MAX_LIVES,
    combo: 0,
    mult: 1,
    bestCombo: 0,
    liquid: 0,
    magnet: 0,
    slow: 0,
    timeScale: 1,
    shake: 0,
    flash: 0,
    comboPulse: 0,
    ending: -1,
    scoreText: '0',
    multText: '×1',
    comboText: '',
  }
}
