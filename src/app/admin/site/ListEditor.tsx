'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { ui } from '../_components/ui'

export interface ListField<T> {
  key: Extract<keyof T, string>
  label: string
  placeholder?: string
  /** "emoji" renders a narrow box next to the next field; "long" renders a textarea. */
  kind?: 'emoji' | 'text' | 'long'
  maxLength?: number
}

/**
 * Editable list of small objects (coupons, wheel prizes): add, remove and move
 * items up/down. Each item keeps its id so saved progress in the games stays linked.
 */
export default function ListEditor<T extends { id: string }>({
  items,
  onChange,
  fields,
  makeNew,
  itemName,
  min = 0,
}: {
  items: T[]
  onChange: (items: T[]) => void
  fields: ListField<T>[]
  makeNew: () => T
  itemName: string
  min?: number
}) {
  const update = (index: number, key: Extract<keyof T, string>, value: string) => {
    onChange(items.map((item, i) => (i === index ? ({ ...item, [key]: value } as T) : item)))
  }
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const emojiField = fields.find((f) => f.kind === 'emoji')
  const mainField = fields.find((f) => f.kind !== 'emoji' && f.kind !== 'long')
  const longFields = fields.filter((f) => f.kind === 'long')

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {items.map((item, index) => {
          const n = index + 1
          return (
            <li key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="hidden min-[400px]:block mt-2.5 w-5 shrink-0 text-right text-xs font-semibold text-gray-400" aria-hidden="true">
                  {n}
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex gap-2">
                    {emojiField && (
                      <label className="shrink-0 w-14">
                        <span className="sr-only">
                          {emojiField.label} for {itemName} {n}
                        </span>
                        <input
                          type="text"
                          value={String(item[emojiField.key] ?? '')}
                          onChange={(e) => update(index, emojiField.key, e.target.value)}
                          placeholder={emojiField.placeholder ?? '💝'}
                          maxLength={emojiField.maxLength ?? 16}
                          className={`${ui.input} text-center`}
                        />
                      </label>
                    )}
                    {mainField && (
                      <label className="flex-1 min-w-0">
                        <span className="sr-only">
                          {mainField.label} for {itemName} {n}
                        </span>
                        <input
                          type="text"
                          value={String(item[mainField.key] ?? '')}
                          onChange={(e) => update(index, mainField.key, e.target.value)}
                          placeholder={mainField.placeholder ?? mainField.label}
                          maxLength={mainField.maxLength ?? 80}
                          className={`${ui.input} font-medium`}
                        />
                      </label>
                    )}
                  </div>
                  {longFields.map((field) => (
                    <label key={field.key} className="block">
                      <span className="sr-only">
                        {field.label} for {itemName} {n}
                      </span>
                      <textarea
                        value={String(item[field.key] ?? '')}
                        onChange={(e) => update(index, field.key, e.target.value)}
                        placeholder={field.placeholder ?? field.label}
                        maxLength={field.maxLength ?? 240}
                        rows={2}
                        className={ui.textarea}
                      />
                    </label>
                  ))}
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className={ui.iconButton} aria-label={`Move ${itemName} ${n} up`}>
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    className={ui.iconButton}
                    aria-label={`Move ${itemName} ${n} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={items.length <= min}
                    className={ui.dangerIconButton}
                    aria-label={`Remove ${itemName} ${n}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      <button type="button" onClick={() => onChange([...items, makeNew()])} className={`${ui.secondaryButton} w-full border border-dashed border-gray-300`}>
        <Plus className="w-4 h-4" aria-hidden="true" /> Add {itemName}
      </button>
    </div>
  )
}
