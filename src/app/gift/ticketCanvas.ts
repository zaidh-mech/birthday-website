/**
 * Draws the "ADMIT TWO" date ticket straight onto a <canvas> and returns a
 * PNG. (html2canvas can't parse Tailwind v4's oklch() colours, so the ticket
 * is painted by hand with the Canvas 2D API.)
 */

export interface TicketInfo {
  years: number
  placeName: string
  placeSubtitle: string
  dateISO: string
  formattedDate: string
  weekday: string
  monthShort: string
  dayNumber: string
  time: string
  startLabel: string
  offering: string
  colorName: string
  colorHex: string
  colorNote: string
  fromName: string
  serial: string
}

interface Palette {
  bg1: string
  bg2: string
  paper1: string
  paper2: string
  stub1: string
  stub2: string
  ink: string
  muted: string
  accent: string
  frame: string
  perf: string
  hearts: string
  shadow: string
}

const LIGHT: Palette = {
  bg1: '#fde4e6',
  bg2: '#efe3fb',
  paper1: '#fffbf6',
  paper2: '#fff0ea',
  stub1: '#fb7185',
  stub2: '#db2777',
  ink: '#3d2a2e',
  muted: '#8b6f74',
  accent: '#e11d48',
  frame: 'rgba(225, 29, 72, 0.32)',
  perf: 'rgba(120, 50, 60, 0.35)',
  hearts: 'rgba(244, 63, 94, 0.12)',
  shadow: 'rgba(159, 18, 57, 0.28)',
}

const DARK: Palette = {
  bg1: '#0b0c10',
  bg2: '#22163a',
  paper1: '#1b1527',
  paper2: '#241a36',
  stub1: '#a855f7',
  stub2: '#6d28d9',
  ink: '#f3edff',
  muted: '#b8a8d8',
  accent: '#d8b4fe',
  frame: 'rgba(196, 181, 253, 0.32)',
  perf: 'rgba(216, 180, 254, 0.4)',
  hearts: 'rgba(192, 132, 252, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.6)',
}

function fontFamily(cssVar: string, fallback: string): string {
  try {
    const value = getComputedStyle(document.body).getPropertyValue(cssVar).trim()
    return value ? `${value}, ${fallback}` : fallback
  } catch {
    return fallback
  }
}

async function ensureFonts(fonts: string[]): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return
  const loads = Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => [])))
  await Promise.race([loads, new Promise((resolve) => window.setTimeout(resolve, 1500))])
}

function ticketPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, px: number, n: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(px - n, y)
  ctx.arc(px, y, n, Math.PI, 0, true)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(px + n, y + h)
  ctx.arc(px, y + h, n, 0, Math.PI, true)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size / 2
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.85)
  ctx.bezierCurveTo(cx - s * 1.55, cy - s * 0.15, cx - s * 0.75, cy - s * 1.25, cx, cy - s * 0.4)
  ctx.bezierCurveTo(cx + s * 0.75, cy - s * 1.25, cx + s * 1.55, cy - s * 0.15, cx, cy + s * 0.85)
  ctx.closePath()
}

function spacedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  const chars = Array.from(text)
  return chars.reduce((w, ch) => w + ctx.measureText(ch).width, 0) + spacing * Math.max(0, chars.length - 1)
}

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'center' | 'right' = 'left') {
  const width = spacedWidth(ctx, text, spacing)
  let cx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  const prev = ctx.textAlign
  ctx.textAlign = 'left'
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  }
  ctx.textAlign = prev
}

/** Sets ctx.font to the largest size (down to minSize) at which `text` fits; truncates with … if it still doesn't. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: (size: number) => string, size: number, minSize: number): string {
  let s = size
  ctx.font = font(s)
  while (s > minSize && ctx.measureText(text).width > maxWidth) {
    s -= 2
    ctx.font = font(s)
  }
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut.trimEnd()}…`
}

function seeded(seedText: string): () => number {
  let t = 0
  for (let i = 0; i < seedText.length; i++) t = (Math.imul(t, 31) + seedText.charCodeAt(i)) >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export async function renderTicketPng(info: TicketInfo, dark: boolean): Promise<Blob | null> {
  const W = 1800
  const H = 900
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const serif = fontFamily('--font-playfair', 'Georgia, serif')
  const cursive = fontFamily('--font-dancing', 'cursive')
  const sans = fontFamily('--font-inter', 'system-ui, sans-serif')
  await ensureFonts([`700 64px ${serif}`, `600 36px ${serif}`, `400 48px ${cursive}`, `700 24px ${sans}`])

  const p = dark ? DARK : LIGHT
  const rand = seeded(`${info.serial}${info.dateISO}`)
  ctx.textBaseline = 'alphabetic'

  // Backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, p.bg1)
  bg.addColorStop(1, p.bg2)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = p.hearts
  for (let i = 0; i < 26; i++) {
    const hx = rand() * W
    const hy = rand() * H
    if (hx > 90 && hx < 1710 && hy > 110 && hy < 790) continue
    heartPath(ctx, hx, hy, 18 + rand() * 34)
    ctx.fill()
  }

  ctx.fillStyle = p.accent
  ctx.font = `400 46px ${cursive}`
  ctx.textAlign = 'center'
  ctx.fillText("it's a date!", W / 2, 92)

  // Ticket shape
  const x = 110
  const y = 130
  const w = 1580
  const h = 640
  const r = 44
  const n = 34
  const px = x + w - 420

  ctx.save()
  ctx.shadowColor = p.shadow
  ctx.shadowBlur = 70
  ctx.shadowOffsetY = 26
  ticketPath(ctx, x, y, w, h, r, px, n)
  const paper = ctx.createLinearGradient(x, y, px, y + h)
  paper.addColorStop(0, p.paper1)
  paper.addColorStop(1, p.paper2)
  ctx.fillStyle = paper
  ctx.fill()
  ctx.restore()

  ctx.save()
  ticketPath(ctx, x, y, w, h, r, px, n)
  ctx.clip()
  const stub = ctx.createLinearGradient(px, y, x + w, y + h)
  stub.addColorStop(0, p.stub1)
  stub.addColorStop(1, p.stub2)
  ctx.fillStyle = stub
  ctx.fillRect(px, y, x + w - px, h)
  const glow = ctx.createRadialGradient(x + 220, y + 90, 10, x + 220, y + 90, 760)
  glow.addColorStop(0, dark ? 'rgba(192, 132, 252, 0.16)' : 'rgba(255, 255, 255, 0.9)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(x, y, px - x, h)
  ctx.restore()

  // Inner frame + perforation
  ctx.save()
  ctx.setLineDash([10, 10])
  ctx.strokeStyle = p.frame
  ctx.lineWidth = 3
  roundRectPath(ctx, x + 26, y + 26, px - x - 26 - n, h - 52, 24)
  ctx.stroke()
  ctx.setLineDash([14, 12])
  ctx.strokeStyle = p.perf
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(px, y + n + 14)
  ctx.lineTo(px, y + h - n - 14)
  ctx.stroke()
  ctx.restore()

  // ---- Main body ----
  const left = x + 80
  const right = px - 70
  const colGap = 530

  ctx.textAlign = 'left'
  ctx.fillStyle = p.accent
  heartPath(ctx, left + 14, 212, 26)
  ctx.fill()
  ctx.font = `800 26px ${sans}`
  drawSpaced(ctx, 'ADMIT TWO', left + 40, 222, 8)
  ctx.fillStyle = p.muted
  ctx.font = `600 24px ${sans}`
  drawSpaced(ctx, `No. ${info.serial}`, right, 222, 3, 'right')

  ctx.fillStyle = p.ink
  const title = fitText(ctx, `Our ${info.years}-Year Anniversary Date`, right - left, (s) => `700 ${s}px ${serif}`, 64, 40)
  ctx.fillText(title, left, 300)
  ctx.fillStyle = p.accent
  ctx.font = `400 48px ${cursive}`
  ctx.fillText('& your birthday celebration', left, 356)

  ctx.strokeStyle = p.frame
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(left, 392)
  ctx.lineTo(right, 392)
  ctx.stroke()

  const label = (text: string, lx: number, ly: number) => {
    ctx.fillStyle = p.accent
    ctx.font = `700 19px ${sans}`
    drawSpaced(ctx, text, lx, ly, 5)
  }
  const col1 = left
  const col2 = left + colGap
  const colWidth = colGap - 40

  label('DATE', col1, 445)
  ctx.fillStyle = p.ink
  ctx.fillText(fitText(ctx, info.formattedDate, colWidth, (s) => `600 ${s}px ${serif}`, 36, 24), col1, 490)

  label('TIME', col2, 445)
  ctx.fillStyle = p.ink
  ctx.fillText(fitText(ctx, info.time, right - col2, (s) => `600 ${s}px ${serif}`, 36, 24), col2, 490)
  ctx.fillStyle = p.muted
  ctx.fillText(fitText(ctx, info.offering, right - col2, (s) => `500 ${s}px ${sans}`, 22, 16), col2, 526)

  label('PLACE', col1, 575)
  ctx.fillStyle = p.ink
  ctx.fillText(fitText(ctx, info.placeName, colWidth, (s) => `600 ${s}px ${serif}`, 36, 24), col1, 620)
  ctx.fillStyle = p.muted
  ctx.fillText(fitText(ctx, info.placeSubtitle, colWidth, (s) => `500 ${s}px ${sans}`, 22, 16), col1, 654)

  label('DRESS CODE', col2, 575)
  ctx.save()
  ctx.beginPath()
  ctx.arc(col2 + 17, 608, 17, 0, Math.PI * 2)
  ctx.fillStyle = info.colorHex
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.12)'
  ctx.stroke()
  ctx.restore()
  ctx.fillStyle = p.ink
  ctx.fillText(fitText(ctx, info.colorName, right - col2 - 48, (s) => `600 ${s}px ${serif}`, 36, 24), col2 + 48, 620)
  if (info.colorNote) {
    ctx.fillStyle = p.muted
    ctx.fillText(fitText(ctx, info.colorNote, right - col2, (s) => `500 ${s}px ${sans}`, 22, 16), col2, 654)
  }

  ctx.fillStyle = p.muted
  ctx.fillText(fitText(ctx, `Valid for one perfect day with ${info.fromName}`, right - left - 40, (s) => `400 ${s}px ${cursive}`, 34, 24), left, 716)
  ctx.fillStyle = p.accent
  const footerWidth = ctx.measureText(`Valid for one perfect day with ${info.fromName}`).width
  heartPath(ctx, Math.min(left + footerWidth + 24, right - 10), 706, 22)
  ctx.fill()

  // ---- Stub ----
  const cx = px + (x + w - px) / 2
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.font = `800 24px ${sans}`
  drawSpaced(ctx, 'ADMIT TWO', cx, 222, 7, 'center')
  heartPath(ctx, cx, 262, 26)
  ctx.fill()
  ctx.font = `800 46px ${sans}`
  drawSpaced(ctx, info.monthShort.toUpperCase(), cx, 340, 10, 'center')
  ctx.font = `700 150px ${serif}`
  ctx.fillText(info.dayNumber, cx, 480)
  ctx.font = `700 24px ${sans}`
  drawSpaced(ctx, info.weekday.toUpperCase(), cx, 528, 6, 'center')
  ctx.font = `600 26px ${sans}`
  ctx.fillText(info.startLabel, cx, 566)
  ctx.globalAlpha = 0.85
  ctx.font = `700 17px ${sans}`
  drawSpaced(ctx, 'TABLE FOR TWO', cx, 604, 6, 'center')
  ctx.globalAlpha = 1

  // Barcode
  let bx = cx - 150
  while (bx < cx + 150) {
    const bw = 2 + Math.floor(rand() * 6)
    if (bx + bw > cx + 150) break
    ctx.fillRect(bx, 628, bw, 66)
    bx += bw + 2 + Math.floor(rand() * 5)
  }
  ctx.globalAlpha = 0.85
  ctx.font = `600 16px ${sans}`
  drawSpaced(ctx, info.serial.replace(/\D/g, '').padEnd(8, '0').slice(0, 8), cx, 722, 8, 'center')
  ctx.globalAlpha = 1

  // Footer under the ticket
  ctx.fillStyle = p.muted
  ctx.font = `600 20px ${sans}`
  drawSpaced(ctx, `MADE WITH LOVE · ${info.formattedDate.toUpperCase()}`, W / 2, 852, 4, 'center')

  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    } catch {
      resolve(null)
    }
  })
}
