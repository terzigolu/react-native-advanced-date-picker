import type { DateItem, Holiday, MonthData } from '../utils/types'
import type { Locale } from '../locale/types'
import type { CalendarEngine, EngineLocale } from './types'
import { gregorian } from './gregorian'

/**
 * Buddhist (Thai) calendar engine.
 *
 * Structurally identical to Gregorian — same months, same days — but the year
 * is offset by +543 (Buddhist Era). This wrapper delegates everything to the
 * Gregorian engine and only rewrites the displayed year for `getMonthName`
 * and the `monthName` field on `MonthData` / `DateItem`.
 *
 * Inputs (`year` parameters in `generateMonth` / `getMonthName` / `addMonths`)
 * are interpreted as **Buddhist Era years** (BE). Internally we subtract 543
 * to drive the Gregorian engine, then add 543 back to outputs.
 *
 * Reference: 2567 BE === 2024 CE.
 */

const BE_OFFSET = 543

const localeCode = (l: EngineLocale): string =>
  typeof l === 'string' ? l : (l as Locale).code

const formatYearWithBE = (
  gregorianYear: number,
  month: number,
  locale: EngineLocale,
): string => {
  const beYear = gregorianYear + BE_OFFSET
  const baseName = gregorian.getMonthName(gregorianYear, month, locale)
  // Strip any trailing year (e.g. some locales include the year in `month: 'long'`)
  // and append the BE year explicitly.
  const stripped = baseName.replace(/\s*\d{3,4}\s*$/, '').trim()
  return `${stripped} ${beYear}`
}

const today = (): Date => gregorian.today()

const getMonthName = (
  beYear: number,
  month: number,
  locale: EngineLocale,
): string => formatYearWithBE(beYear - BE_OFFSET, month, locale)

const generateMonth = (
  beYear: number,
  month: number,
  locale: EngineLocale,
  holidays: Holiday[],
  todayDate: Date,
): MonthData => {
  const gregorianYear = beYear - BE_OFFSET
  const data = gregorian.generateMonth(
    gregorianYear,
    month,
    locale,
    holidays,
    todayDate,
  )
  const beMonthName = formatYearWithBE(gregorianYear, month, locale)
  const days: DateItem[] = data.days.map((d) =>
    d.isEmpty ? d : { ...d, monthName: beMonthName },
  )
  return {
    ...data,
    year: beYear,
    monthName: beMonthName,
    days,
  }
}

export const buddhist: CalendarEngine = {
  id: 'buddhist',
  today,
  generateMonth,
  getMonthName,
  getDayName: (date, locale) => gregorian.getDayName(date, locale),
  getShortDayNames: (locale, startOnMonday) =>
    gregorian.getShortDayNames(locale, startOnMonday),
  addMonths: (date, count) => gregorian.addMonths(date, count),
  isSameDay: (a, b) => gregorian.isSameDay(a, b),
}

/**
 * Convert a Gregorian year to its Buddhist Era equivalent.
 * Exported for callers (e.g. headers) that need the BE label without
 * routing through `getMonthName`.
 */
export const gregorianYearToBE = (gregorianYear: number): number =>
  gregorianYear + BE_OFFSET

/**
 * Convert a BE year back to its Gregorian equivalent.
 */
export const beYearToGregorian = (beYear: number): number =>
  beYear - BE_OFFSET

// silence "unused import" for `localeCode` — kept for future month-name customization
void localeCode

export default buddhist
