import { useCallback, useMemo, useState } from 'react'
import type { Holiday, MonthData } from '../utils/types'
import { gregorian } from '../calendars/gregorian'
import type { CalendarEngine } from '../calendars/types'

type UseCalendarOptions = {
  /** Number of months to generate (default: 12) */
  months?: number
  /** Locale code for Intl formatting (default: 'en') */
  locale?: string
  /** List of holidays to highlight */
  holidays?: Holiday[]
  /** Start generating from this date (default: today) */
  startFrom?: Date
  /**
   * Pluggable calendar engine. Defaults to Gregorian. Pass an engine from
   * `react-native-advanced-date-picker/calendars/<name>` for non-Gregorian
   * calendars (Hijri / Persian / Buddhist — Lane 7).
   */
  engine?: CalendarEngine
}

type UseCalendarReturn = {
  calendarData: MonthData[]
  regenerate: () => void
}

const useCalendar = (options: UseCalendarOptions = {}): UseCalendarReturn => {
  const {
    months = 12,
    locale = 'en',
    holidays = [],
    startFrom,
    engine = gregorian,
  } = options

  const [revision, setRevision] = useState(0)

  const calendarData = useMemo(() => {
    // revision is used to force recalculation
    void revision
    const today = engine.today()
    const start = startFrom || today
    const startYear = start.getFullYear()
    const startMonth = start.getMonth()

    const data: MonthData[] = []
    for (let i = 0; i < months; i++) {
      const m = (startMonth + i) % 12
      const y = startYear + Math.floor((startMonth + i) / 12)
      data.push(engine.generateMonth(y, m, locale, holidays, today))
    }
    return data
  }, [months, locale, holidays, startFrom, engine, revision])

  const regenerate = useCallback(() => {
    setRevision(r => r + 1)
  }, [])

  return { calendarData, regenerate }
}

export default useCalendar
