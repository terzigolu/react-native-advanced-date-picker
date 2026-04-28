/**
 * @jest-environment jest-environment-jsdom
 */
import { renderHook } from '@testing-library/react'
import { gregorian, defaultEngine, engines } from '../calendars'
import useCalendar from '../hooks/useCalendar'
import {
  generateMonthData as legacyGenerateMonthData,
  generateCalendarData as legacyGenerateCalendarData,
  getMonthName as legacyGetMonthName,
  getDayName as legacyGetDayName,
  getShortDayNames as legacyGetShortDayNames,
} from '../utils/dateUtils'

describe('calendars/index', () => {
  it('exposes gregorian as the default engine', () => {
    expect(defaultEngine).toBe(gregorian)
    expect(defaultEngine.id).toBe('gregorian')
  })

  it('registers gregorian in the engines registry', () => {
    expect(engines.gregorian).toBe(gregorian)
  })
})

describe('gregorian engine — adapter equivalence', () => {
  const today = new Date(2026, 2, 24)
  today.setHours(0, 0, 0, 0)

  it('engine.generateMonth output matches legacy generateMonthData', () => {
    const a = gregorian.generateMonth(2026, 0, 'en', [], today)
    const b = legacyGenerateMonthData(2026, 0, 'en', [], today)
    expect(a.year).toBe(b.year)
    expect(a.month).toBe(b.month)
    expect(a.monthName).toBe(b.monthName)
    expect(a.days.length).toBe(b.days.length)
    // Ignore IDs (auto-incrementing); compare semantic fields.
    for (let i = 0; i < a.days.length; i++) {
      const da = a.days[i]
      const db = b.days[i]
      expect(da.day).toBe(db.day)
      expect(da.fullDate).toBe(db.fullDate)
      expect(da.isEmpty).toBe(db.isEmpty)
      expect(da.isToday).toBe(db.isToday)
      expect(da.isSunday).toBe(db.isSunday)
      expect(da.isSaturday).toBe(db.isSaturday)
      expect(da.isHoliday).toBe(db.isHoliday)
    }
  })

  it('engine.getMonthName equals legacy getMonthName', () => {
    expect(gregorian.getMonthName(2026, 0, 'en')).toBe(
      legacyGetMonthName(2026, 0, 'en'),
    )
    expect(gregorian.getMonthName(2026, 0, 'tr')).toBe(
      legacyGetMonthName(2026, 0, 'tr'),
    )
  })

  it('engine.getDayName equals legacy getDayName', () => {
    const d = new Date(2026, 0, 1)
    expect(gregorian.getDayName(d, 'en')).toBe(legacyGetDayName(d, 'en'))
  })

  it('engine.getShortDayNames equals legacy getShortDayNames', () => {
    expect(gregorian.getShortDayNames('en')).toEqual(
      legacyGetShortDayNames('en'),
    )
    expect(gregorian.getShortDayNames('tr')).toEqual(
      legacyGetShortDayNames('tr'),
    )
  })

  it('engine.addMonths preserves day-of-month when possible', () => {
    const start = new Date(2026, 0, 15)
    const out = gregorian.addMonths(start, 3)
    expect(out.getMonth()).toBe(3) // April
    expect(out.getDate()).toBe(15)
    expect(out.getFullYear()).toBe(2026)
  })

  it('engine.addMonths clamps day on shorter target months', () => {
    const start = new Date(2026, 0, 31) // Jan 31
    const out = gregorian.addMonths(start, 1) // Feb has 28 days in 2026
    expect(out.getMonth()).toBe(1)
    expect(out.getDate()).toBe(28)
  })

  it('engine.isSameDay matches calendar-day equality', () => {
    expect(
      gregorian.isSameDay(
        new Date(2026, 0, 1, 10, 0),
        new Date(2026, 0, 1, 23, 59),
      ),
    ).toBe(true)
    expect(
      gregorian.isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2)),
    ).toBe(false)
  })

  it('engine.today returns a zeroed Date', () => {
    const t = gregorian.today()
    expect(t.getHours()).toBe(0)
    expect(t.getMinutes()).toBe(0)
    expect(t.getSeconds()).toBe(0)
  })

  it('legacy generateCalendarData still works via re-export', () => {
    const start = new Date(2026, 0, 1)
    const data = legacyGenerateCalendarData(3, 'en', [], start)
    expect(data).toHaveLength(3)
    expect(data[0].month).toBe(0)
    expect(data[1].month).toBe(1)
    expect(data[2].month).toBe(2)
  })
})

describe('useCalendar — engine prop backward compat', () => {
  it('default engine produces same calendar data as gregorian engine prop', () => {
    const startFrom = new Date(2026, 0, 1)
    const { result: r1 } = renderHook(() =>
      useCalendar({ months: 2, startFrom, locale: 'en' }),
    )
    const { result: r2 } = renderHook(() =>
      useCalendar({ months: 2, startFrom, locale: 'en', engine: gregorian }),
    )
    expect(r1.current.calendarData.length).toBe(r2.current.calendarData.length)
    expect(r1.current.calendarData[0].month).toBe(
      r2.current.calendarData[0].month,
    )
    expect(r1.current.calendarData[0].year).toBe(
      r2.current.calendarData[0].year,
    )
    expect(r1.current.calendarData[0].monthName).toBe(
      r2.current.calendarData[0].monthName,
    )
  })
})
