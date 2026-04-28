import type { DateItem, Holiday, MonthData } from '../utils/types'
import type { Locale } from '../locale/types'
import type { CalendarEngine, EngineLocale } from './types'

let idCounter = 0
const generateId = (): string => `adp_${Date.now()}_${++idCounter}`

const localeCode = (l: EngineLocale): string =>
  typeof l === 'string' ? l : (l as Locale).code

const isSameDateInternal = (a: Date | null, b: Date | null): boolean => {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate()
}

export const getFirstDayOfMonth = (year: number, month: number): number => {
  // 0=Sunday, 1=Monday, ... 6=Saturday
  const day = new Date(year, month, 1).getDay()
  // Convert to Monday-based: 0=Monday, 6=Sunday
  return day === 0 ? 6 : day - 1
}

const formatDateKey = (month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${mm}-${dd}`
}

export const getMonthName = (
  year: number,
  month: number,
  locale: EngineLocale,
): string => {
  const date = new Date(year, month, 1)
  return date.toLocaleString(localeCode(locale), { month: 'long' })
}

export const getDayName = (date: Date, locale: EngineLocale): string => {
  return date.toLocaleString(localeCode(locale), { weekday: 'long' })
}

export const getShortDayNames = (
  locale: EngineLocale,
  startOnMonday = true,
): string[] => {
  const baseDate = new Date(2024, 0, 1) // Monday Jan 1, 2024
  const days: string[] = []
  const startOffset = startOnMonday ? 0 : 6
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + ((i + startOffset) % 7))
    days.push(d.toLocaleString(localeCode(locale), { weekday: 'short' }))
  }
  return days
}

export const addMonths = (date: Date, count: number): Date => {
  const out = new Date(date.getTime())
  const targetMonth = out.getMonth() + count
  out.setDate(1)
  out.setMonth(targetMonth)
  // Clamp day-of-month if shorter (e.g. Jan 31 + 1 month → Feb 28/29)
  const daysInTarget = getDaysInMonth(out.getFullYear(), out.getMonth())
  out.setDate(Math.min(date.getDate(), daysInTarget))
  return out
}

export const generateMonthData = (
  year: number,
  month: number,
  locale: EngineLocale,
  holidays: Holiday[],
  today: Date,
): MonthData => {
  const daysInMonth = getDaysInMonth(year, month)
  const startIndex = getFirstDayOfMonth(year, month)
  const monthName = getMonthName(year, month, locale)

  const holidayMap = new Map<string, string>()
  for (const h of holidays) {
    holidayMap.set(h.date, h.label)
  }

  const days: DateItem[] = []

  // Empty cells for offset
  for (let i = 0; i < startIndex; i++) {
    days.push({
      id: generateId(),
      day: 0,
      fullDate: '',
      dayName: '',
      monthName: '',
      isSunday: false,
      isSaturday: false,
      isToday: false,
      isHoliday: false,
      isEmpty: true,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)
    const dateKey = formatDateKey(month, d)
    const holidayLabel = holidayMap.get(dateKey)

    days.push({
      id: generateId(),
      day: d,
      fullDate: date.toISOString(),
      dayName: getDayName(date, locale),
      monthName,
      isSunday: date.getDay() === 0,
      isSaturday: date.getDay() === 6,
      isToday: isSameDateInternal(date, today),
      isHoliday: !!holidayLabel,
      holidayLabel,
      isEmpty: false,
    })
  }

  return {
    id: generateId(),
    year,
    month,
    monthName,
    days,
  }
}

export const generateCalendarData = (
  months: number,
  locale: EngineLocale,
  holidays: Holiday[],
  startFrom?: Date,
): MonthData[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = startFrom || today
  const startYear = start.getFullYear()
  const startMonth = start.getMonth()

  const data: MonthData[] = []
  for (let i = 0; i < months; i++) {
    const m = (startMonth + i) % 12
    const y = startYear + Math.floor((startMonth + i) / 12)
    data.push(generateMonthData(y, m, locale, holidays, today))
  }

  return data
}

const todayZeroed = (): Date => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export const gregorian: CalendarEngine = {
  id: 'gregorian',
  today: todayZeroed,
  generateMonth: generateMonthData,
  getMonthName,
  getDayName,
  getShortDayNames,
  addMonths,
  isSameDay: (a, b) => isSameDateInternal(a, b),
}

export default gregorian
