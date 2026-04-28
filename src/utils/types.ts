import type { ReactNode } from 'react'

export type DatePickerMode = 'single' | 'range'

/**
 * v0.3.0 — orthogonal selection axis. `single | range | multi | time`.
 * The legacy `mode` prop normalizes to this internally.
 */
export type SelectionMode = 'single' | 'range' | 'multi'

/**
 * v0.3.0 — orthogonal view granularity axis. Component still defaults to `day`
 * for backward compat; non-day views land in Lane 2.
 */
export type CalendarView = 'day' | 'week' | 'month' | 'year' | 'time'

/**
 * v0.3.0 — discriminated union representing the picker's current selection.
 * Internal state is always shaped like this; the component still emits the
 * legacy `OnDateChangePayload` to existing `onDateChange` consumers.
 */
export type Selection =
  | { kind: 'single'; date: Date | null }
  | { kind: 'range'; start: Date | null; end: Date | null }
  | { kind: 'multi'; dates: Set<string> }
  | { kind: 'time'; date: Date | null; hour: number; minute: number }

export type DateRange = {
  startDate: Date | null
  endDate: Date | null
}

export type Holiday = {
  /** Format: 'MM-DD' (recurring yearly) or 'YYYY-MM-DD' (specific date) */
  date: string
  /** Display label shown next to/under the date */
  label: string
  /** Override label text color (falls back to theme.holidayColor) */
  color?: string
  /** Optional icon rendered alongside holiday (reserved for future use) */
  icon?: ReactNode
  /** Emphasize holiday (e.g. bold text) */
  important?: boolean
}

export interface DateItem {
  id: string
  day: number
  fullDate: string
  dayName: string
  monthName: string
  isSunday: boolean
  isSaturday: boolean
  isToday: boolean
  isHoliday: boolean
  holidayLabel?: string
  isEmpty: boolean
}

export interface MonthData {
  id: string
  year: number
  month: number
  monthName: string
  days: DateItem[]
}

export type OnDateChangePayload = {
  startDate: Date | null
  endDate: Date | null
}
