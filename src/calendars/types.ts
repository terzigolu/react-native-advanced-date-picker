import type { Holiday, MonthData } from '../utils/types'
import type { Locale } from '../locale/types'

/**
 * Pluggable calendar engine. Lane 0 ships only the Gregorian implementation
 * (default); Lane 7 will introduce Hijri / Persian / Buddhist engines using
 * this same shape — algorithmic, zero-dep.
 *
 * Engines accept a `Locale | string` so they keep the existing public API
 * surface (`useCalendar({ locale: 'tr' })`) compatible while also accepting
 * a richer `Locale` object passed down from the component layer.
 */
export type EngineLocale = Locale | string

export interface CalendarEngine {
  /** Stable engine identifier — 'gregorian', 'hijri', 'persian', 'buddhist'. */
  id: string

  /** Today's date in this calendar (zeroed time). */
  today(): Date

  /** Generate a single month's grid (with empty offsets and holiday flags). */
  generateMonth(
    year: number,
    month: number,
    locale: EngineLocale,
    holidays: Holiday[],
    today: Date,
  ): MonthData

  /** Long-form month name in the given locale. */
  getMonthName(year: number, month: number, locale: EngineLocale): string

  /** Long-form weekday name for a date in the given locale. */
  getDayName(date: Date, locale: EngineLocale): string

  /** Short weekday names array (length 7) starting on Monday by default. */
  getShortDayNames(locale: EngineLocale, startOnMonday?: boolean): string[]

  /** Add `count` months to a date (preserving day-of-month where possible). */
  addMonths(date: Date, count: number): Date

  /** True iff `a` and `b` represent the same calendar day. */
  isSameDay(a: Date, b: Date): boolean
}
