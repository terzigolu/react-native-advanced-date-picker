import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CalendarView,
  Holiday,
  MonthData,
  OnDateChangePayload,
  Selection,
  SelectionMode,
} from '../utils/types'
import type { Locale } from '../locale/types'
import type { CalendarEngine } from '../calendars/types'
import { gregorian } from '../calendars/gregorian'
import {
  clampRange,
  formatDateKey,
  isDateBlocked,
  isDateInRange,
  isSameDate,
} from '../utils/dateUtils'
import type { DisabledRange } from '../utils/dateUtils'

export type UseDatePickerOptions = {
  /** v0.3.0 — orthogonal selection axis. */
  selectionMode?: SelectionMode
  /** v0.3.0 — orthogonal view granularity. Lane 0 only ships `'day'`. */
  view?: CalendarView
  /** v0.3.0 — toggles datetime mode when paired with `view='day'`. */
  enableTime?: boolean
  /** v0.3.0 — controlled / initial selection union. */
  initialSelection?: Selection

  // ---- Legacy props (backward compat) ----
  /** Legacy: `'single' | 'range'`. Maps to `selectionMode`. */
  mode?: 'single' | 'range'
  /** Legacy: scalar start date. */
  startDate?: Date | null
  /** Legacy: scalar end date. */
  endDate?: Date | null
  /**
   * Lane 1 — legacy adapter when working in multi mode. Array of `Date`s is
   * normalised to ISO `YYYY-MM-DD` keys and seeded into the union.
   */
  selectedDates?: Date[] | null

  // ---- Common ----
  minDate?: Date
  maxDate?: Date
  locale?: Locale | string
  engine?: CalendarEngine
  holidays?: Holiday[]
  months?: number
  startFrom?: Date
  disabledDates?: (string | Date)[]
  /**
   * Lane 1 — declarative disabled ranges (reservation calendar booked nights).
   * Any date inside any of these ranges is treated as `isBlocked + isDisabled`
   * and tap is short-circuited (no emit).
   */
  disabledRanges?: DisabledRange[]
  /**
   * Lane 1 — minimum inclusive day count for a `range` selection. When the
   * user picks an end-date that produces a span shorter than this, the end
   * is clamped forward to satisfy the constraint.
   */
  minRangeLength?: number
  /**
   * Lane 1 — maximum inclusive day count for a `range` selection. When the
   * user picks an end-date that produces a span longer than this, the end
   * is pulled back to satisfy the constraint.
   */
  maxRangeLength?: number
  /**
   * Lane 1 — fired (with `'min' | 'max'`) when a range selection had to be
   * clamped to satisfy `minRangeLength` / `maxRangeLength`. Consumers can
   * surface a Toast / haptic / a11y announcement; the hook itself stays
   * silent so it remains zero-dep + RN/Web safe.
   */
  onRangeClamp?: (reason: 'min' | 'max') => void

  // ---- Emit channels ----
  /** v0.3.0 — fires whenever the selection changes (any kind). */
  onChange?: (selection: Selection) => void
  /** Legacy: fires with `{ startDate, endDate }` shape on every change. */
  onDateChange?: (payload: OnDateChangePayload) => void
}

export type DayProps = {
  onPress: () => void
  isSelected: boolean
  isInRange: boolean
  isDisabled: boolean
  isToday: boolean
  isHoliday: boolean
  /** Lane 1 — true when the date sits inside a `disabledRanges` window. */
  isBlocked: boolean
}

export type UseDatePickerReturn = {
  selection: Selection
  calendarData: MonthData[]
  isSelected: (date: Date) => boolean
  isInRange: (date: Date) => boolean
  isDisabled: (date: Date) => boolean
  /** Lane 1 — true when `date` is inside any consumer-supplied `disabledRanges`. */
  isBlocked: (date: Date) => boolean
  /** Lane 1 — set of selected ISO `YYYY-MM-DD` keys when in `multi` mode. */
  selectedDateKeys: Set<string>
  dayProps: (date: Date) => DayProps
  handlers: {
    selectDate: (date: Date) => void
    clear: () => void
    /**
     * Replace the selection. Accepts either a value or a functional updater
     * (so legacy two-callback flows can read the freshest state).
     */
    setSelection: (
      next: Selection | ((prev: Selection) => Selection),
    ) => void
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const localeCode = (l: Locale | string | undefined): string =>
  l == null ? 'en' : typeof l === 'string' ? l : l.code

const zeroTime = (d: Date): Date => {
  const out = new Date(d.getTime())
  out.setHours(0, 0, 0, 0)
  return out
}

const emptySelectionFor = (mode: SelectionMode): Selection => {
  if (mode === 'range') return { kind: 'range', start: null, end: null }
  if (mode === 'multi') return { kind: 'multi', dates: new Set<string>() }
  return { kind: 'single', date: null }
}

/**
 * Bridge legacy `mode/startDate/endDate` props into the union shape. New
 * `initialSelection` always wins when supplied.
 */
export const propsToSelection = (opts: {
  selectionMode?: SelectionMode
  initialSelection?: Selection
  mode?: 'single' | 'range'
  startDate?: Date | null
  endDate?: Date | null
  /** Lane 1 — legacy adapter for `<AdvancedDatePicker selectedDates={...} />`. */
  selectedDates?: Date[] | null
}): Selection => {
  if (opts.initialSelection) return opts.initialSelection
  const sm: SelectionMode =
    opts.selectionMode ?? (opts.mode === 'range' ? 'range' : 'single')

  if (sm === 'range') {
    return {
      kind: 'range',
      start: opts.startDate ?? null,
      end: opts.endDate ?? null,
    }
  }
  if (sm === 'multi') {
    const seeds = opts.selectedDates ?? []
    const dates = new Set<string>()
    for (const d of seeds) {
      if (d && !isNaN(d.getTime())) {
        const z = new Date(d.getTime())
        z.setHours(0, 0, 0, 0)
        dates.add(formatDateKey(z))
      }
    }
    return { kind: 'multi', dates }
  }
  return { kind: 'single', date: opts.startDate ?? null }
}

/** Project the union into the legacy `{ startDate, endDate }` shape. */
const selectionToLegacyPayload = (s: Selection): OnDateChangePayload => {
  if (s.kind === 'range') return { startDate: s.start, endDate: s.end }
  if (s.kind === 'single') return { startDate: s.date, endDate: null }
  if (s.kind === 'time') return { startDate: s.date, endDate: null }
  // multi → expose the earliest selected ISO key as a "startDate" fallback
  if (s.dates.size === 0) return { startDate: null, endDate: null }
  const sorted = [...s.dates].sort()
  return { startDate: new Date(sorted[0]), endDate: null }
}

const datesEqual = (a: Date | null, b: Date | null): boolean => {
  if (a === b) return true
  if (!a || !b) return false
  return a.getTime() === b.getTime()
}

const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a === b) return true
  if (a.size !== b.size) return false
  for (const v of a) if (!b.has(v)) return false
  return true
}

export const selectionEqual = (a: Selection, b: Selection): boolean => {
  if (a.kind !== b.kind) return false
  switch (a.kind) {
    case 'single':
      return datesEqual(a.date, (b as typeof a).date)
    case 'range': {
      const bb = b as typeof a
      return datesEqual(a.start, bb.start) && datesEqual(a.end, bb.end)
    }
    case 'multi':
      return setsEqual(a.dates, (b as typeof a).dates)
    case 'time': {
      const bb = b as typeof a
      return (
        datesEqual(a.date, bb.date) &&
        a.hour === bb.hour &&
        a.minute === bb.minute
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type SelectAction = {
  type: 'select'
  date: Date
  minRangeLength?: number
  maxRangeLength?: number
  onRangeClamp?: (reason: 'min' | 'max') => void
}
type ClearAction = { type: 'clear' }
type SetAction = { type: 'set'; selection: Selection }
type Action = SelectAction | ClearAction | SetAction

const reduce = (state: Selection, action: Action): Selection => {
  switch (action.type) {
    case 'set':
      return action.selection
    case 'clear':
      return emptySelectionFor(state.kind === 'time' ? 'single' : state.kind)
    case 'select': {
      const date = zeroTime(action.date)
      switch (state.kind) {
        case 'single':
          return { kind: 'single', date }
        case 'range': {
          if (!state.start || (state.start && state.end)) {
            return { kind: 'range', start: date, end: null }
          }
          // start exists, end null
          if (date >= state.start) {
            // Lane 1 — apply min/max range length constraints. The clamp helper
            // returns `{ start, end, wasClamped }`; we surface the reason
            // through `onRangeClamp` so the UI layer can announce / toast.
            const clamped = clampRange(
              state.start,
              date,
              action.minRangeLength,
              action.maxRangeLength,
            )
            if (clamped.wasClamped && action.onRangeClamp) {
              const length =
                Math.floor(
                  (date.getTime() - state.start.getTime()) / MS_PER_DAY,
                ) + 1
              const reason: 'min' | 'max' =
                typeof action.minRangeLength === 'number' &&
                length < action.minRangeLength
                  ? 'min'
                  : 'max'
              action.onRangeClamp(reason)
            }
            return {
              kind: 'range',
              start: clamped.start,
              end: clamped.end,
            }
          }
          return { kind: 'range', start: date, end: null }
        }
        case 'multi': {
          const key = formatDateKey(date)
          const next = new Set(state.dates)
          if (next.has(key)) next.delete(key)
          else next.add(key)
          return { kind: 'multi', dates: next }
        }
        case 'time':
          return {
            kind: 'time',
            date,
            hour: state.hour,
            minute: state.minute,
          }
      }
    }
  }
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const useDatePicker = (
  options: UseDatePickerOptions = {},
): UseDatePickerReturn => {
  const {
    selectionMode,
    initialSelection,
    mode,
    startDate,
    endDate,
    selectedDates,
    minDate,
    maxDate,
    locale,
    engine = gregorian,
    holidays = [],
    months = 12,
    startFrom,
    disabledDates = [],
    disabledRanges,
    minRangeLength,
    maxRangeLength,
    onRangeClamp,
    onChange,
    onDateChange,
  } = options

  // Initial selection — derive from new or legacy props.
  const initialRef = useRef<Selection | null>(null)
  if (initialRef.current === null) {
    initialRef.current = propsToSelection({
      selectionMode,
      initialSelection,
      mode,
      startDate,
      endDate,
      selectedDates,
    })
  }

  const [selection, setSelectionState] = useState<Selection>(initialRef.current)

  // Track last-emitted to ignore prop echo.
  const lastEmittedRef = useRef<Selection>(selection)

  // Sync from legacy scalar props if they actually change away from what we
  // emitted last (mirrors the v0.2.x echo-suppression pattern).
  useEffect(() => {
    if (selection.kind !== 'range' && selection.kind !== 'single') return
    const incoming = propsToSelection({
      selectionMode,
      mode,
      startDate,
      endDate,
    })
    if (selectionEqual(incoming, lastEmittedRef.current)) return
    if (selectionEqual(incoming, selection)) return
    setSelectionState(incoming)
    lastEmittedRef.current = incoming
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, mode, selectionMode])

  // Calendar grid via engine
  const localeForEngine: Locale | string =
    typeof locale === 'object' && locale !== null ? locale : localeCode(locale)

  const calendarData = useMemo<MonthData[]>(() => {
    const today = engine.today()
    const start = startFrom || today
    const startYear = start.getFullYear()
    const startMonth = start.getMonth()
    const data: MonthData[] = []
    for (let i = 0; i < months; i++) {
      const m = (startMonth + i) % 12
      const y = startYear + Math.floor((startMonth + i) / 12)
      data.push(engine.generateMonth(y, m, localeForEngine, holidays, today))
    }
    return data
  }, [engine, months, startFrom, holidays, localeForEngine])

  // Disabled lookup — pre-zeroed Set of timestamps (number).
  const disabledLookup = useMemo<Set<number>>(() => {
    const s = new Set<number>()
    for (const d of disabledDates) {
      const parsed = typeof d === 'string' ? new Date(d) : new Date(d.getTime())
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0)
        s.add(parsed.getTime())
      }
    }
    return s
  }, [disabledDates])

  const minZ = useMemo(() => (minDate ? zeroTime(minDate) : null), [minDate])
  const maxZ = useMemo(() => (maxDate ? zeroTime(maxDate) : null), [maxDate])

  const isBlockedFn = useCallback(
    (date: Date): boolean => isDateBlocked(date, disabledRanges),
    [disabledRanges],
  )

  const isDisabled = useCallback(
    (date: Date): boolean => {
      const z = zeroTime(date)
      if (disabledLookup.has(z.getTime())) return true
      if (minZ && z < minZ) return true
      if (maxZ && z > maxZ) return true
      if (isBlockedFn(z)) return true
      return false
    },
    [disabledLookup, minZ, maxZ, isBlockedFn],
  )

  const isSelectedFn = useCallback(
    (date: Date): boolean => {
      switch (selection.kind) {
        case 'single':
          return isSameDate(selection.date, date)
        case 'range':
          return (
            isSameDate(selection.start, date) || isSameDate(selection.end, date)
          )
        case 'multi':
          return selection.dates.has(formatDateKey(zeroTime(date)))
        case 'time':
          return isSameDate(selection.date, date)
      }
    },
    [selection],
  )

  const isInRangeFn = useCallback(
    (date: Date): boolean => {
      if (selection.kind !== 'range') return false
      const z = zeroTime(date)
      return isDateInRange(z, selection.start, selection.end)
    },
    [selection],
  )

  // Emit on change — distinguishing from initial mount.
  const isFirstEmit = useRef(true)
  useEffect(() => {
    if (isFirstEmit.current) {
      isFirstEmit.current = false
      lastEmittedRef.current = selection
      return
    }
    if (selectionEqual(selection, lastEmittedRef.current)) return
    lastEmittedRef.current = selection
    onChange?.(selection)
    onDateChange?.(selectionToLegacyPayload(selection))
  }, [selection, onChange, onDateChange])

  const selectDate = useCallback(
    (date: Date) => {
      if (isDisabled(date)) return
      setSelectionState(prev =>
        reduce(prev, {
          type: 'select',
          date,
          minRangeLength,
          maxRangeLength,
          onRangeClamp,
        }),
      )
    },
    [isDisabled, minRangeLength, maxRangeLength, onRangeClamp],
  )

  const clear = useCallback(() => {
    setSelectionState(prev => reduce(prev, { type: 'clear' }))
  }, [])

  const setSelection = useCallback(
    (next: Selection | ((prev: Selection) => Selection)) => {
      setSelectionState(prev => {
        const value = typeof next === 'function' ? next(prev) : next
        return reduce(prev, { type: 'set', selection: value })
      })
    },
    [],
  )

  const dayProps = useCallback(
    (date: Date): DayProps => {
      const z = zeroTime(date)
      const today = engine.today()
      return {
        onPress: () => selectDate(z),
        isSelected: isSelectedFn(z),
        isInRange: isInRangeFn(z),
        isDisabled: isDisabled(z),
        isToday: isSameDate(z, today),
        isHoliday: false, // populated by `DateItem.isHoliday` at render time
        isBlocked: isBlockedFn(z),
      }
    },
    [engine, selectDate, isSelectedFn, isInRangeFn, isDisabled, isBlockedFn],
  )

  // Lane 1 — multi-mode consumers want a single Set reference instead of
  // pulling it out of the discriminated union at every render. Empty Set when
  // selection is not multi.
  const selectedDateKeys = useMemo<Set<string>>(() => {
    if (selection.kind === 'multi') return selection.dates
    return new Set<string>()
  }, [selection])

  return {
    selection,
    calendarData,
    isSelected: isSelectedFn,
    isInRange: isInRangeFn,
    isDisabled,
    isBlocked: isBlockedFn,
    selectedDateKeys,
    dayProps,
    handlers: { selectDate, clear, setSelection },
  }
}

export default useDatePicker
