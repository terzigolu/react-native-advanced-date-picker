import type { ReactNode } from 'react'

export type DatePickerMode = 'single' | 'range'

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
