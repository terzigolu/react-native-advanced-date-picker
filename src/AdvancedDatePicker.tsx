import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import type {
  DatePickerMode,
  Holiday,
  OnDateChangePayload,
  DateItem,
} from './utils/types'
import type { Theme } from './theme/types'
import type { Locale } from './locale/types'
import type { DayCellState } from './components/DayCell'
import { defaultTheme } from './theme/defaultTheme'
import { en } from './locale/en'
import { tr } from './locale/tr'
import CalendarList from './components/CalendarList'
import DatePickerModal from './components/DatePickerModal'

const builtInLocales: Record<string, Locale> = { en, tr }

type Props = {
  mode?: DatePickerMode
  locale?: string | Locale
  startDate?: Date | null
  endDate?: Date | null
  onDateChange: (payload: OnDateChangePayload) => void
  minDate?: Date
  maxDate?: Date
  theme?: Partial<Theme>
  holidays?: Holiday[]
  showHolidays?: boolean
  disabledDates?: (string | Date)[]
  months?: number
  modal?: boolean
  visible?: boolean
  onClose?: () => void
  onSave?: () => void
  topInset?: number
  showSaveButton?: boolean
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
}

const AdvancedDatePicker: React.FC<Props> = ({
  mode = 'single',
  locale = 'en',
  startDate: startDateProp = null,
  endDate: endDateProp = null,
  onDateChange,
  minDate,
  maxDate,
  theme: themeOverrides,
  holidays = [],
  showHolidays = true,
  disabledDates = [],
  months = 12,
  modal = true,
  visible = false,
  onClose,
  onSave,
  topInset = 0,
  showSaveButton = true,
  renderDay,
}) => {
  // Internal state for immediate re-render
  const [internalStart, setInternalStart] = useState<Date | null>(startDateProp)
  const [internalEnd, setInternalEnd] = useState<Date | null>(endDateProp)

  // Sync from parent props
  useEffect(() => {
    setInternalStart(startDateProp)
  }, [startDateProp])

  useEffect(() => {
    setInternalEnd(endDateProp)
  }, [endDateProp])

  const resolvedTheme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const resolvedLocale = useMemo<Locale>(() => {
    if (typeof locale === 'string') {
      return builtInLocales[locale] || en
    }
    return locale
  }, [locale])

  const handleStartDateChange = (date: Date | null) => {
    const newEnd = mode === 'single' ? null : internalEnd
    setInternalStart(date)
    setInternalEnd(newEnd)
    onDateChange({ startDate: date, endDate: newEnd })
  }

  const handleEndDateChange = (date: Date | null) => {
    setInternalEnd(date)
    onDateChange({ startDate: internalStart, endDate: date })
  }

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const calendarContent = (
    <CalendarList
      mode={mode}
      locale={resolvedLocale}
      theme={resolvedTheme}
      startDate={internalStart}
      endDate={internalEnd}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
      minDate={minDate}
      maxDate={maxDate}
      holidays={holidays}
      months={months}
      disabledDates={disabledDates}
      renderDay={renderDay}
      showHolidays={showHolidays}
    />
  )

  if (!modal) {
    return <View style={{ flex: 1 }}>{calendarContent}</View>
  }

  return (
    <DatePickerModal
      visible={visible}
      onClose={handleClose}
      onSave={onSave}
      theme={resolvedTheme}
      locale={resolvedLocale}
      showSaveButton={showSaveButton}>
      {calendarContent}
    </DatePickerModal>
  )
}

export default memo(AdvancedDatePicker)
