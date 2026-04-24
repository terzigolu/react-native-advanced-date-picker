import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type {
  DatePickerMode,
  Holiday,
  OnDateChangePayload,
  DateItem,
} from './utils/types'
import type { Theme } from './theme/types'
import type { Locale } from './locale/types'
import type {
  DayCellState,
  RenderMonthHeader,
  RenderWeekDayHeader,
  RenderHolidayLabel,
  RenderSaveButton,
  RenderCloseIcon,
  GetDayColor,
  GetDayStyle,
  GetDayTextStyle,
  GetDayContent,
} from './components/types'
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
  /** Disable the range band fill animation. Default: false */
  disableAnimation?: boolean
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode

  /** Root view style (inline mode, i.e. modal=false). */
  style?: StyleProp<ViewStyle>
  /** Container (slide-up sheet) style in modal mode. */
  modalContainerStyle?: StyleProp<ViewStyle>
  /** Modal header row (close-icon row) style. */
  headerStyle?: StyleProp<ViewStyle>
  /** Save button wrapper style. */
  saveButtonStyle?: StyleProp<ViewStyle>
  /** Save button text style. */
  saveButtonTextStyle?: StyleProp<TextStyle>
  /** Close (X) button wrapper style. */
  closeButtonStyle?: StyleProp<ViewStyle>
  /** Close (X) glyph text style. */
  closeButtonTextStyle?: StyleProp<TextStyle>

  /** Slot: override the month header row. */
  renderMonthHeader?: RenderMonthHeader
  /** Slot: override the week day header row. */
  renderWeekDayHeader?: RenderWeekDayHeader
  /** Slot: override each holiday label in the holiday list. */
  renderHolidayLabel?: RenderHolidayLabel
  /** Slot: override the save button (modal mode). */
  renderSaveButton?: RenderSaveButton
  /** Slot: override the close (X) icon (modal mode). */
  renderCloseIcon?: RenderCloseIcon

  /** Per-day text color override. Return `undefined` to fall through. */
  getDayColor?: GetDayColor
  /** Per-day slot style override (composed on top of other styles). */
  getDayStyle?: GetDayStyle
  /** Per-day text style override (composed on top of other styles). */
  getDayTextStyle?: GetDayTextStyle
  /** Per-day custom content — replaces the default day number. */
  getDayContent?: GetDayContent
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
  disableAnimation = false,
  renderDay,
  style,
  modalContainerStyle,
  headerStyle,
  saveButtonStyle,
  saveButtonTextStyle,
  closeButtonStyle,
  closeButtonTextStyle,
  renderMonthHeader,
  renderWeekDayHeader,
  renderHolidayLabel,
  renderSaveButton,
  renderCloseIcon,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
}) => {
  // Internal state for immediate re-render inside the modal boundary.
  const [internalStart, setInternalStart] = useState<Date | null>(startDateProp)
  const [internalEnd, setInternalEnd] = useState<Date | null>(endDateProp)

  // Track the last value we emitted via onDateChange so we can distinguish
  // "parent echoed our update back" from "parent actually set a new value".
  const lastEmitted = useRef<{ start: Date | null; end: Date | null }>({
    start: startDateProp,
    end: endDateProp,
  })

  const sameDay = (a: Date | null, b: Date | null) => {
    if (a === b) return true
    if (!a || !b) return false
    return a.getTime() === b.getTime()
  }

  // Sync from parent props only when parent actually supplies a new value,
  // not when it's just echoing back what we emitted.
  useEffect(() => {
    if (sameDay(startDateProp, lastEmitted.current.start)) return
    setInternalStart(startDateProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateProp])

  useEffect(() => {
    if (sameDay(endDateProp, lastEmitted.current.end)) return
    setInternalEnd(endDateProp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    lastEmitted.current = { start: date, end: newEnd }
    onDateChange({ startDate: date, endDate: newEnd })
  }

  const handleEndDateChange = (date: Date | null) => {
    setInternalEnd(date)
    lastEmitted.current = { start: internalStart, end: date }
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
      disableAnimation={disableAnimation}
      renderMonthHeader={renderMonthHeader}
      renderWeekDayHeader={renderWeekDayHeader}
      renderHolidayLabel={renderHolidayLabel}
      getDayColor={getDayColor}
      getDayStyle={getDayStyle}
      getDayTextStyle={getDayTextStyle}
      getDayContent={getDayContent}
    />
  )

  if (!modal) {
    return <View style={[{ flex: 1 }, style]}>{calendarContent}</View>
  }

  return (
    <DatePickerModal
      visible={visible}
      onClose={handleClose}
      onSave={onSave}
      theme={resolvedTheme}
      locale={resolvedLocale}
      showSaveButton={showSaveButton}
      style={modalContainerStyle}
      headerStyle={headerStyle}
      saveButtonStyle={saveButtonStyle}
      saveButtonTextStyle={saveButtonTextStyle}
      closeButtonStyle={closeButtonStyle}
      closeButtonTextStyle={closeButtonTextStyle}
      renderSaveButton={renderSaveButton}
      renderCloseIcon={renderCloseIcon}>
      {calendarContent}
    </DatePickerModal>
  )
}

export default memo(AdvancedDatePicker)
