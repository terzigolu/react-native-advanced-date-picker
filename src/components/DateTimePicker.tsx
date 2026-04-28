import React, { memo, useCallback, useMemo, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type {
  DateItem,
  Holiday,
  Selection,
} from '../utils/types'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import type { DisabledRange } from '../utils/dateUtils'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'
import CalendarList from './CalendarList'
import TimePicker, { TimePickerValue, TimePickerProps } from './TimePicker'
import type {
  DayCellState,
  RenderMonthHeader,
  RenderWeekDayHeader,
  RenderHolidayLabel,
  GetDayColor,
  GetDayStyle,
  GetDayTextStyle,
  GetDayContent,
} from './types'

export type DateTimePickerProps = {
  /** Controlled `time` selection or initial value. */
  value?: { date: Date | null; hour: number; minute: number }
  /** Fired whenever date OR time changes. Selection.kind is always `'time'`. */
  onChange?: (selection: Extract<Selection, { kind: 'time' }>) => void
  theme?: Partial<Theme>
  locale?: Locale
  minDate?: Date
  maxDate?: Date
  holidays?: Holiday[]
  showHolidays?: boolean
  disabledDates?: (string | Date)[]
  disabledRanges?: DisabledRange[]
  months?: number
  /** Layout direction — `column` stacks Calendar over Time (default). */
  layout?: 'column' | 'row'
  /** Pass-through to the underlying `TimePicker`. */
  hourFormat?: TimePickerProps['hourFormat']
  minuteStep?: TimePickerProps['minuteStep']
  style?: StyleProp<ViewStyle>
  calendarStyle?: StyleProp<ViewStyle>
  timePickerStyle?: StyleProp<ViewStyle>
  /** Custom day cell renderer — full override for the touchable children. */
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
  renderMonthHeader?: RenderMonthHeader
  renderWeekDayHeader?: RenderWeekDayHeader
  renderHolidayLabel?: RenderHolidayLabel
  getDayColor?: GetDayColor
  getDayStyle?: GetDayStyle
  getDayTextStyle?: GetDayTextStyle
  getDayContent?: GetDayContent
}

/**
 * Lane 2 — `DateTimePicker` composes `CalendarList` (single-date) with
 * `TimePicker`. The selection emitted is the discriminated `Selection` union
 * variant `{ kind: 'time', date, hour, minute }` defined in Lane 0.
 */
const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  theme: themeOverrides,
  locale = en,
  minDate,
  maxDate,
  holidays = [],
  showHolidays = true,
  disabledDates = [],
  disabledRanges,
  months = 12,
  layout = 'column',
  hourFormat,
  minuteStep,
  style,
  calendarStyle,
  timePickerStyle,
  renderDay,
  renderMonthHeader,
  renderWeekDayHeader,
  renderHolidayLabel,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
}) => {
  const theme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const [date, setDate] = useState<Date | null>(value?.date ?? null)
  const [time, setTime] = useState<TimePickerValue>({
    hour: value?.hour ?? 0,
    minute: value?.minute ?? 0,
  })

  // Echo controlled value into local state when it changes.
  React.useEffect(() => {
    if (!value) return
    setDate(value.date)
    setTime({ hour: value.hour, minute: value.minute })
  }, [value])

  const emit = useCallback(
    (nextDate: Date | null, nextTime: TimePickerValue) => {
      onChange?.({
        kind: 'time',
        date: nextDate,
        hour: nextTime.hour,
        minute: nextTime.minute,
      })
    },
    [onChange],
  )

  const handleStartDateChange = useCallback(
    (next: Date | null) => {
      setDate(next)
      emit(next, time)
    },
    [emit, time],
  )

  // CalendarList in single mode also calls onEndDateChange(null) — no-op.
  const handleEndDateChange = useCallback(() => {
    /* single-mode: end is always null */
  }, [])

  const handleTimeChange = useCallback(
    (next: TimePickerValue) => {
      setTime(next)
      emit(date, next)
    },
    [emit, date],
  )

  return (
    <View
      style={[
        layout === 'row' ? styles.row : styles.column,
        { backgroundColor: theme.background },
        style,
      ]}>
      <View style={[layout === 'row' ? styles.flexHalf : null, calendarStyle]}>
        <CalendarList
          mode="single"
          locale={locale}
          theme={theme}
          startDate={date}
          endDate={null}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          minDate={minDate}
          maxDate={maxDate}
          holidays={holidays}
          months={months}
          disabledDates={disabledDates}
          disabledRanges={disabledRanges}
          showHolidays={showHolidays}
          renderDay={renderDay}
          renderMonthHeader={renderMonthHeader}
          renderWeekDayHeader={renderWeekDayHeader}
          renderHolidayLabel={renderHolidayLabel}
          getDayColor={getDayColor}
          getDayStyle={getDayStyle}
          getDayTextStyle={getDayTextStyle}
          getDayContent={getDayContent}
        />
      </View>
      <View style={[layout === 'row' ? styles.flexHalf : null, timePickerStyle]}>
        <TimePicker
          value={time}
          onChange={handleTimeChange}
          theme={theme}
          locale={locale}
          hourFormat={hourFormat}
          minuteStep={minuteStep}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  flexHalf: {
    flex: 1,
  },
})

export default memo(DateTimePicker)
