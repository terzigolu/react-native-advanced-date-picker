/**
 * @jest-environment jest-environment-jsdom
 */
import {
  hijri,
  persian,
  buddhist,
  engines,
} from '../calendars'
import {
  isPersianLeapYear,
  persianDaysInMonth,
  dateToJalali,
  jalaliToDate,
} from '../calendars/persian'
import {
  hijriDaysInMonth,
  hijriToDate,
  dateToHijriComponents,
} from '../calendars/hijri'
import { gregorianYearToBE, beYearToGregorian } from '../calendars/buddhist'

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
describe('calendars registry — Lane 7 engines', () => {
  it('registers all four engines', () => {
    expect(engines.gregorian).toBeDefined()
    expect(engines.hijri).toBe(hijri)
    expect(engines.persian).toBe(persian)
    expect(engines.buddhist).toBe(buddhist)
  })

  it('engines expose stable ids', () => {
    expect(hijri.id).toBe('hijri')
    expect(persian.id).toBe('persian')
    expect(buddhist.id).toBe('buddhist')
  })

  it('engines.today returns a zeroed Date', () => {
    for (const e of [hijri, persian, buddhist]) {
      const t = e.today()
      expect(t.getHours()).toBe(0)
      expect(t.getMinutes()).toBe(0)
      expect(t.getSeconds()).toBe(0)
      expect(t.getMilliseconds()).toBe(0)
    }
  })
})

// ---------------------------------------------------------------------------
// Buddhist
// ---------------------------------------------------------------------------
describe('buddhist engine', () => {
  it('converts Gregorian year ↔ BE year', () => {
    expect(gregorianYearToBE(2024)).toBe(2567)
    expect(beYearToGregorian(2567)).toBe(2024)
  })

  it('generateMonth uses BE year input and emits BE-formatted month name', () => {
    const today = new Date(2024, 0, 1)
    today.setHours(0, 0, 0, 0)
    // 2567 BE = 2024 CE
    const m = buddhist.generateMonth(2567, 0, 'en', [], today)
    expect(m.year).toBe(2567)
    expect(m.month).toBe(0)
    expect(m.monthName).toMatch(/2567/)
    // January has 31 day cells (plus leading offsets); count non-empty days
    const nonEmpty = m.days.filter((d) => !d.isEmpty)
    expect(nonEmpty).toHaveLength(31)
  })

  it('day grid structure mirrors Gregorian (same number of cells)', () => {
    const today = new Date(2024, 1, 15)
    today.setHours(0, 0, 0, 0)
    // 2024 is a leap year → Feb has 29 days
    const m = buddhist.generateMonth(2567, 1, 'en', [], today)
    const nonEmpty = m.days.filter((d) => !d.isEmpty)
    expect(nonEmpty).toHaveLength(29)
  })

  it('addMonths matches Gregorian semantics', () => {
    const start = new Date(2024, 0, 31)
    const out = buddhist.addMonths(start, 1)
    expect(out.getMonth()).toBe(1) // Feb
    expect(out.getDate()).toBe(29) // 2024 leap
  })

  it('isSameDay matches calendar-day equality', () => {
    expect(
      buddhist.isSameDay(
        new Date(2024, 0, 1, 9, 30),
        new Date(2024, 0, 1, 23, 59),
      ),
    ).toBe(true)
    expect(
      buddhist.isSameDay(new Date(2024, 0, 1), new Date(2024, 0, 2)),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Persian
// ---------------------------------------------------------------------------
describe('persian engine', () => {
  it('1 Farvardin 1403 maps to 20 March 2024 (vernal equinox)', () => {
    const d = jalaliToDate(1403, 0, 1)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(2) // March
    expect(d.getDate()).toBe(20)
  })

  it('20 March 2024 round-trips back to 1 Farvardin 1403', () => {
    const j = dateToJalali(new Date(2024, 2, 20))
    expect(j.jy).toBe(1403)
    expect(j.jm0).toBe(0)
    expect(j.jd).toBe(1)
  })

  it('1399 is a Persian leap year — Esfand has 30 days', () => {
    expect(isPersianLeapYear(1399)).toBe(true)
    expect(persianDaysInMonth(1399, 11)).toBe(30)
  })

  it('1400 is not a leap year — Esfand has 29 days', () => {
    expect(isPersianLeapYear(1400)).toBe(false)
    expect(persianDaysInMonth(1400, 11)).toBe(29)
  })

  it('Farvardin..Shahrivar are 31 days, Mehr..Bahman are 30', () => {
    for (let m = 0; m < 6; m++) {
      expect(persianDaysInMonth(1403, m)).toBe(31)
    }
    for (let m = 6; m < 11; m++) {
      expect(persianDaysInMonth(1403, m)).toBe(30)
    }
  })

  it('generateMonth returns 31 day-cells for Farvardin', () => {
    const today = new Date(2024, 2, 20)
    today.setHours(0, 0, 0, 0)
    const m = persian.generateMonth(1403, 0, 'fa', [], today)
    const nonEmpty = m.days.filter((d) => !d.isEmpty)
    expect(nonEmpty).toHaveLength(31)
    expect(m.year).toBe(1403)
    expect(m.month).toBe(0)
  })

  it('generateMonth marks the right cell as today', () => {
    const today = new Date(2024, 2, 20) // 1 Farvardin 1403
    today.setHours(0, 0, 0, 0)
    const m = persian.generateMonth(1403, 0, 'fa', [], today)
    const todayCell = m.days.find((d) => d.isToday)
    expect(todayCell).toBeDefined()
    expect(todayCell?.day).toBe(1)
  })

  it('addMonths advances by Jalali month', () => {
    const start = jalaliToDate(1403, 0, 15) // 15 Farvardin
    const out = persian.addMonths(start, 1) // → 15 Ordibehesht
    const j = dateToJalali(out)
    expect(j.jy).toBe(1403)
    expect(j.jm0).toBe(1)
    expect(j.jd).toBe(15)
  })

  it('addMonths clamps day on shorter target months (31→30 transition)', () => {
    const start = jalaliToDate(1403, 0, 31) // 31 Farvardin
    const out = persian.addMonths(start, 6) // → Mehr (30-day month)
    const j = dateToJalali(out)
    expect(j.jm0).toBe(6)
    expect(j.jd).toBe(30)
  })

  it('isSameDay matches calendar-day equality', () => {
    const a = jalaliToDate(1403, 5, 10)
    const b = new Date(a)
    b.setHours(23, 59, 59)
    expect(persian.isSameDay(a, b)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Hijri
// ---------------------------------------------------------------------------
describe('hijri engine', () => {
  it('1 Muharram 1446 maps to a Gregorian date in early July 2024', () => {
    const d = hijriToDate(1446, 0, 1)
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(6) // July
    // Tabular Kuwaiti puts 1 Muharram 1446 on 7 Jul 2024 (±1 day vs Umm al-Qura).
    expect([6, 7, 8]).toContain(d.getDate())
  })

  it('dateToHijriComponents produces a sensible Hijri year for 2024', () => {
    const c = dateToHijriComponents(new Date(2024, 6, 15))
    expect(c.hy).toBeGreaterThanOrEqual(1445)
    expect(c.hy).toBeLessThanOrEqual(1446)
    expect(c.hm0).toBeGreaterThanOrEqual(0)
    expect(c.hm0).toBeLessThanOrEqual(11)
  })

  it('Hijri months are 29 or 30 days', () => {
    for (let m = 0; m < 12; m++) {
      const days = hijriDaysInMonth(1446, m)
      expect([29, 30]).toContain(days)
    }
  })

  it('generateMonth produces 29 or 30 day-cells', () => {
    const today = new Date(2024, 6, 7)
    today.setHours(0, 0, 0, 0)
    const m = hijri.generateMonth(1446, 0, 'ar', [], today)
    const nonEmpty = m.days.filter((d) => !d.isEmpty)
    expect([29, 30]).toContain(nonEmpty.length)
    expect(m.year).toBe(1446)
    expect(m.month).toBe(0)
    expect(m.monthName).toMatch(/1446/)
  })

  it('generateMonth ISO strings reflect Gregorian dates', () => {
    const today = new Date(2024, 6, 7)
    today.setHours(0, 0, 0, 0)
    const m = hijri.generateMonth(1446, 0, 'en', [], today)
    const first = m.days.find((d) => !d.isEmpty)
    expect(first).toBeDefined()
    expect(first?.fullDate).toMatch(/2024-/)
  })

  it('addMonths advances by ~1 Hijri month', () => {
    const start = hijriToDate(1446, 0, 15)
    const out = hijri.addMonths(start, 1)
    const c = dateToHijriComponents(out)
    // Tabular vs Intl Umm al-Qura can disagree by ±1 day at month boundaries,
    // and addMonths may clamp the day-of-month, so allow a tolerance.
    expect(c.hm0).toBeGreaterThanOrEqual(0)
    expect(c.hm0).toBeLessThanOrEqual(2)
    expect(c.hd).toBeGreaterThanOrEqual(13)
    expect(c.hd).toBeLessThanOrEqual(17)
  })

  it('addMonths round-trips when crossing a year boundary', () => {
    const start = hijriToDate(1446, 11, 1) // Dhu al-Hijjah
    const out = hijri.addMonths(start, 1) // → Muharram 1447
    const c = dateToHijriComponents(out)
    expect(c.hm0).toBe(0)
    expect(c.hy).toBeGreaterThanOrEqual(1446)
  })

  it('isSameDay matches calendar-day equality', () => {
    const a = hijriToDate(1446, 0, 1)
    const b = new Date(a)
    b.setHours(23, 30)
    expect(hijri.isSameDay(a, b)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cross-engine smoke
// ---------------------------------------------------------------------------
describe('all non-gregorian engines — minimal smoke', () => {
  const today = new Date(2024, 5, 15)
  today.setHours(0, 0, 0, 0)

  it.each([
    ['hijri', hijri, 1446, 0],
    ['persian', persian, 1403, 0],
    ['buddhist', buddhist, 2567, 0],
  ])(
    '%s.generateMonth returns a populated MonthData',
    (_name, engine, year, month) => {
      const m = engine.generateMonth(year, month, 'en', [], today)
      expect(m).toBeDefined()
      expect(m.year).toBe(year)
      expect(m.month).toBe(month)
      expect(m.days.length).toBeGreaterThan(28)
      const nonEmpty = m.days.filter((d) => !d.isEmpty)
      expect(nonEmpty.length).toBeGreaterThanOrEqual(28)
      expect(nonEmpty.length).toBeLessThanOrEqual(31)
    },
  )

  it.each([
    ['hijri', hijri],
    ['persian', persian],
    ['buddhist', buddhist],
  ])('%s.getShortDayNames returns 7 strings', (_name, engine) => {
    const names = engine.getShortDayNames('en')
    expect(names).toHaveLength(7)
    for (const n of names) expect(typeof n).toBe('string')
  })
})
