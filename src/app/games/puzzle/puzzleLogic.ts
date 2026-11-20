/**
 * Pure sliding-puzzle helpers (no React).
 *
 * A board is an array of tile ids indexed by grid position, row by row:
 * `board[pos] = tileId`. Tile `id` belongs at position `id` when solved, and
 * the highest id (`n * n - 1`) is the empty slot.
 */

export type PuzzleSize = 3 | 4 | 5

export const PUZZLE_SIZES: { n: PuzzleSize; label: string; pieces: number }[] = [
  { n: 3, label: 'Easy', pieces: 8 },
  { n: 4, label: 'Medium', pieces: 15 },
  { n: 5, label: 'Hard', pieces: 24 },
]

export function isPuzzleSize(value: unknown): value is PuzzleSize {
  return value === 3 || value === 4 || value === 5
}

/** Direction the tiles travel (arrow key / swipe direction). */
export type Direction = 'up' | 'down' | 'left' | 'right'

export function emptyId(n: number): number {
  return n * n - 1
}

export function solvedBoard(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => i)
}

export function isSolved(board: readonly number[]): boolean {
  for (let i = 0; i < board.length; i++) if (board[i] !== i) return false
  return true
}

/** How many real tiles (not the gap) already sit in their home position. */
export function countCorrect(board: readonly number[]): number {
  const empty = board.length - 1
  let count = 0
  for (let i = 0; i < board.length; i++) if (board[i] === i && board[i] !== empty) count++
  return count
}

export function findEmpty(board: readonly number[]): number {
  return board.indexOf(board.length - 1)
}

/** Grid positions orthogonally next to `pos`. */
function neighbours(pos: number, n: number): number[] {
  const r = Math.floor(pos / n)
  const c = pos % n
  const out: number[] = []
  if (r > 0) out.push(pos - n)
  if (r < n - 1) out.push(pos + n)
  if (c > 0) out.push(pos - 1)
  if (c < n - 1) out.push(pos + 1)
  return out
}

/**
 * Positions that would move if the tile at `pos` were pushed toward the gap
 * (the tile itself and every tile between it and the gap), or null when the
 * tile isn't in the gap's row or column.
 */
export function chainToGap(board: readonly number[], n: number, pos: number): number[] | null {
  const e = findEmpty(board)
  if (pos === e || pos < 0 || pos >= board.length) return null
  const step = stepToward(e, pos, n)
  if (step === null) return null
  const out: number[] = []
  for (let cur = pos; cur !== e; cur -= step) out.push(cur)
  return out
}

/** The index step from the gap `e` toward `pos`, or null if not in line. */
function stepToward(e: number, pos: number, n: number): number | null {
  const er = Math.floor(e / n)
  const ec = e % n
  const pr = Math.floor(pos / n)
  const pc = pos % n
  if (er === pr && ec !== pc) return pc > ec ? 1 : -1
  if (ec === pc && er !== pr) return pr > er ? n : -n
  return null
}

/** Which way the tile at `pos` would travel to reach the gap, or null. */
export function directionOf(board: readonly number[], n: number, pos: number): Direction | null {
  const e = findEmpty(board)
  const step = stepToward(e, pos, n)
  if (step === null) return null
  if (step === 1) return 'left'
  if (step === -1) return 'right'
  if (step === n) return 'up'
  return 'down'
}

/**
 * Slides the tile at `pos` (and the tiles between it and the gap) one step
 * toward the gap. Returns the new board and how many tiles moved, or null for
 * an illegal move.
 */
export function slideFrom(board: readonly number[], n: number, pos: number): { board: number[]; moved: number } | null {
  const e = findEmpty(board)
  if (pos === e || pos < 0 || pos >= board.length) return null
  const step = stepToward(e, pos, n)
  if (step === null) return null
  const next = board.slice()
  let cur = e
  let moved = 0
  while (cur !== pos) {
    next[cur] = next[cur + step]
    cur += step
    moved++
  }
  next[pos] = emptyId(n)
  return { board: next, moved }
}

/** The position of the tile that would move into the gap for a given direction, or null at an edge. */
export function sourceForDirection(board: readonly number[], n: number, dir: Direction): number | null {
  const e = findEmpty(board)
  const r = Math.floor(e / n)
  const c = e % n
  switch (dir) {
    case 'left':
      return c < n - 1 ? e + 1 : null
    case 'right':
      return c > 0 ? e - 1 : null
    case 'up':
      return r < n - 1 ? e + n : null
    case 'down':
      return r > 0 ? e - n : null
  }
}

/**
 * A guaranteed-solvable scramble: random legal moves from the solved state
 * (never immediately undoing the previous one). Retries until the board is
 * properly mixed up.
 */
export function shuffleBoard(n: number, random: () => number = Math.random): number[] {
  const total = n * n
  const empty = emptyId(n)
  const minMisplaced = Math.ceil((total - 1) * 0.6)

  for (let attempt = 0; attempt < 40; attempt++) {
    const board = solvedBoard(n)
    let e = empty
    let prev = -1
    const steps = total * 20 + Math.floor(random() * n)
    for (let i = 0; i < steps; i++) {
      const options = neighbours(e, n).filter((p) => p !== prev)
      const next = options[Math.floor(random() * options.length)]
      board[e] = board[next]
      board[next] = empty
      prev = e
      e = next
    }
    if (!isSolved(board) && total - 1 - countCorrect(board) >= minMisplaced) return board
  }

  // Practically unreachable; still return something legal and unsolved.
  const fallback = solvedBoard(n)
  fallback[empty] = empty - 1
  fallback[empty - 1] = empty
  return fallback
}

/**
 * Where to place a photo so it covers an S×S square, focused slightly above
 * centre (faces in portrait phone photos).
 */
export function cropGeometry(photo: { width: number; height: number }, boardPx: number, focusY = 0.35) {
  const w = Math.max(1, photo.width)
  const h = Math.max(1, photo.height)
  const scale = boardPx / Math.min(w, h)
  const bgW = w * scale
  const bgH = h * scale
  return {
    bgW,
    bgH,
    offX: (bgW - boardPx) * 0.5,
    offY: (bgH - boardPx) * focusY,
  }
}
