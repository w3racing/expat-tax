import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { parseNightsInput } from '@/features/overnight-planner/utils/parse-nights'

type OvernightCellInputProps = {
  value: number
  monthKey: string
  destinationId: string
  destinationName: string
  monthLabel: string
  rowIndex: number
  colIndex: number
  onCommit: (nights: number) => void
  onNavigate: (row: number, col: number) => void
  className?: string
}

export function OvernightCellInput({
  value,
  monthKey,
  destinationId,
  destinationName,
  monthLabel,
  rowIndex,
  colIndex,
  onCommit,
  onNavigate,
  className,
}: OvernightCellInputProps) {
  const [text, setText] = useState(value > 0 ? String(value) : '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setText(value > 0 ? String(value) : '')
    setError(null)
  }, [value])

  const commit = (raw: string) => {
    const parsed = parseNightsInput(raw)
    if (!parsed.ok) {
      setError(parsed.error)
      setText(value > 0 ? String(value) : '')
      return
    }
    setError(null)
    setText(parsed.nights > 0 ? parsed.display : '')
    if (parsed.nights !== value) onCommit(parsed.nights)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const el = inputRef.current
    const atStart = el != null && el.selectionStart === 0 && el.selectionEnd === 0
    const atEnd =
      el != null && el.selectionStart === text.length && el.selectionEnd === text.length

    if (e.key === 'Enter') {
      e.preventDefault()
      commit(text)
      onNavigate(rowIndex + 1, colIndex)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      commit(text)
      onNavigate(rowIndex + 1, colIndex)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      commit(text)
      onNavigate(rowIndex - 1, colIndex)
      return
    }
    if (e.key === 'ArrowRight' && (e.altKey || atEnd)) {
      e.preventDefault()
      commit(text)
      onNavigate(rowIndex, colIndex + 1)
      return
    }
    if (e.key === 'ArrowLeft' && (e.altKey || atStart)) {
      e.preventDefault()
      commit(text)
      onNavigate(rowIndex, colIndex - 1)
      return
    }
    if (e.key === 'Escape') {
      setText(value > 0 ? String(value) : '')
      setError(null)
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        aria-invalid={error ? true : undefined}
        aria-label={`Overnights in ${destinationName}, ${monthLabel}`}
        className={cn(
          'h-12 w-full min-w-[3.25rem] rounded-xl border bg-background px-1 text-center font-display text-lg font-semibold tabular-nums tracking-tight',
          'text-foreground shadow-xs transition-colors',
          'placeholder:text-muted-foreground/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          error
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-primary/40 focus-visible:border-primary',
          value > 0 && !error && 'border-primary/30 bg-primary-soft/40 dark:bg-primary/10',
        )}
        data-overnight-cell={`${rowIndex}:${colIndex}`}
        data-destination-id={destinationId}
        data-month-key={monthKey}
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="—"
        value={text}
        onBlur={() => commit(text)}
        onChange={(e) => {
          const next = e.target.value
          if (next !== '' && !/^\d*$/.test(next)) {
            setError('Enter a whole number of nights')
            return
          }
          const parsed = parseNightsInput(next)
          setText(next)
          setError(parsed.ok ? null : parsed.error)
          if (parsed.ok && parsed.nights !== value) {
            onCommit(parsed.nights)
          }
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={onKeyDown}
      />
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export function focusOvernightCell(row: number, col: number) {
  const el = document.querySelector<HTMLInputElement>(
    `[data-overnight-cell="${row}:${col}"]`,
  )
  el?.focus()
  el?.select()
}
