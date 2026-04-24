import React, { memo, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert, Dimensions } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type { DatePickerMode, DateItem, Holiday } from '../utils/types'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { toDate, isSameDate } from '../utils/dateUtils'
import useCalendar from '../hooks/useCalendar'
import DayCell from './DayCell'
import WeekDayHeader from './WeekDayHeader'
import MonthHeader from './MonthHeader'
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

type Props = {
  mode: DatePickerMode
  locale: Locale
  theme: Theme
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
  minDate?: Date
  maxDate?: Date
  holidays?: Holiday[]
  months?: number
  disabledDates?: (string | Date)[]
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
  showHolidays?: boolean
  /** Disable the range band fill animation. Default: false */
  disableAnimation?: boolean
  /** Style applied to the outer container View. */
  style?: StyleProp<ViewStyle>
  /** Style applied to each month block wrapper. */
  monthContainerStyle?: StyleProp<ViewStyle>
  /** Style applied to the 7-column days grid wrapper. */
  daysGridStyle?: StyleProp<ViewStyle>
  /** Slot: override the per-month header (month name + year row). */
  renderMonthHeader?: RenderMonthHeader
  /** Slot: override the top week-day header row. */
  renderWeekDayHeader?: RenderWeekDayHeader
  /** Slot: override each holiday label row in the holiday list. */
  renderHolidayLabel?: RenderHolidayLabel
  /** Per-day text color override. */
  getDayColor?: GetDayColor
  /** Per-day slot style override. */
  getDayStyle?: GetDayStyle
  /** Per-day text style override. */
  getDayTextStyle?: GetDayTextStyle
  /** Per-day custom content override (replaces the day number). */
  getDayContent?: GetDayContent
}

const screenWidth = Dimensions.get('window').width

const CalendarList: React.FC<Props> = ({
  mode,
  locale,
  theme,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  holidays = [],
  months = 12,
  disabledDates = [],
  renderDay,
  showHolidays = true,
  disableAnimation = false,
  style,
  monthContainerStyle,
  daysGridStyle,
  renderMonthHeader,
  renderWeekDayHeader,
  renderHolidayLabel,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
}) => {
  const { calendarData } = useCalendar({
    months,
    locale: locale.code,
    holidays,
  })

  const handleDatePress = useCallback(
    (day: DateItem) => {
      const date = toDate(day.fullDate)
      if (!date) return

      for (const d of disabledDates) {
        const disabled = toDate(typeof d === 'string' ? d : d)
        if (disabled && isSameDate(date, disabled)) return
      }

      if (minDate) {
        const min = new Date(minDate)
        min.setHours(0, 0, 0, 0)
        if (date < min) {
          Alert.alert(locale.warningTitle, locale.pastDateWarning, [
            { text: locale.ok },
          ])
          return
        }
      }

      if (mode === 'single') {
        onStartDateChange(date)
        onEndDateChange(null)
        return
      }

      if (!startDate || (startDate && endDate)) {
        onStartDateChange(date)
        onEndDateChange(null)
        return
      }

      if (startDate && !endDate) {
        if (date >= startDate) {
          onEndDateChange(date)
        } else {
          onStartDateChange(date)
        }
      }
    },
    [mode, startDate, endDate, minDate, disabledDates, locale, onStartDateChange, onEndDateChange],
  )

  const checkIsInRange = (day: DateItem) => {
    const dayDate = toDate(day.fullDate)
    const checkIn = startDate ? toDate(startDate) : null
    const checkOut = endDate ? toDate(endDate) : null
    return checkIn && checkOut && dayDate
      ? dayDate > checkIn && dayDate < checkOut
      : false
  }

  // Build a quick lookup for enriched holiday metadata (color/important/icon)
  // so we can apply per-holiday overrides when rendering the label list.
  const holidayMetaByDateKey = React.useMemo(() => {
    const map = new Map<string, Holiday>()
    for (const h of holidays) map.set(h.date, h)
    return map
  }, [holidays])

  const findHolidayForDay = (d: DateItem): Holiday | undefined => {
    // The generator stores holidays keyed on MM-DD. Fall back to exact match.
    const parsed = toDate(d.fullDate)
    if (!parsed) return undefined
    const mm = String(parsed.getMonth() + 1).padStart(2, '0')
    const dd = String(parsed.getDate()).padStart(2, '0')
    return (
      holidayMetaByDateKey.get(`${mm}-${dd}`) ||
      holidayMetaByDateKey.get(d.fullDate.slice(0, 10))
    )
  }

  const monthGap = theme.spacing?.monthGap ?? 24
  const weekDayHeaderGap = theme.spacing?.weekDayHeaderGap ?? 16
  const holidayGap = theme.spacing?.holidayGap ?? 8
  const holidayFontSize = theme.fontSize?.holiday ?? 12

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }, style]}>
      {renderWeekDayHeader ? (
        renderWeekDayHeader({ days: locale.dayNamesShort, theme, locale })
      ) : (
        <WeekDayHeader locale={locale} theme={theme} />
      )}
      <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />
      <ScrollView
        style={{ width: screenWidth - 32 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}>
        <View style={{ height: weekDayHeaderGap }} />
        {calendarData.map((month, monthIndex) => (
          <View
            key={month.id}
            style={[
              styles.monthContainer,
              { marginTop: monthIndex === 0 ? 0 : monthGap },
              monthContainerStyle,
            ]}>
            {renderMonthHeader ? (
              renderMonthHeader({
                month: month.monthName,
                year: month.year,
                theme,
                locale,
              })
            ) : (
              <MonthHeader
                monthName={month.monthName}
                year={month.year}
                theme={theme}
              />
            )}
            <View style={[styles.daysGrid, daysGridStyle]}>
              {month.days.map(day => (
                <DayCell
                  key={day.fullDate || day.id}
                  day={day}
                  onPress={() => handleDatePress(day)}
                  startDate={startDate}
                  endDate={endDate}
                  isInRange={checkIsInRange(day)}
                  minDate={minDate}
                  maxDate={maxDate}
                  theme={theme}
                  disableAnimation={disableAnimation}
                  renderDay={renderDay}
                  getDayColor={getDayColor}
                  getDayStyle={getDayStyle}
                  getDayTextStyle={getDayTextStyle}
                  getDayContent={getDayContent}
                />
              ))}
            </View>
            {showHolidays && (
              <View
                style={[styles.holidayContainer, { marginTop: holidayGap }]}>
                {month.days
                  .filter(d => !d.isEmpty && d.isHoliday)
                  .map(d => {
                    const meta = findHolidayForDay(d)
                    if (renderHolidayLabel && meta) {
                      return (
                        <React.Fragment key={d.id}>
                          {renderHolidayLabel({ holiday: meta, day: d, theme })}
                        </React.Fragment>
                      )
                    }
                    const labelColor = meta?.color ?? theme.holidayColor
                    const fontWeight = meta?.important ? '700' : undefined
                    return (
                      <Text
                        key={d.id}
                        style={[
                          styles.holidayText,
                          {
                            color: theme.textColor,
                            fontFamily: theme.fontFamily,
                            fontSize: holidayFontSize,
                            fontWeight,
                          },
                        ]}>
                        <Text style={{ color: labelColor, fontWeight }}>
                          {d.day} {month.monthName}
                        </Text>{' '}
                        {d.holidayLabel}
                      </Text>
                    )
                  })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  monthContainer: {
    minHeight: 200,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  holidayContainer: {
    alignItems: 'center',
  },
  holidayText: {
    marginTop: 4,
  },
})

export default memo(CalendarList)
