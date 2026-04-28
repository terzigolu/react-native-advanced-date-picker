import type { DateItem, Holiday, MonthData } from '../utils/types'
import type { Locale } from '../locale/types'
import type { CalendarEngine, EngineLocale } from './types'

/**
 * Persian (Jalali / Shamsi) calendar engine — algorithmic, zero-dep.
 *
 * Implementation follows Borkowski's astronomical algorithm (the same one
 * used by jalaali-js and most reference Iranian-government tooling). It is
 * accurate from 1 AP through ~2820 AP without any cycle table.
 *
 * Public surface (`generateMonth(year, month, ...)`, `addMonths`, etc.) takes
 * **Jalali years** and **Jalali month indices** (0=Farvardin … 11=Esfand).
 * Internally we round-trip through Gregorian only to derive `Date` instances
 * for holiday/today comparison.
 */

// ---------------------------------------------------------------------------
// Borkowski conversion (Jalali ↔ Gregorian)
// ---------------------------------------------------------------------------

// Borkowski / jalaali-js use truncation-toward-zero, NOT floor. They differ
// for negative dividends (e.g. `gm - 8` when `gm < 8`). Using `Math.floor`
// here breaks the g2d/d2g round-trip.
const div = (a: number, b: number): number => ~~(a / b)
const mod = (a: number, b: number): number => a - ~~(a / b) * b

interface JalaliCal {
  leap: number // 0 if leap, otherwise 1..3
  gy: number
  march: number // Gregorian day-in-March of 1 Farvardin
}

/**
 * Internal helper from Borkowski. Returns leap-year info for a Jalali year.
 */
const jalCal = (jy: number): JalaliCal => {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ]
  const bl = breaks.length
  const gy = jy + 621
  let leapJ = -14
  let jp = breaks[0]
  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error(`Persian engine: year ${jy} out of supported range`)
  }
  let jump = 0
  let i: number
  for (i = 1; i < bl; i++) {
    const jm = breaks[i]
    jump = jm - jp
    if (jy < jm) break
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
    jp = jm
  }
  let n = jy - jp
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
  const march = 20 + leapJ - leapG
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
  let leap = mod(mod(n + 1, 33) - 1, 4)
  if (leap === -1) leap = 4
  return { leap, gy, march }
}

const isJalaliLeap = (jy: number): boolean => jalCal(jy).leap === 0

/**
 * Days in Jalali month: 0..5 → 31, 6..10 → 30, 11 → 29 or 30 (leap).
 */
const daysInJalaliMonth = (jy: number, jm0: number): number => {
  if (jm0 < 6) return 31
  if (jm0 < 11) return 30
  return isJalaliLeap(jy) ? 30 : 29
}

const isGregorianLeap = (gy: number): boolean =>
  (mod(gy, 4) === 0 && mod(gy, 100) !== 0) || mod(gy, 400) === 0

/**
 * Julian Day Number for a Gregorian date.
 */
const g2d = (gy: number, gm1: number, gd: number): number => {
  let d =
    div((gy + div(gm1 - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm1 + 9, 12) + 2, 5) +
    gd -
    34840408
  d = d - div(div(gy + 100100 + div(gm1 - 8, 6), 100) * 3, 4) + 752
  return d
}

/**
 * Inverse of g2d.
 */
const d2g = (jdn: number): { gy: number; gm: number; gd: number } => {
  let j = 4 * jdn + 139361631
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
  const i = div(mod(j, 1461), 4) * 5 + 308
  const gd = div(mod(i, 153), 5) + 1
  const gm = mod(div(i, 153), 12) + 1
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
  return { gy, gm, gd }
}

/**
 * Jalali → Gregorian.
 */
const jalaliToGregorian = (
  jy: number,
  jm0: number,
  jd: number,
): { gy: number; gm0: number; gd: number } => {
  const { gy, march } = jalCal(jy)
  const jdn =
    g2d(gy, 3, march) +
    (jm0 < 6 ? jm0 * 31 : jm0 * 30 + 6) +
    jd -
    1
  const g = d2g(jdn)
  return { gy: g.gy, gm0: g.gm - 1, gd: g.gd }
}

/**
 * Gregorian → Jalali.
 */
const gregorianToJalali = (
  gy: number,
  gm0: number,
  gd: number,
): { jy: number; jm0: number; jd: number } => {
  const jdn = g2d(gy, gm0 + 1, gd)
  let jy = gy - 621
  const r = jalCal(jy)
  const jdn1f = g2d(r.gy, 3, r.march)
  let k = jdn - jdn1f
  if (k >= 0) {
    if (k <= 185) {
      const jm0 = div(k, 31)
      const jd = mod(k, 31) + 1
      return { jy, jm0, jd }
    }
    k -= 186
  } else {
    jy -= 1
    k += 179
    if (jalCal(jy).leap === 1) k += 1
  }
  const jm0 = 6 + div(k, 30)
  const jd = mod(k, 30) + 1
  return { jy, jm0, jd }
}

// ---------------------------------------------------------------------------
// Engine helpers
// ---------------------------------------------------------------------------

const localeCode = (l: EngineLocale): string =>
  typeof l === 'string' ? l : (l as Locale).code

const localeMonths = (l: EngineLocale): string[] | undefined =>
  typeof l === 'string' ? undefined : (l as Locale).monthNames

let idCounter = 0
const generateId = (): string => `adp_p_${Date.now()}_${++idCounter}`

const PERSIAN_MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const PERSIAN_MONTHS_EN = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
]

/**
 * Try to fetch month name via `Intl` (`calendar: 'persian'`); fall back to
 * the hardcoded Farsi/English tables if not available.
 */
const intlPersianMonth = (
  date: Date,
  code: string,
): string | undefined => {
  try {
    const fmt = new Intl.DateTimeFormat(`${code}-u-ca-persian`, {
      month: 'long',
    })
    const out = fmt.format(date)
    if (out && out !== String(date.getMonth() + 1)) return out
  } catch {
    /* swallow */
  }
  return undefined
}

const persianMonthNameAt = (jm0: number, locale: EngineLocale): string => {
  const fromLocale = localeMonths(locale)
  if (fromLocale && fromLocale[jm0]) return fromLocale[jm0]
  const code = localeCode(locale)
  // Try Intl first using a representative Gregorian date matching this Jalali month.
  if (code) {
    // 15th of the month is a safe representative day
    const g = jalaliToGregorian(1403, jm0, 15)
    const date = new Date(g.gy, g.gm0, g.gd)
    const intl = intlPersianMonth(date, code)
    if (intl) return intl
  }
  return code && code.startsWith('fa')
    ? PERSIAN_MONTHS_FA[jm0]
    : PERSIAN_MONTHS_EN[jm0]
}

const dayNameViaIntl = (date: Date, locale: EngineLocale): string => {
  const code = localeCode(locale)
  try {
    return new Intl.DateTimeFormat(code, { weekday: 'long' }).format(date)
  } catch {
    return date.toDateString().split(' ')[0]
  }
}

const shortDayNames = (
  locale: EngineLocale,
  startOnMonday = true,
): string[] => {
  const code = localeCode(locale)
  const baseDate = new Date(2024, 0, 1) // Monday
  const days: string[] = []
  const startOffset = startOnMonday ? 0 : 6
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + ((i + startOffset) % 7))
    try {
      days.push(new Intl.DateTimeFormat(code, { weekday: 'short' }).format(d))
    } catch {
      days.push(d.toDateString().split(' ')[0])
    }
  }
  return days
}

const isSameDayInternal = (a: Date | null, b: Date | null): boolean => {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const formatHolidayKey = (gMonth0: number, gDay: number): string => {
  const mm = String(gMonth0 + 1).padStart(2, '0')
  const dd = String(gDay).padStart(2, '0')
  return `${mm}-${dd}`
}

// ---------------------------------------------------------------------------
// Engine implementation
// ---------------------------------------------------------------------------

const todayJalali = (): Date => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

const getMonthName = (
  jy: number,
  jm0: number,
  locale: EngineLocale,
): string => {
  const name = persianMonthNameAt(jm0, locale)
  return `${name} ${jy}`
}

const generateMonth = (
  jy: number,
  jm0: number,
  locale: EngineLocale,
  holidays: Holiday[],
  today: Date,
): MonthData => {
  const days: DateItem[] = []
  const monthName = getMonthName(jy, jm0, locale)

  const holidayMap = new Map<string, string>()
  for (const h of holidays) holidayMap.set(h.date, h.label)

  const totalDays = daysInJalaliMonth(jy, jm0)

  // Determine starting weekday offset (Monday-based).
  const first = jalaliToGregorian(jy, jm0, 1)
  const firstDate = new Date(first.gy, first.gm0, first.gd)
  const dow = firstDate.getDay() // 0=Sun … 6=Sat
  const startIndex = dow === 0 ? 6 : dow - 1

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

  for (let d = 1; d <= totalDays; d++) {
    const g = jalaliToGregorian(jy, jm0, d)
    const date = new Date(g.gy, g.gm0, g.gd)
    date.setHours(0, 0, 0, 0)
    const dateKey = formatHolidayKey(g.gm0, g.gd)
    const holidayLabel = holidayMap.get(dateKey)

    days.push({
      id: generateId(),
      day: d,
      fullDate: date.toISOString(),
      dayName: dayNameViaIntl(date, locale),
      monthName,
      isSunday: date.getDay() === 0,
      isSaturday: date.getDay() === 6,
      isToday: isSameDayInternal(date, today),
      isHoliday: !!holidayLabel,
      holidayLabel,
      isEmpty: false,
    })
  }

  return {
    id: generateId(),
    year: jy,
    month: jm0,
    monthName,
    days,
  }
}

const addJalaliMonths = (date: Date, count: number): Date => {
  const j = gregorianToJalali(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  let nm = j.jm0 + count
  let ny = j.jy + Math.floor(nm / 12)
  nm = ((nm % 12) + 12) % 12
  const max = daysInJalaliMonth(ny, nm)
  const nd = Math.min(j.jd, max)
  const g = jalaliToGregorian(ny, nm, nd)
  const out = new Date(g.gy, g.gm0, g.gd)
  out.setHours(0, 0, 0, 0)
  return out
}

export const persian: CalendarEngine = {
  id: 'persian',
  today: todayJalali,
  generateMonth,
  getMonthName,
  getDayName: dayNameViaIntl,
  getShortDayNames: shortDayNames,
  addMonths: addJalaliMonths,
  isSameDay: isSameDayInternal,
}

/**
 * Convert a JS Date (Gregorian) to its Jalali equivalent.
 */
export const dateToJalali = (
  date: Date,
): { jy: number; jm0: number; jd: number } =>
  gregorianToJalali(date.getFullYear(), date.getMonth(), date.getDate())

/**
 * Build a JS Date from Jalali components.
 */
export const jalaliToDate = (jy: number, jm0: number, jd: number): Date => {
  const g = jalaliToGregorian(jy, jm0, jd)
  const d = new Date(g.gy, g.gm0, g.gd)
  d.setHours(0, 0, 0, 0)
  return d
}

export const isPersianLeapYear = isJalaliLeap
export const persianDaysInMonth = daysInJalaliMonth

// keep helpers reachable for typecheck without unused warnings
void isGregorianLeap

export default persian
