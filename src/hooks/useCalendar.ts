import { useCallback, useMemo, useState } from 'react'
import { generateCalendarData } from '../utils/dateUtils'
import type { Holiday, MonthData } from '../utils/types'

type UseCalendarOptions = {
  /** Number of months to generate (default: 12) */
  months?: number
  /** Locale code for Intl formatting (default: 'en') */
  locale?: string
  /** List of holidays to highlight */
  holidays?: Holiday[]
  /** Start generating from this date (default: today) */
  startFrom?: Date
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
  } = options

  const [revision, setRevision] = useState(0)

  const calendarData = useMemo(() => {
    // revision is used to force recalculation
    void revision
    return generateCalendarData(months, locale, holidays, startFrom)
  }, [months, locale, holidays, startFrom, revision])

  const regenerate = useCallback(() => {
    setRevision(r => r + 1)
  }, [])

  return { calendarData, regenerate }
}

export default useCalendar
