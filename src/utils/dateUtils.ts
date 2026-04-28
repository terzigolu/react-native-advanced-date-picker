/**
 * Public date utilities. Lane 0 (v0.3.0) — the calendar-grid generation logic
 * has moved into `src/calendars/gregorian.ts` so that pluggable engines
 * (Hijri / Persian / Buddhist, Lane 7) can implement the same shape. The
 * exports below are kept identical for backward compatibility.
 */
import { gregorian } from '../calendars/gregorian'

export {
  getDaysInMonth,
  getFirstDayOfMonth,
  generateMonthData,
  generateCalendarData,
  getMonthName,
  getDayName,
  getShortDayNames,
  addMonths,
} from '../calendars/gregorian'

export const toDate = (date: Date | string | null): Date | null => {
  if (!date) return null
  const parsed = typeof date === 'string' ? new Date(date) : new Date(date.getTime())
  if (isNaN(parsed.getTime())) return null
  parsed.setHours(0, 0, 0, 0)
  return parsed
}

export const isSameDate = (a: Date | null, b: Date | null): boolean => {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export const isDateInRange = (
  date: Date,
  start: Date | null,
  end: Date | null,
): boolean => {
  if (!start || !end) return false
  return date > start && date < end
}

export const isDateBefore = (a: Date, b: Date): boolean => {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return aa < bb
}

/**
 * ISO YYYY-MM-DD key for a date — used as the membership key for
 * `Selection.kind === 'multi'` Sets.
 */
export const formatDateKey = (date: Date): string => {
  const yyyy = String(date.getFullYear()).padStart(4, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ---------------------------------------------------------------------------
// Lane 1 — disabled date ranges + range length helpers
// ---------------------------------------------------------------------------

/**
 * Lane 1 — declarative blocked range. Either endpoint may be a `Date` or an
 * ISO string. Inclusive on both ends.
 */
export type DisabledRange = {
  start: Date | string
  end: Date | string
}

/**
 * Returns true when `date` falls within ANY of the supplied `disabledRanges`
 * (inclusive). Used by `useDatePicker` and `DayCell` to render the cell as
 * blocked (`isBlocked`) and to short-circuit selection.
 *
 * Times are normalised to midnight before comparison so the caller can pass
 * raw `Date`s without zeroing them.
 */
export const isDateBlocked = (
  date: Date,
  disabledRanges?: DisabledRange[] | null,
): boolean => {
  if (!disabledRanges || disabledRanges.length === 0) return false
  const probe = toDate(date)
  if (!probe) return false
  const t = probe.getTime()
  for (const r of disabledRanges) {
    const s = toDate(r.start as Date | string | null)
    const e = toDate(r.end as Date | string | null)
    if (!s || !e) continue
    const lo = Math.min(s.getTime(), e.getTime())
    const hi = Math.max(s.getTime(), e.getTime())
    if (t >= lo && t <= hi) return true
  }
  return false
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Inclusive day count between `start` and `end`. Order-insensitive. When
 * either endpoint is null/invalid the function returns `0`.
 *
 * Examples:
 *   getRangeLength(2026-01-01, 2026-01-01) === 1   // single day
 *   getRangeLength(2026-01-01, 2026-01-07) === 7   // a full week
 */
export const getRangeLength = (
  start: Date | null,
  end: Date | null,
): number => {
  const s = toDate(start)
  const e = toDate(end)
  if (!s || !e) return 0
  const diff = Math.abs(e.getTime() - s.getTime())
  return Math.floor(diff / MS_PER_DAY) + 1
}

/**
 * Constrains `[start, end]` so that its inclusive length stays within
 * `[min, max]` (in days). The `start` endpoint is treated as the anchor —
 * `end` is shifted forward when the span is too short, and pulled back when
 * it is too long. When either bound is `undefined` it is ignored. Returns
 * the clamped pair plus a `wasClamped` flag for callers that want to surface
 * UX feedback.
 */
export const clampRange = (
  start: Date | null,
  end: Date | null,
  min?: number,
  max?: number,
): { start: Date | null; end: Date | null; wasClamped: boolean } => {
  const s = toDate(start)
  const e = toDate(end)
  if (!s || !e) return { start: s, end: e, wasClamped: false }

  // Always work in canonical (low → high) order.
  const reversed = e.getTime() < s.getTime()
  const lo = reversed ? e : s
  const hi = reversed ? s : e
  const length = Math.floor((hi.getTime() - lo.getTime()) / MS_PER_DAY) + 1

  let nextHi = hi
  let wasClamped = false

  if (typeof min === 'number' && min > 0 && length < min) {
    nextHi = new Date(lo.getTime() + (min - 1) * MS_PER_DAY)
    nextHi.setHours(0, 0, 0, 0)
    wasClamped = true
  } else if (typeof max === 'number' && max > 0 && length > max) {
    nextHi = new Date(lo.getTime() + (max - 1) * MS_PER_DAY)
    nextHi.setHours(0, 0, 0, 0)
    wasClamped = true
  }

  // Preserve the caller's original orientation (start was anchor).
  if (reversed) {
    return { start: nextHi, end: lo, wasClamped }
  }
  return { start: lo, end: nextHi, wasClamped }
}

// ---------------------------------------------------------------------------
// Lane 4 — workday count utility
// ---------------------------------------------------------------------------

import type { Holiday } from './types'

/**
 * Lane 4 — Count workdays in `[start, end]` inclusive on both endpoints.
 *
 * Defaults:
 *   - `weekendDays`: `[0, 6]` (Sunday + Saturday). Override for regions where
 *     the weekend lands elsewhere (e.g. `[5, 6]` for Fri/Sat in many MENA
 *     countries). Day indices follow JS `Date.getDay()` (Sun=0..Sat=6).
 *   - `holidays`: a `Holiday[]` whose `date` is either `'MM-DD'` (recurring
 *     yearly) or `'YYYY-MM-DD'` (specific). Holidays falling on a weekday
 *     are subtracted from the count. Holidays already on a weekend day are
 *     ignored (no double-subtract).
 *
 * Order-insensitive: passing `start > end` is normalised internally. Returns
 * `0` when either endpoint is invalid.
 */
export const countWorkdays = (
  start: Date,
  end: Date,
  options?: { holidays?: Holiday[]; weekendDays?: number[] },
): number => {
  const s = toDate(start)
  const e = toDate(end)
  if (!s || !e) return 0

  // Normalise to (lo, hi) so iteration is forward regardless of caller order.
  const lo = s.getTime() <= e.getTime() ? s : e
  const hi = s.getTime() <= e.getTime() ? e : s

  const weekendDays = options?.weekendDays ?? [0, 6]
  const weekendSet = new Set(weekendDays)

  // Pre-compute holiday lookup sets. We split into two sets because
  // 'MM-DD' matches recurringly (any year) while 'YYYY-MM-DD' is exact.
  const recurringHolidays = new Set<string>() // 'MM-DD'
  const exactHolidays = new Set<string>() // 'YYYY-MM-DD'
  if (options?.holidays) {
    for (const h of options.holidays) {
      if (!h?.date) continue
      if (h.date.length === 5) recurringHolidays.add(h.date)
      else if (h.date.length === 10) exactHolidays.add(h.date)
    }
  }

  let count = 0
  const cursor = new Date(lo.getTime())
  while (cursor.getTime() <= hi.getTime()) {
    const dow = cursor.getDay()
    const isWeekend = weekendSet.has(dow)
    if (!isWeekend) {
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      const yyyy = String(cursor.getFullYear()).padStart(4, '0')
      const mmdd = `${mm}-${dd}`
      const ymd = `${yyyy}-${mm}-${dd}`
      const isHoliday =
        recurringHolidays.has(mmdd) || exactHolidays.has(ymd)
      if (!isHoliday) count += 1
    }
    // Advance by one day. Use setDate to stay DST-correct (no MS_PER_DAY drift).
    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

// ---------------------------------------------------------------------------
// Lane 2 — week / decade helpers (used by WeekGrid + YearGrid views)
// ---------------------------------------------------------------------------

/**
 * Lane 2 — ISO 8601 week number for `date`. Returns the ISO week-numbering
 * year alongside the week, because ISO weeks belonging to the previous /
 * following Gregorian year do exist (e.g. 2026-01-01 is week 1 of 2026, but
 * 2027-01-01 is week 53 of 2026).
 *
 * Algorithm follows the canonical "Thursday in this week decides the year"
 * rule from ISO 8601.
 */
export const getISOWeek = (date: Date): { year: number; week: number } => {
  // Copy to avoid mutating the caller — also zero the time so DST shifts
  // around midnight don't misclassify the day.
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  // ISO weeks start on Monday. JS getUTCDay(): Sun=0..Sat=6 → Mon=1..Sun=7.
  const dayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay()
  // Shift to the Thursday of the current week (ISO anchors weeks on Thursday).
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const isoYear = d.getUTCFullYear()
  // Day 1 of the ISO year is the Jan-1st of `isoYear` (UTC).
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week =
    Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7)
  return { year: isoYear, week }
}

/**
 * Lane 2 — Monday→Sunday inclusive range for the given ISO `(year, week)`.
 * Returns local-time midnights.
 *
 * The ISO 8601 week 1 of a year is the week containing that year's first
 * Thursday. We compute the Monday of week 1 then add `(week - 1) * 7` days.
 */
export const getWeekRange = (
  year: number,
  week: number,
): { start: Date; end: Date } => {
  // Jan 4th is always in week 1 (ISO 8601). Find that week's Monday in UTC,
  // then convert to a local-time Date so callers can format it directly.
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay()
  const week1Monday = new Date(jan4)
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1))
  const monday = new Date(week1Monday)
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  // Convert to local-time midnights for ergonomic display use.
  const start = new Date(
    monday.getUTCFullYear(),
    monday.getUTCMonth(),
    monday.getUTCDate(),
  )
  start.setHours(0, 0, 0, 0)
  const end = new Date(
    sunday.getUTCFullYear(),
    sunday.getUTCMonth(),
    sunday.getUTCDate(),
  )
  end.setHours(0, 0, 0, 0)
  return { start, end }
}

/**
 * Lane 2 — 12-year window (decade-ish) used by `YearGrid`. Anchored on the
 * traditional "decade containing this year" rule (e.g. 2026 → starts at 2020),
 * but extended to 12 cells so the grid is exactly 4×3 with two padding years.
 */
export const getDecade = (
  year: number,
): { start: number; end: number } => {
  const start = year - (year % 10)
  return { start, end: start + 11 }
}

// Re-export the engine itself for advanced consumers that want to bypass the
// thin wrappers above (used internally by `useCalendar` / `useDatePicker`).
export { gregorian }
