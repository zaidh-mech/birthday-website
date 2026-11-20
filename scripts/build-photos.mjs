#!/usr/bin/env node
/**
 * Turns the original photos in assets/photos into web-ready images.
 *
 *   npm run photos
 *
 * For every image in assets/photos it writes:
 *   public/photos/full/<id>.webp   (max 1600px on the long edge)
 *   public/photos/thumb/<id>.webp  (max 640px on the long edge)
 * Videos (.mp4/.mov/.webm) are copied to public/photos/video/.
 *
 * It also writes src/data/photos.generated.json, which the site imports.
 * Captions, stories and dates come from assets/photos/stories.json — edit that
 * file (or add new photos) and run the script again.
 */
import { readdir, readFile, mkdir, writeFile, copyFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.join(root, 'assets', 'photos')
const outDir = path.join(root, 'public', 'photos')
const manifestPath = path.join(root, 'src', 'data', 'photos.generated.json')

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.avif'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v'])

const FULL_MAX = 1600
const THUMB_MAX = 640

function slugify(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Dates encoded in common phone file names are more reliable than re-saved EXIF. */
function dateFromFileName(name) {
  let m = name.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/) // Samsung / Android camera
  if (m) return toIso(m[1], m[2], m[3], m[4], m[5], m[6])
  m = name.match(/(?:IMG|VID)-(\d{4})(\d{2})(\d{2})-WA/i) // WhatsApp
  if (m) return toIso(m[1], m[2], m[3])
  m = name.match(/(?:IMG|PXL|VID)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/i) // iPhone exports / Pixel
  if (m) return toIso(m[1], m[2], m[3], m[4], m[5], m[6])
  return null
}

/** stories.json uses the EXIF style "YYYY:MM:DD HH:MM:SS". */
function dateFromStory(value) {
  if (!value || typeof value !== 'string') return null
  const m = value.match(/^(\d{4})[:-](\d{2})[:-](\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/)
  if (!m) return null
  return toIso(m[1], m[2], m[3], m[4], m[5], m[6])
}

function toIso(y, mo, d, h = '12', mi = '00', s = '00') {
  const year = Number(y)
  const month = Number(mo)
  const day = Number(d)
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`
}

function hex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

async function loadStories() {
  const storiesPath = path.join(srcDir, 'stories.json')
  if (!existsSync(storiesPath)) return new Map()
  try {
    const list = JSON.parse(await readFile(storiesPath, 'utf8'))
    return new Map(list.map((entry) => [entry.file, entry]))
  } catch (err) {
    console.warn('Could not parse assets/photos/stories.json:', err.message)
    return new Map()
  }
}

async function main() {
  if (!existsSync(srcDir)) {
    console.error(`No source folder at ${srcDir}`)
    process.exit(1)
  }

  const stories = await loadStories()
  const files = (await readdir(srcDir)).sort((a, b) => a.localeCompare(b))

  // Start clean so removed photos don't linger in public/.
  await rm(outDir, { recursive: true, force: true })
  await mkdir(path.join(outDir, 'full'), { recursive: true })
  await mkdir(path.join(outDir, 'thumb'), { recursive: true })
  await mkdir(path.join(outDir, 'video'), { recursive: true })

  const entries = []
  const usedIds = new Set()

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!IMAGE_EXT.has(ext) && !VIDEO_EXT.has(ext)) continue

    let id = slugify(file)
    while (usedIds.has(id)) id += '-x'
    usedIds.add(id)

    const story = stories.get(file) || {}
    const date = dateFromFileName(file) || dateFromStory(story.date)
    const base = {
      id,
      file,
      caption: (story.caption || '').trim(),
      story: (story.story || '').trim(),
      date,
      year: date ? Number(date.slice(0, 4)) : null,
    }

    const input = path.join(srcDir, file)

    if (VIDEO_EXT.has(ext)) {
      const outName = `${id}${ext}`
      await copyFile(input, path.join(outDir, 'video', outName))
      entries.push({ ...base, kind: 'video', src: `/photos/video/${outName}`, mime: ext === '.webm' ? 'video/webm' : 'video/mp4' })
      console.log(`video  ${file}`)
      continue
    }

    try {
      // .rotate() with no args applies the EXIF orientation, so phone photos stand upright.
      const oriented = sharp(input, { failOn: 'none' }).rotate()

      const full = await oriented
        .clone()
        .resize({ width: FULL_MAX, height: FULL_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 5 })
        .toFile(path.join(outDir, 'full', `${id}.webp`))

      const thumb = await oriented
        .clone()
        .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 72, effort: 5 })
        .toFile(path.join(outDir, 'thumb', `${id}.webp`))

      const blurBuffer = await oriented
        .clone()
        .resize({ width: 20, height: 20, fit: 'inside' })
        .webp({ quality: 40 })
        .toBuffer()

      const { dominant } = await oriented.clone().resize(64, 64, { fit: 'inside' }).stats()

      entries.push({
        ...base,
        kind: 'image',
        src: `/photos/full/${id}.webp`,
        thumb: `/photos/thumb/${id}.webp`,
        width: full.width,
        height: full.height,
        thumbWidth: thumb.width,
        thumbHeight: thumb.height,
        blur: `data:image/webp;base64,${blurBuffer.toString('base64')}`,
        color: hex(dominant),
      })
      console.log(`image  ${file} -> ${full.width}x${full.height}`)
    } catch (err) {
      console.warn(`skip   ${file}: ${err.message}`)
    }
  }

  // Oldest first; undated photos keep file-name order at the end.
  entries.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.file.localeCompare(b.file)
  })

  await writeFile(manifestPath, JSON.stringify(entries, null, 2) + '\n')
  const images = entries.filter((e) => e.kind === 'image').length
  const videos = entries.length - images
  console.log(`\nWrote ${images} images and ${videos} videos -> ${path.relative(root, manifestPath)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
