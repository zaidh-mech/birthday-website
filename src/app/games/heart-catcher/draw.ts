/**
 * Heart Catcher: per-frame renderer. Reads the World, draws with the
 * pre-rendered sprites. No allocations here: everything is indexed loops,
 * cached strings and setTransform instead of save/restore stacks.
 */

import { ENDING_SECONDS, MAGNET_SECONDS, MAX_LIVES, MAX_MULT, SLOW_SECONDS, type World } from './entities'
import { jarBodyPath, roundRectPath, type FontFamilies, type Palette, type Sprite, type Sprites } from './sprites'

const TAU = Math.PI * 2
const NO_DASH: number[] = []

export interface View {
  dpr: number
  /** screen-shake offset in CSS px */
  ox: number
  oy: number
}

export interface FontSet {
  families: FontFamilies
  label: string
  labelSize: number
  score: string
  scoreSize: number
  mult: string
  multSize: number
  combo: string
  comboSize: number
  float: string
  floatBig: string
  bannerSize: number
  bannerSub: string
  bannerSubSize: number
}

export function buildFonts(f: FontFamilies, hu: number): FontSet {
  const labelSize = Math.round(10 * hu)
  const scoreSize = Math.round(28 * hu)
  const multSize = Math.round(26 * hu)
  const comboSize = Math.round(11 * hu)
  const floatSize = Math.round(18 * hu)
  const bannerSubSize = Math.round(13 * hu)
  return {
    families: f,
    label: `700 ${labelSize}px ${f.sans}`,
    labelSize,
    score: `700 ${scoreSize}px ${f.serif}`,
    scoreSize,
    mult: `italic 800 ${multSize}px ${f.serif}`,
    multSize,
    combo: `600 ${comboSize}px ${f.sans}`,
    comboSize,
    float: `700 ${floatSize}px ${f.serif}`,
    floatBig: `800 ${Math.round(floatSize * 1.3)}px ${f.serif}`,
    bannerSize: Math.round(36 * hu),
    bannerSub: `600 ${bannerSubSize}px ${f.sans}`,
    bannerSubSize,
  }
}

export function bannerFont(fonts: FontSet, size: number): string {
  return `700 ${size}px ${fonts.families.cursive}`
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function easeOutCubic(t: number): number {
  const k = 1 - t
  return 1 - k * k * k
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  const k = t - 1
  return 1 + c3 * k * k * k + c1 * k * k
}

/** Absolute transform: translate (with shake) → rotate → scale, all in CSS px. */
function setT(ctx: CanvasRenderingContext2D, view: View, x: number, y: number, rot: number, sx: number, sy: number): void {
  const d = view.dpr
  if (rot === 0) {
    ctx.setTransform(sx * d, 0, 0, sy * d, (x + view.ox) * d, (y + view.oy) * d)
    return
  }
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  ctx.setTransform(c * sx * d, s * sx * d, -s * sy * d, c * sy * d, (x + view.ox) * d, (y + view.oy) * d)
}

export function drawSprite(ctx: CanvasRenderingContext2D, view: View, sp: Sprite, x: number, y: number, rot: number, scale: number): void {
  setT(ctx, view, x, y, rot, scale, scale)
  ctx.drawImage(sp.c, -sp.w / 2, -sp.h / 2, sp.w, sp.h)
}

/* ------------------------------------------------------------------ */

function drawParallax(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, pal: Palette, view: View): void {
  const W = w.W
  const H = w.H
  const u = w.unit
  const d = view.dpr
  const span = H + 40
  const shift = (W / 2 - w.player.x) * 0.06
  const t = w.time
  const bg = w.bg
  ctx.fillStyle = pal.star
  for (let i = 0; i < bg.length; i++) {
    const b = bg[i]
    const y = ((b.ny * span + w.bgScroll * (0.3 + b.depth)) % span) - 20
    const x = b.nx * W + shift * b.depth
    const tw = 0.5 + 0.5 * Math.sin(t * b.twinkle + b.phase)
    if (b.kind === 1) {
      ctx.globalAlpha = (w.dark ? 0.14 : 0.2) + 0.2 * b.depth * (0.6 + 0.4 * tw)
      drawSprite(ctx, view, sp.bgHeart, x, y, Math.sin(t * 0.6 + b.phase) * 0.25, (0.4 + b.size * 0.3) * (0.6 + b.depth * 0.6) * u)
    } else if (w.dark) {
      ctx.globalAlpha = 0.2 + 0.7 * tw * (0.4 + 0.6 * b.depth)
      const s = (0.7 + b.size * 0.9) * Math.min(1.3, u)
      ctx.setTransform(d, 0, 0, d, 0, 0)
      ctx.fillRect(x - s / 2, y - s / 2, s, s)
    } else {
      ctx.globalAlpha = 0.3 + 0.4 * b.depth * (0.7 + 0.3 * tw)
      drawSprite(ctx, view, sp.bokeh, x, y, 0, (0.3 + b.size * 0.4) * (0.6 + b.depth) * u)
    }
  }
  ctx.globalAlpha = 1
}

function drawItems(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, view: View): void {
  const fade = w.ending >= 0 ? clamp(w.ending / ENDING_SECONDS, 0, 1) : 1
  if (fade <= 0) return
  const items = w.items
  const d = view.dpr
  const t = w.time
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (!it.active) continue
    ctx.globalAlpha = fade
    switch (it.kind) {
      case 'heart':
        drawSprite(ctx, view, sp.heart, it.x, it.y, it.rot, 1 + 0.05 * Math.sin(it.age * 7 + it.phase))
        break
      case 'gold':
        drawSprite(ctx, view, sp.gold, it.x, it.y, it.rot, 1 + 0.09 * Math.sin(it.age * 9))
        break
      case 'photo': {
        const s = sp.photos[it.photo]
        drawSprite(ctx, view, s ?? sp.heart, it.x, it.y, it.rot * 0.5, 1)
        break
      }
      case 'magnet':
        drawSprite(ctx, view, sp.magnet, it.x, it.y, Math.sin(it.age * 3) * 0.25, 1 + 0.07 * Math.sin(it.age * 6))
        break
      case 'slow':
        drawSprite(ctx, view, sp.slow, it.x, it.y, Math.sin(it.age * 2.5) * 0.15, 1 + 0.07 * Math.sin(it.age * 6))
        break
      case 'life':
        drawSprite(ctx, view, sp.life, it.x, it.y, Math.sin(it.age * 3) * 0.15, 1 + 0.08 * Math.sin(it.age * 7))
        break
      case 'broken':
        drawSprite(ctx, view, sp.broken, it.x, it.y, it.rot, 1)
        break
      case 'cloud': {
        // little raindrops under the cloud
        const r = it.r
        ctx.fillStyle = '#60a5fa'
        ctx.setTransform(d, 0, 0, d, view.ox * d, view.oy * d)
        for (let k = 0; k < 3; k++) {
          const p = (t * 1.7 + k * 0.37 + it.phase) % 1
          ctx.globalAlpha = fade * (1 - p) * 0.85
          ctx.fillRect(it.x + (k - 1) * 0.5 * r - 0.05 * r, it.y + 0.45 * r + p * r, 0.1 * r, 0.3 * r)
        }
        ctx.globalAlpha = fade
        drawSprite(ctx, view, sp.cloud, it.x, it.y, Math.sin(it.age * 2 + it.phase) * 0.06, 1)
        break
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawJar(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, pal: Palette, view: View): void {
  const p = w.player
  const jw = p.w
  const jh = p.h
  const gy = w.groundY
  const u = w.unit
  const endK = w.ending >= 0 ? 1 - clamp(w.ending / ENDING_SECONDS, 0, 1) : 0

  // soft shadow on the ground
  setT(ctx, view, p.x, gy, 0, 1 + p.squash * 0.25, 1)
  ctx.globalAlpha = 1
  ctx.fillStyle = pal.shadow
  ctx.beginPath()
  ctx.ellipse(0, 0, jw * 0.55, Math.max(2, jh * 0.075), 0, 0, TAU)
  ctx.fill()

  // magnet field
  if (w.magnet > 0) {
    setT(ctx, view, p.x, gy - jh * 0.5, 0, 1, 1)
    ctx.globalAlpha = Math.min(1, w.magnet / 0.6) * (0.55 + 0.25 * Math.sin(w.time * 6))
    ctx.setLineDash(sp.dash)
    ctx.lineDashOffset = -w.time * 40 * u
    ctx.strokeStyle = pal.magnet
    ctx.lineWidth = 2.5 * u
    ctx.beginPath()
    ctx.arc(0, 0, jw * 0.95 + Math.sin(w.time * 4) * 3 * u, 0, TAU)
    ctx.stroke()
    ctx.setLineDash(NO_DASH)
    ctx.lineDashOffset = 0
  }

  // happy glow right after a catch
  if (p.glow > 0) {
    ctx.globalAlpha = p.glow * 0.85
    drawSprite(ctx, view, sp.jarGlow, p.x, gy - jh * 0.7, 0, 0.8 + (1 - p.glow) * 0.5)
  }

  let alpha = 1
  if (p.invuln > 0 && w.ending < 0) alpha = Math.floor(p.invuln * 10) % 2 === 0 ? 0.35 : 0.95
  alpha *= 1 - endK * 0.45
  ctx.globalAlpha = alpha

  const sx = 1 + p.squash * 0.22
  const sy = 1 - p.squash * 0.2
  const rot = p.lean + Math.sin(endK * Math.PI * 0.5) * 0.32
  setT(ctx, view, p.x, gy, rot, sx, sy)

  // glass body
  jarBodyPath(ctx, jw, jh)
  ctx.fillStyle = pal.glassFill
  ctx.fill()

  // liquid + heart inside the glass
  ctx.save()
  ctx.clip()
  const level = jh * (0.05 + 0.7 * w.liquid)
  if (level > 0.5) {
    const top = -level
    const amp = jh * 0.03 * (0.4 + w.liquid)
    ctx.beginPath()
    ctx.moveTo(-jw * 0.55, 2)
    ctx.lineTo(-jw * 0.55, top)
    for (let i = 0; i <= 8; i++) {
      ctx.lineTo(-jw * 0.55 + (jw * 1.1 * i) / 8, top + Math.sin(w.time * 5 + i * 0.95) * amp)
    }
    ctx.lineTo(jw * 0.55, 2)
    ctx.closePath()
    ctx.fillStyle = sp.liquid ?? pal.liquidBottom
    ctx.fill()
  }
  const beat = 1 + 0.06 * Math.sin(w.time * 5) + p.glow * 0.22
  const ih = sp.innerHeart
  ctx.drawImage(ih.c, (-ih.w * beat) / 2, -jh * 0.42 - (ih.h * beat) / 2, ih.w * beat, ih.h * beat)
  ctx.restore()

  // outline + shine
  jarBodyPath(ctx, jw, jh)
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.5, 2.2 * u)
  ctx.strokeStyle = pal.glassStroke
  ctx.stroke()
  ctx.fillStyle = pal.glassHighlight
  roundRectPath(ctx, -jw * 0.39, -jh * 0.6, jw * 0.075, jh * 0.38, jw * 0.04)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-jw * 0.352, -jh * 0.15, jw * 0.035, 0, TAU)
  ctx.fill()

  // open mouth
  ctx.beginPath()
  ctx.ellipse(0, -jh, jw * 0.36, Math.max(2, jh * 0.07), 0, 0, TAU)
  ctx.fillStyle = pal.mouthFill
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, 2.4 * u)
  ctx.stroke()

  // ribbon and bow
  ctx.fillStyle = pal.ribbon
  ctx.fillRect(-jw * 0.36, -jh * 0.92, jw * 0.72, jh * 0.075)
  const bx = jw * 0.14
  const by = -jh * 0.885
  ctx.beginPath()
  ctx.ellipse(bx - jw * 0.085, by - jh * 0.01, jw * 0.085, jh * 0.055, -0.5, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(bx + jw * 0.085, by - jh * 0.01, jw * 0.085, jh * 0.055, 0.5, 0, TAU)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx - jw * 0.075, by + jh * 0.14)
  ctx.lineTo(bx - jw * 0.025, by + jh * 0.12)
  ctx.closePath()
  ctx.moveTo(bx, by)
  ctx.lineTo(bx + jw * 0.075, by + jh * 0.14)
  ctx.lineTo(bx + jw * 0.025, by + jh * 0.12)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = pal.ribbonKnot
  ctx.beginPath()
  ctx.arc(bx, by, jw * 0.04, 0, TAU)
  ctx.fill()

  ctx.globalAlpha = 1
}

function drawParticles(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, view: View): void {
  const ps = w.particles
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i]
    if (!p.active) continue
    const a = p.life / p.max
    ctx.globalAlpha = a < 0.35 ? a / 0.35 : 1
    if (p.shape === 0) drawSprite(ctx, view, sp.dots[p.color], p.x, p.y, 0, p.size / 16)
    else if (p.shape === 1) drawSprite(ctx, view, sp.hearts[p.color], p.x, p.y, p.rot, p.size / 16)
    else drawSprite(ctx, view, sp.spark, p.x, p.y, p.rot, (p.size / 18) * (0.6 + 0.4 * a))
  }
  ctx.globalAlpha = 1
}

function drawPops(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, view: View): void {
  const pops = w.pops
  for (let i = 0; i < pops.length; i++) {
    const pop = pops[i]
    if (!pop.active) continue
    const s = sp.polaroids[pop.photo]
    if (!s) continue
    const t = 1 - pop.life / pop.max
    const e = easeOutCubic(t)
    const grow = t < 0.25 ? easeOutBack(t / 0.25) : 1
    ctx.globalAlpha = t > 0.7 ? Math.max(0, (1 - t) / 0.3) : 1
    drawSprite(ctx, view, s, pop.x + pop.dx * e, pop.y + pop.dy * e, pop.rot * e, 0.35 + 0.65 * grow)
  }
  ctx.globalAlpha = 1
}

function drawTexts(ctx: CanvasRenderingContext2D, w: World, pal: Palette, fonts: FontSet, view: View): void {
  const texts = w.texts
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = pal.textStroke
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i]
    if (!t.active) continue
    const k = 1 - t.life / t.max
    const s = k < 0.12 ? 0.6 + (k / 0.12) * 0.55 : k < 0.24 ? 1.15 - ((k - 0.12) / 0.12) * 0.15 : 1
    ctx.globalAlpha = t.life < 0.35 ? t.life / 0.35 : 1
    setT(ctx, view, t.x, t.y, 0, s, s)
    ctx.font = t.big ? fonts.floatBig : fonts.float
    ctx.lineWidth = 4
    ctx.strokeText(t.text, 0, 0)
    ctx.fillStyle = t.color
    ctx.fillText(t.text, 0, 0)
  }
  ctx.globalAlpha = 1
}

function drawPowerChip(ctx: CanvasRenderingContext2D, view: View, s: Sprite, x: number, y: number, size: number, left: number, total: number, color: string, pal: Palette): void {
  const d = view.dpr
  // blink during the last second
  const blink = left < 1 && Math.floor(left * 8) % 2 === 0
  ctx.globalAlpha = 1
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.fillStyle = pal.chipFill
  ctx.beginPath()
  ctx.arc(x, y, size / 2 + 5, 0, TAU)
  ctx.fill()
  ctx.globalAlpha = blink ? 0.45 : 1
  drawSprite(ctx, view, s, x, y, 0, size / (s.w / 1.5))
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.arc(x, y, size / 2 + 5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(left / total, 0, 1))
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.lineCap = 'butt'
}

function drawHud(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, pal: Palette, fonts: FontSet, view: View): void {
  const d = view.dpr
  const x0 = 14
  const y0 = 12
  ctx.globalAlpha = 1
  ctx.setTransform(d, 0, 0, d, 0, 0)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = pal.textStroke

  ctx.font = fonts.label
  ctx.lineWidth = 3
  ctx.strokeText('SCORE', x0, y0)
  ctx.fillStyle = pal.hudLabel
  ctx.fillText('SCORE', x0, y0)

  const sy = y0 + fonts.labelSize + 2
  ctx.font = fonts.score
  ctx.lineWidth = 4
  ctx.strokeText(w.scoreText, x0, sy)
  ctx.fillStyle = pal.hudText
  ctx.fillText(w.scoreText, x0, sy)

  const lf = sp.lifeFull
  const ly = sy + fonts.scoreSize + 4 + lf.h / 2
  for (let i = 0; i < MAX_LIVES; i++) {
    drawSprite(ctx, view, i < w.lives ? lf : sp.lifeEmpty, x0 - 2 + lf.w / 2 + i * (lf.w + 1), ly, 0, 1)
  }

  // combo, top centre
  if (w.mult > 1 || w.combo >= 3) {
    const cx = w.W / 2
    ctx.textAlign = 'center'
    let ty = y0 + 2
    if (w.mult > 1) {
      const s = 1 + w.comboPulse * 0.4
      setT(ctx, view, cx, ty + fonts.multSize / 2, 0, s, s)
      ctx.textBaseline = 'middle'
      ctx.font = fonts.mult
      ctx.lineWidth = 5
      ctx.strokeText(w.multText, 0, 0)
      ctx.fillStyle = w.mult >= MAX_MULT ? pal.goldText : pal.heartText
      ctx.fillText(w.multText, 0, 0)
      ctx.setTransform(d, 0, 0, d, 0, 0)
      ty += fonts.multSize + 2
    }
    ctx.textBaseline = 'top'
    ctx.font = fonts.combo
    ctx.lineWidth = 3
    ctx.strokeText(w.comboText, cx, ty)
    ctx.fillStyle = pal.hudLabel
    ctx.fillText(w.comboText, cx, ty)
  }

  // power-up timers, right side under the (DOM) pause button
  const size = Math.round(26 * w.hu)
  const px = w.W - 32
  let py = 64 + size / 2
  if (w.magnet > 0) {
    drawPowerChip(ctx, view, sp.magnet, px, py, size, w.magnet, MAGNET_SECONDS, pal.magnet, pal)
    py += size + 16
  }
  if (w.slow > 0) {
    drawPowerChip(ctx, view, sp.slow, px, py, size, w.slow, SLOW_SECONDS, '#8b5cf6', pal)
  }
}

function drawBanner(ctx: CanvasRenderingContext2D, w: World, pal: Palette, fonts: FontSet, view: View): void {
  const b = w.banner
  if (!b.active) return
  const k = 1 - b.life / b.max
  const a = k < 0.1 ? k / 0.1 : b.life < 0.45 ? b.life / 0.45 : 1
  const s = k < 0.1 ? 0.75 + 0.25 * easeOutBack(k / 0.1) : 1
  const y = w.H * 0.36 - (b.life < 0.45 ? (0.45 - b.life) * 30 : 0)
  ctx.globalAlpha = clamp(a, 0, 1)
  setT(ctx, view, w.W / 2, y, 0, s, s)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = pal.textStroke
  ctx.font = b.font
  ctx.lineWidth = 7
  ctx.strokeText(b.text, 0, 0)
  ctx.fillStyle = pal.bannerText
  ctx.fillText(b.text, 0, 0)
  if (b.sub) {
    const subY = fonts.bannerSize * 0.62 + fonts.bannerSubSize * 0.5 + 4
    ctx.font = fonts.bannerSub
    ctx.lineWidth = 4
    ctx.strokeText(b.sub, 0, subY)
    ctx.fillStyle = pal.bannerSub
    ctx.fillText(b.sub, 0, subY)
  }
  ctx.globalAlpha = 1
}

/** Draws one complete frame. */
export function renderWorld(ctx: CanvasRenderingContext2D, w: World, sp: Sprites, pal: Palette, fonts: FontSet, view: View): void {
  const d = view.dpr
  view.ox = 0
  view.oy = 0
  if (w.shake > 0 && !w.reduced) {
    const m = Math.min(1, w.shake / 0.35) * 7 * w.unit
    view.ox = (Math.random() * 2 - 1) * m
    view.oy = (Math.random() * 2 - 1) * m
  }

  ctx.globalAlpha = 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.drawImage(sp.background, 0, 0)

  drawParallax(ctx, w, sp, pal, view)

  if (w.slow > 0) {
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.globalAlpha = Math.min(1, w.slow / 0.4)
    ctx.fillStyle = pal.slowTint
    ctx.fillRect(0, 0, w.W, w.H)
    ctx.globalAlpha = 1
  }

  drawItems(ctx, w, sp, view)
  drawJar(ctx, w, sp, pal, view)
  drawParticles(ctx, w, sp, view)
  drawPops(ctx, w, sp, view)
  drawTexts(ctx, w, pal, fonts, view)

  // overlays below are not shaken
  view.ox = 0
  view.oy = 0
  if (w.flash > 0 && sp.flash) {
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.globalAlpha = w.flash * 0.45
    ctx.fillStyle = sp.flash
    ctx.fillRect(0, 0, w.W, w.H)
  }
  if (w.ending >= 0) {
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.globalAlpha = (1 - clamp(w.ending / ENDING_SECONDS, 0, 1)) * 0.3
    ctx.fillStyle = pal.endDim
    ctx.fillRect(0, 0, w.W, w.H)
  }
  ctx.globalAlpha = 1
  if (w.hud) drawHud(ctx, w, sp, pal, fonts, view)
  drawBanner(ctx, w, pal, fonts, view)
  ctx.globalAlpha = 1
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}
