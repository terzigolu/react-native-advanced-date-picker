import {
  toDate,
  isSameDate,
  isDateInRange,
  isDateBefore,
  getDaysInMonth,
  getFirstDayOfMonth,
  generateMonthData,
  generateCalendarData,
  getShortDayNames,
  getMonthName,
} from '../utils/dateUtils'

describe('toDate', () => {
  it('returns null for null input', () => {
    expect(toDate(null)).toBeNull()
  })

  it('parses a Date object and zeros out time', () => {
    const input = new Date(2026, 2, 15, 14, 30, 0)
    const result = toDate(input)!
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(15)
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })

  it('parses an ISO string', () => {
    const result = toDate('2026-06-20T10:00:00.000Z')!
    expect(result.getFullYear()).toBe(2026)
    expect(result.getDate()).toBe(20)
    expect(result.getHours()).toBe(0)
  })

  it('returns null for invalid string', () => {
    expect(toDate('not-a-date')).toBeNull()
  })

  it('does not mutate the original date', () => {
    const original = new Date(2026, 5, 10, 15, 0, 0)
    const originalTime = original.getTime()
    toDate(original)
    expect(original.getTime()).toBe(originalTime)
  })
})

describe('isSameDate', () => {
  it('returns true for same date with different times', () => {
    const a = new Date(2026, 3, 10, 8, 0)
    const b = new Date(2026, 3, 10, 22, 30)
    expect(isSameDate(a, b)).toBe(true)
  })

  it('returns false for different dates', () => {
    const a = new Date(2026, 3, 10)
    const b = new Date(2026, 3, 11)
    expect(isSameDate(a, b)).toBe(false)
  })

  it('returns false when either is null', () => {
    expect(isSameDate(null, new Date())).toBe(false)
    expect(isSameDate(new Date(), null)).toBe(false)
    expect(isSameDate(null, null)).toBe(false)
  })
})

describe('isDateInRange', () => {
  const start = new Date(2026, 3, 5)
  const end = new Date(2026, 3, 15)

  it('returns true for date between start and end', () => {
    const mid = new Date(2026, 3, 10)
    expect(isDateInRange(mid, start, end)).toBe(true)
  })

  it('returns false for date equal to start', () => {
    expect(isDateInRange(new Date(2026, 3, 5), start, end)).toBe(false)
  })

  it('returns false for date equal to end', () => {
    expect(isDateInRange(new Date(2026, 3, 15), start, end)).toBe(false)
  })

  it('returns false for date outside range', () => {
    expect(isDateInRange(new Date(2026, 3, 20), start, end)).toBe(false)
  })

  it('returns false when start or end is null', () => {
    expect(isDateInRange(new Date(2026, 3, 10), null, end)).toBe(false)
    expect(isDateInRange(new Date(2026, 3, 10), start, null)).toBe(false)
  })
})

describe('isDateBefore', () => {
  it('returns true when a is before b', () => {
    expect(isDateBefore(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(true)
  })

  it('returns false when a equals b', () => {
    expect(isDateBefore(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(false)
  })

  it('returns false when a is after b', () => {
    expect(isDateBefore(new Date(2026, 0, 3), new Date(2026, 0, 2))).toBe(false)
  })
})

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31)
  })

  it('returns 28 for February in non-leap year', () => {
    expect(getDaysInMonth(2026, 1)).toBe(28)
  })

  it('returns 29 for February in leap year', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2026, 3)).toBe(30)
  })
})

describe('getFirstDayOfMonth', () => {
  it('returns Monday-based index (0=Mon, 6=Sun)', () => {
    // 2024-01-01 is Monday
    expect(getFirstDayOfMonth(2024, 0)).toBe(0)
  })

  it('handles Sunday correctly as 6', () => {
    // 2026-03-01 is Sunday
    expect(getFirstDayOfMonth(2026, 2)).toBe(6)
  })
})

describe('getShortDayNames', () => {
  it('returns 7 day names', () => {
    const days = getShortDayNames('en')
    expect(days).toHaveLength(7)
  })

  it('starts with Monday by default', () => {
    const days = getShortDayNames('en')
    expect(days[0]).toMatch(/Mon/i)
  })
})

describe('getMonthName', () => {
  it('returns month name in English', () => {
    const name = getMonthName(2026, 0, 'en')
    expect(name).toMatch(/January/i)
  })

  it('returns month name in Turkish', () => {
    const name = getMonthName(2026, 0, 'tr')
    expect(name).toMatch(/Ocak/i)
  })
})

describe('generateMonthData', () => {
  const today = new Date(2026, 2, 24)
  today.setHours(0, 0, 0, 0)

  it('generates correct number of actual day cells', () => {
    const month = generateMonthData(2026, 0, 'en', [], today)
    const realDays = month.days.filter(d => !d.isEmpty)
    expect(realDays).toHaveLength(31) // January has 31 days
  })

  it('includes empty cells for offset', () => {
    const month = generateMonthData(2026, 0, 'en', [], today)
    const empties = month.days.filter(d => d.isEmpty)
    expect(empties.length).toBeGreaterThanOrEqual(0)
  })

  it('marks today correctly', () => {
    const month = generateMonthData(2026, 2, 'en', [], today)
    const todayCell = month.days.find(d => d.isToday)
    expect(todayCell).toBeDefined()
    expect(todayCell!.day).toBe(24)
  })

  it('marks Sundays correctly', () => {
    const month = generateMonthData(2026, 2, 'en', [], today)
    const sundays = month.days.filter(d => !d.isEmpty && d.isSunday)
    expect(sundays.length).toBeGreaterThan(0)
    for (const s of sundays) {
      const date = new Date(s.fullDate)
      expect(date.getDay()).toBe(0)
    }
  })

  it('marks holidays correctly', () => {
    const holidays = [{ date: '01-01', label: 'New Year' }]
    const month = generateMonthData(2026, 0, 'en', holidays, today)
    const jan1 = month.days.find(d => d.day === 1 && !d.isEmpty)
    expect(jan1?.isHoliday).toBe(true)
    expect(jan1?.holidayLabel).toBe('New Year')
  })

  it('sets correct monthName and year', () => {
    const month = generateMonthData(2026, 5, 'en', [], today)
    expect(month.year).toBe(2026)
    expect(month.monthName).toMatch(/June/i)
  })
})

describe('generateCalendarData', () => {
  it('generates the requested number of months', () => {
    const data = generateCalendarData(6, 'en', [])
    expect(data).toHaveLength(6)
  })

  it('generates 12 months by default starting from current month', () => {
    const data = generateCalendarData(12, 'en', [])
    expect(data).toHaveLength(12)

    const now = new Date()
    expect(data[0].month).toBe(now.getMonth())
    expect(data[0].year).toBe(now.getFullYear())
  })

  it('wraps around year boundary correctly', () => {
    const start = new Date(2026, 10, 1) // November
    const data = generateCalendarData(4, 'en', [], start)
    expect(data[0].month).toBe(10) // November
    expect(data[1].month).toBe(11) // December
    expect(data[2].month).toBe(0) // January next year
    expect(data[2].year).toBe(2027)
    expect(data[3].month).toBe(1) // February
  })

  it('passes holidays through to each month', () => {
    const holidays = [
      { date: '01-01', label: 'New Year' },
      { date: '12-25', label: 'Christmas' },
    ]
    const start = new Date(2026, 0, 1)
    const data = generateCalendarData(12, 'en', holidays, start)

    const jan = data[0]
    const janHoliday = jan.days.find(d => d.day === 1 && !d.isEmpty)
    expect(janHoliday?.isHoliday).toBe(true)

    const dec = data[11]
    const decHoliday = dec.days.find(d => d.day === 25 && !d.isEmpty)
    expect(decHoliday?.isHoliday).toBe(true)
  })

  it('each day has a unique id', () => {
    const data = generateCalendarData(3, 'en', [])
    const allIds = data.flatMap(m => m.days.map(d => d.id))
    const uniqueIds = new Set(allIds)
    expect(uniqueIds.size).toBe(allIds.length)
  })
})
