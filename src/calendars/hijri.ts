import type { DateItem, Holiday, MonthData } from '../utils/types'
import type { Locale } from '../locale/types'
import type { CalendarEngine, EngineLocale } from './types'

/**
 * Hijri (Islamic) calendar engine — Umm al-Qura variant.
 *
 * Strategy: prefer `Intl.DateTimeFormat({ calendar: 'islamic-umalqura' })`
 * when available (Hermes 0.71+, modern JSC, all browsers). When the runtime
 * does not support that calendar, fall back to a tabular Hijri arithmetic
 * (the standard 30-year cycle Kuwaiti algorithm) — accurate within a day
 * for almost all dates, sufficient for grid generation.
 *
 * Public surface takes Hijri years/months/days. We always own a Gregorian
 * `Date` internally so existing isoString-based UI code keeps working.
 */

// ---------------------------------------------------------------------------
// Intl probe
// ---------------------------------------------------------------------------

let intlSupported: boolean | null = null

const probeIntl = (): boolean => {
  if (intlSupported !== null) return intlSupported
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      numberingSystem: 'latn',
    })
    const parts = fmt.formatToParts(new Date(2024, 6, 7)) // expect Muharram 1446-ish
    const hasYear = parts.some(
      (p) => p.type === 'year' && /\d/.test(p.value) && Number(p.value) > 1300,
    )
    intlSupported = hasYear
  } catch {
    intlSupported = false
  }
  return intlSupported
}

const intlComponents = (
  date: Date,
): { hy: number; hm0: number; hd: number } | null => {
  if (!probeIntl()) return null
  try {
    const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      numberingSystem: 'latn',
    })
    const parts = fmt.formatToParts(date)
    let hy = NaN
    let hm = NaN
    let hd = NaN
    for (const p of parts) {
      if (p.type === 'year') hy = parseInt(p.value, 10)
      else if (p.type === 'month') hm = parseInt(p.value, 10)
      else if (p.type === 'day') hd = parseInt(p.value, 10)
    }
    if (!isNaN(hy) && !isNaN(hm) && !isNaN(hd)) {
      return { hy, hm0: hm - 1, hd }
    }
  } catch {
    /* swallow */
  }
  return null
}

// ---------------------------------------------------------------------------
// Tabular fallback (Kuwaiti / civil Hijri, 30-year cycle)
// ---------------------------------------------------------------------------

const HIJRI_EPOCH_JD = 1948439.5 // 1 Muharram 1 AH (16 July 622 CE Julian)

const isHijriLeapTabular = (hy: number): boolean => {
  // Kuwaiti pattern: year is leap if (11*y + 14) mod 30 < 11
  const r = ((11 * hy + 14) % 30 + 30) % 30
  return r < 11
}

const daysInHijriMonthTabular = (hy: number, hm0: number): number => {
  // months 0,2,4,6,8,10 → 30; months 1,3,5,7,9 → 29; month 11 → 30 leap, 29 normal
  if (hm0 % 2 === 0) return 30
  if (hm0 === 11) return isHijriLeapTabular(hy) ? 30 : 29
  return 29
}

/**
 * Hijri (tabular) → Julian Day Number.
 */
const hijriToJD = (hy: number, hm1: number, hd: number): number => {
  return (
    Math.floor((11 * hy + 3) / 30) +
    354 * hy +
    30 * hm1 -
    Math.floor((hm1 - 1) / 2) +
    hd +
    1948440 -
    386
  )
}

/**
 * Julian Day Number → Hijri (tabular).
 */
const jdToHijri = (jd: number): { hy: number; hm0: number; hd: number } => {
  jd = Math.floor(jd) + 0.5
  jd = Math.floor(jd - 0.5) + 1
  const y = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631)
  const m = Math.min(
    12,
    Math.ceil((jd - (29 + hijriToJD(y, 1, 1))) / 29.5) + 1,
  )
  const d = jd - hijriToJD(y, m, 1) + 1
  return { hy: y, hm0: m - 1, hd: d }
}

const gregorianToJD = (gy: number, gm1: number, gd: number): number => {
  const a = Math.floor((14 - gm1) / 12)
  const y = gy + 4800 - a
  const m = gm1 + 12 * a - 3
  return (
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

const jdToGregorian = (
  jd: number,
): { gy: number; gm0: number; gd: number } => {
  const j = Math.floor(jd) + 32044
  const g = Math.floor(j / 146097)
  const dg = j % 146097
  const c = Math.floor(((Math.floor(dg / 36524) + 1) * 3) / 4)
  const dc = dg - c * 36524
  const b = Math.floor(dc / 1461)
  const db = dc % 1461
  const a = Math.floor(((Math.floor(db / 365) + 1) * 3) / 4)
  const da = db - a * 365
  const y = g * 400 + c * 100 + b * 4 + a
  const m = Math.floor((da * 5 + 308) / 153) - 2
  const d = da - Math.floor(((m + 4) * 153) / 5) + 122
  const gy = y - 4800 + Math.floor((m + 2) / 12)
  const gm0 = ((m + 2) % 12 + 12) % 12
  const gd = d + 1
  return { gy, gm0, gd }
}

const hijriToGregorianTabular = (
  hy: number,
  hm0: number,
  hd: number,
): { gy: number; gm0: number; gd: number } => {
  const jd = hijriToJD(hy, hm0 + 1, hd)
  return jdToGregorian(jd)
}

const gregorianToHijriTabular = (
  gy: number,
  gm0: number,
  gd: number,
): { hy: number; hm0: number; hd: number } => {
  const jd = gregorianToJD(gy, gm0 + 1, gd)
  return jdToHijri(jd)
}

// silence unused (kept for completeness)
void HIJRI_EPOCH_JD

// ---------------------------------------------------------------------------
// Unified converters (Intl preferred, tabular fallback)
// ---------------------------------------------------------------------------

const dateToHijri = (
  date: Date,
): { hy: number; hm0: number; hd: number } => {
  const intl = intlComponents(date)
  if (intl) return intl
  return gregorianToHijriTabular(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
}

const hijriToDateInternal = (hy: number, hm0: number, hd: number): Date => {
  // Intl gives us H→G only via search, so we use the tabular formula for
  // Hijri-driven inputs (calendar grid generation). It is consistent with the
  // grid we render — every cell is computed via the same forward conversion.
  const g = hijriToGregorianTabular(hy, hm0, hd)
  const d = new Date(g.gy, g.gm0, g.gd)
  d.setHours(0, 0, 0, 0)
  return d
}

const daysInHijriMonth = (hy: number, hm0: number): number => {
  if (probeIntl()) {
    // Walk forward using Intl until we cross a month boundary.
    const start = hijriToDateInternal(hy, hm0, 1)
    let count = 1
    for (let i = 1; i <= 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const c = intlComponents(d)
      if (!c) break
      if (c.hm0 === hm0 && c.hy === hy) count = i + 1
      else break
    }
    if (count === 29 || count === 30) return count
  }
  return daysInHijriMonthTabular(hy, hm0)
}

// ---------------------------------------------------------------------------
// Locale / formatting helpers
// ---------------------------------------------------------------------------

const localeCode = (l: EngineLocale): string =>
  typeof l === 'string' ? l : (l as Locale).code

const localeMonths = (l: EngineLocale): string[] | undefined =>
  typeof l === 'string' ? undefined : (l as Locale).monthNames

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
]

const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  "Rabi' al-awwal",
  "Rabi' al-thani",
  'Jumada al-awwal',
  'Jumada al-thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
]

const intlHijriMonth = (
  date: Date,
  code: string,
): string | undefined => {
  if (!probeIntl()) return undefined
  try {
    const fmt = new Intl.DateTimeFormat(`${code}-u-ca-islamic-umalqura`, {
      month: 'long',
    })
    const out = fmt.format(date)
    if (out && !/^\d+$/.test(out)) return out
  } catch {
    /* swallow */
  }
  return undefined
}

const hijriMonthNameAt = (
  hy: number,
  hm0: number,
  locale: EngineLocale,
): string => {
  const fromLocale = localeMonths(locale)
  if (fromLocale && fromLocale[hm0]) return fromLocale[hm0]
  const code = localeCode(locale)
  if (code) {
    const date = hijriToDateInternal(hy, hm0, 15)
    const intl = intlHijriMonth(date, code)
    if (intl) return intl
  }
  return code && code.startsWith('ar')
    ? HIJRI_MONTHS_AR[hm0]
    : HIJRI_MONTHS_EN[hm0]
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

let idCounter = 0
const generateId = (): string => `adp_h_${Date.now()}_${++idCounter}`

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

const todayHijri = (): Date => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

const getMonthName = (
  hy: number,
  hm0: number,
  locale: EngineLocale,
): string => {
  const name = hijriMonthNameAt(hy, hm0, locale)
  return `${name} ${hy}`
}

const generateMonth = (
  hy: number,
  hm0: number,
  locale: EngineLocale,
  holidays: Holiday[],
  today: Date,
): MonthData => {
  const days: DateItem[] = []
  const monthName = getMonthName(hy, hm0, locale)

  const holidayMap = new Map<string, string>()
  for (const h of holidays) holidayMap.set(h.date, h.label)

  const totalDays = daysInHijriMonth(hy, hm0)

  // Weekday offset from the first day of this Hijri month.
  const firstDate = hijriToDateInternal(hy, hm0, 1)
  const dow = firstDate.getDay()
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
    const date = hijriToDateInternal(hy, hm0, d)
    const dateKey = formatHolidayKey(date.getMonth(), date.getDate())
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
    year: hy,
    month: hm0,
    monthName,
    days,
  }
}

const addHijriMonths = (date: Date, count: number): Date => {
  const h = dateToHijri(date)
  let nm = h.hm0 + count
  let ny = h.hy + Math.floor(nm / 12)
  nm = ((nm % 12) + 12) % 12
  const max = daysInHijriMonth(ny, nm)
  const nd = Math.min(h.hd, max)
  return hijriToDateInternal(ny, nm, nd)
}

export const hijri: CalendarEngine = {
  id: 'hijri',
  today: todayHijri,
  generateMonth,
  getMonthName,
  getDayName: dayNameViaIntl,
  getShortDayNames: shortDayNames,
  addMonths: addHijriMonths,
  isSameDay: isSameDayInternal,
}

/**
 * Convert a JS Date to Hijri components (Umm al-Qura via Intl, tabular fallback).
 */
export const dateToHijriComponents = dateToHijri

/**
 * Build a JS Date from Hijri components using the tabular Kuwaiti algorithm.
 * Note: This is the same conversion used by the grid generator, so component
 * round-trips are internally consistent even when Intl isn't available.
 */
export const hijriToDate = hijriToDateInternal

export const isHijriLeapYear = isHijriLeapTabular
export const hijriDaysInMonth = daysInHijriMonth

export default hijri
