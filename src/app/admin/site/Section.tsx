'use client'

import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function Section({
  id,
  icon: Icon,
  title,
  description,
  onReset,
  resetDisabled,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  description?: ReactNode
  onReset?: () => void
  resetDisabled?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="bg-white p-4 sm:p-6 md:p-7 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 scroll-mt-20 md:scroll-mt-8">
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-start justify-between gap-2 sm:gap-4 mb-5">
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-serif font-bold text-gray-900">
            <Icon className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
            {title}
          </h2>
          {description && <div className="mt-1 text-sm text-gray-500">{description}</div>}
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={resetDisabled}
            className="self-start shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset section to defaults
          </button>
        )}
      </div>
      {children}
    </section>
  )
}
