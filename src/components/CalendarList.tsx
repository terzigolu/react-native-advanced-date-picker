import React, { memo, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert, Dimensions } from 'react-native'
import type { DatePickerMode, MonthData, DateItem, Holiday } from '../utils/types'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { toDate, isSameDate } from '../utils/dateUtils'
import useCalendar from '../hooks/useCalendar'
import DayCell from './DayCell'
import type { DayCellState } from './DayCell'
import WeekDayHeader from './WeekDayHeader'
import MonthHeader from './MonthHeader'

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <WeekDayHeader locale={locale} theme={theme} />
      <View style={[styles.divider, { backgroundColor: theme.dividerColor }]} />
      <ScrollView
        style={{ width: screenWidth - 32 }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}>
        <View style={{ height: 16 }} />
        {calendarData.map(month => (
          <View key={month.id} style={styles.monthContainer}>
            <MonthHeader
              monthName={month.monthName}
              year={month.year}
              theme={theme}
            />
            <View style={styles.daysGrid}>
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
                  renderDay={renderDay}
                />
              ))}
            </View>
            {showHolidays && (
              <View style={styles.holidayContainer}>
                {month.days
                  .filter(d => !d.isEmpty && d.isHoliday)
                  .map(d => (
                    <Text
                      key={d.id}
                      style={[
                        styles.holidayText,
                        { color: theme.textColor, fontFamily: theme.fontFamily },
                      ]}>
                      <Text style={{ color: theme.holidayColor }}>
                        {d.day} {month.monthName}
                      </Text>{' '}
                      {d.holidayLabel}
                    </Text>
                  ))}
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
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  monthContainer: {
    minHeight: 200,
    marginTop: 24,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  holidayContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  holidayText: {
    fontSize: 12,
    marginTop: 4,
  },
})

export default memo(CalendarList)
