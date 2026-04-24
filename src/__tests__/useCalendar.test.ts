/**
 * @jest-environment jest-environment-jsdom
 */
import { renderHook, act } from '@testing-library/react'
import useCalendar from '../hooks/useCalendar'

describe('useCalendar', () => {
  it('returns 12 months by default', () => {
    const { result } = renderHook(() => useCalendar())
    expect(result.current.calendarData).toHaveLength(12)
  })

  it('respects custom months option', () => {
    const { result } = renderHook(() => useCalendar({ months: 6 }))
    expect(result.current.calendarData).toHaveLength(6)
  })

  it('generates data with correct locale', () => {
    const { result } = renderHook(() => useCalendar({ locale: 'tr', months: 1 }))
    const firstMonth = result.current.calendarData[0]
    // Turkish month name should exist
    expect(firstMonth.monthName).toBeTruthy()
  })

  it('includes holidays in generated data', () => {
    const holidays = [{ date: '01-01', label: 'Test Holiday' }]
    const startFrom = new Date(2026, 0, 1)
    const { result } = renderHook(() =>
      useCalendar({ holidays, months: 1, startFrom })
    )
    const jan = result.current.calendarData[0]
    const jan1 = jan.days.find(d => d.day === 1 && !d.isEmpty)
    expect(jan1?.isHoliday).toBe(true)
    expect(jan1?.holidayLabel).toBe('Test Holiday')
  })

  it('regenerate produces fresh data', () => {
    const { result } = renderHook(() => useCalendar({ months: 1 }))
    const firstId = result.current.calendarData[0].id

    act(() => {
      result.current.regenerate()
    })

    const newId = result.current.calendarData[0].id
    expect(newId).not.toBe(firstId)
  })

  it('each month has days array with real days', () => {
    const { result } = renderHook(() => useCalendar({ months: 3 }))
    for (const month of result.current.calendarData) {
      const realDays = month.days.filter(d => !d.isEmpty)
      expect(realDays.length).toBeGreaterThanOrEqual(28)
      expect(realDays.length).toBeLessThanOrEqual(31)
    }
  })
})
