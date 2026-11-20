'use client'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function Digit({ value }: { value: number }) {
  return (
    <span className="relative block h-[1.15em] w-[1ch] overflow-hidden">
      <span
        className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.25,1.08)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1.15em] text-center leading-[1.15em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  )
}

interface RollingNumberProps {
  value: number
  /** Pad with leading zeros to at least this many digits */
  minDigits?: number
  /** While false every digit sits at 0, so turning it on rolls the digits up to the value */
  active?: boolean
  /** Add thousands separators */
  group?: boolean
  className?: string
}

/** Odometer-style number: each digit is a column that rolls to its value. */
export default function RollingNumber({ value, minDigits = 1, active = true, group = false, className = '' }: RollingNumberProps) {
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
  const raw = String(safe).padStart(minDigits, '0')
  const text = group ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : raw
  return (
    <span className={`inline-flex items-start tabular-nums lining-nums ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline-flex">
        {Array.from(text).map((ch, i) =>
          ch >= '0' && ch <= '9' ? (
            <Digit key={`${text.length - i}`} value={active ? Number(ch) : 0} />
          ) : (
            <span key={`sep-${text.length - i}`} className="block h-[1.15em] leading-[1.15em]">
              {ch}
            </span>
          ),
        )}
      </span>
    </span>
  )
}
