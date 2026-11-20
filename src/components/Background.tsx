'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { normalizePath } from '@/lib/basePath'
import { SkyEngine, type SkyTheme } from '@/components/effects/sky/skyEngine'
import styles from '@/components/effects/sky/sky.module.css'

function domTheme(): SkyTheme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * The site-wide backdrop: warm gradient washes with tumbling petals by day,
 * a starry night sky with a glowing moon by night. One canvas + a few static
 * CSS layers, behind everything and never interactive. Hidden in Admin Studio.
 */
export default function Background() {
  const path = normalizePath(usePathname())
  if (path === '/admin' || path.startsWith('/admin/')) return null
  return <Sky />
}

function Sky() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SkyEngine | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const rect = canvas.getBoundingClientRect()

    const engine = new SkyEngine(canvas, {
      theme: domTheme(),
      reducedMotion: reduceQuery.matches,
      width: rect.width || window.innerWidth,
      height: rect.height || window.innerHeight,
      onParallax: (x, y) => {
        root.style.setProperty('--px', x.toFixed(3))
        root.style.setProperty('--py', y.toFixed(3))
      },
    })
    engineRef.current = engine
    if (!document.hidden) engine.start()
    const reveal = requestAnimationFrame(() => canvas.classList.add(styles.canvasReady))

    const resizeObserver = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) engine.setSize(box.width, box.height)
    })
    resizeObserver.observe(canvas)

    // DPR can change without the canvas changing size (dragging between monitors)
    const onResize = () => {
      const r = canvas.getBoundingClientRect()
      engine.setSize(r.width, r.height)
    }

    const onVisibility = () => {
      if (document.hidden) engine.stop()
      else engine.start()
    }

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !fineQuery.matches || reduceQuery.matches) return
      engine.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    }
    const onPointerLeave = () => engine.setPointer(0, 0)

    const onReduceChange = () => {
      engine.setReducedMotion(reduceQuery.matches)
      if (reduceQuery.matches) {
        root.style.setProperty('--px', '0')
        root.style.setProperty('--py', '0')
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    reduceQuery.addEventListener('change', onReduceChange)

    return () => {
      cancelAnimationFrame(reveal)
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      reduceQuery.removeEventListener('change', onReduceChange)
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !resolvedTheme) return
    // During the circular theme reveal the view transition does the fade, so snap.
    const instant = document.documentElement.classList.contains('theme-switching')
    engine.setTheme(resolvedTheme === 'dark' ? 'dark' : 'light', instant)
  }, [resolvedTheme])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-50 h-lvh select-none overflow-hidden ${styles.root}`}
    >
      {/* Day: warm washes + a soft sun glow */}
      <div className={`${styles.layer} ${styles.day}`}>
        <div className={`${styles.fill} ${styles.dayBase}`} />
        <div className={styles.parallaxFar}>
          <div className={`${styles.blob} ${styles.blobRose}`} />
          <div className={`${styles.blob} ${styles.blobGold}`} />
          <div className={`${styles.blob} ${styles.blobLilac}`} />
          <div className={`${styles.blob} ${styles.blobPeach}`} />
        </div>
        <div className={`${styles.blob} ${styles.sunGlow}`} />
      </div>

      {/* Night: deep sky, nebula clouds, the milky way */}
      <div className={`${styles.layer} ${styles.night}`}>
        <div className={`${styles.fill} ${styles.nightBase}`} />
        <div className={styles.parallaxFar}>
          <div className={`${styles.blob} ${styles.nebulaViolet}`} />
          <div className={`${styles.blob} ${styles.nebulaBlue}`} />
          <div className={`${styles.blob} ${styles.nebulaRose}`} />
        </div>
        <div className={styles.parallaxMid}>
          <div className={styles.milkyWay} />
          <div className={styles.milkyCore} />
        </div>
        <div className={`${styles.fill} ${styles.vignette}`} />
      </div>

      {/* Stars, shooting stars, petals, hearts, bokeh */}
      <canvas ref={canvasRef} className={styles.canvas} />

      {/* The moon rises when night falls */}
      <div className={styles.moonParallax}>
        <div className={styles.moonRise}>
          <div className={styles.moonHalo} />
          <div className={styles.moon} />
        </div>
      </div>
    </div>
  )
}
