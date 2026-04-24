export type DatePickerMode = 'single' | 'range'

export type DateRange = {
  startDate: Date | null
  endDate: Date | null
}

export type Holiday = {
  /** Format: 'MM-DD' (e.g. '01-01' for January 1st) */
  date: string
  label: string
}

export interface DateItem {
  id: string
  day: number
  fullDate: string
  dayName: string
  monthName: string
  isSunday: boolean
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
