import React, { memo, useCallback } from 'react'
import { View, ScrollView, Text, StyleSheet, Alert, Dimensions } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type {
  DatePickerMode,
  DateItem,
  Holiday,
  SelectionMode,
} from '../utils/types'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import {
  toDate,
  isSameDate,
  isDateBlocked,
  clampRange,
  getRangeLength,
  formatDateKey,
} from '../utils/dateUtils'
import type { DisabledRange } from '../utils/dateUtils'
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
  GetDayBadge,
  RenderDayBadge,
} from './types'

type Props = {
  /**
   * Lane 1 — `'single' | 'range'` are still supported for backward compat.
   * `'multi'` (Lane 1) keeps each tap as a toggle in `selectedDateKeys`.
   */
  mode: DatePickerMode | SelectionMode
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
  /** Lane 1 — declarative blocked windows (booked nights, etc.). */
  disabledRanges?: DisabledRange[]
  /** Lane 1 — minimum inclusive range length in days. */
  minRangeLength?: number
  /** Lane 1 — maximum inclusive range length in days. */
  maxRangeLength?: number
  /** Lane 1 — set of selected ISO `YYYY-MM-DD` keys (multi mode). */
  selectedDateKeys?: Set<string>
  /** Lane 1 — fired with the toggled `Date` after a multi-mode tap. */
  onMultiToggle?: (date: Date) => void
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
  /** Lane 4 — per-day badge callback (event marker dots). */
  getBadge?: GetDayBadge
  /** Lane 4 — full slot override for the badge row. */
  renderBadge?: RenderDayBadge
  /**
   * Lane 3 — anchor month for the generated calendar list. Defaults to
   * "today" (current month). Pass any date inside a desired anchor month
   * to scroll-jump after a quickNav drill-in.
   */
  startFrom?: Date
  /**
   * Lane 3 — opt-in MonthHeader press handler. Receives the month's first
   * day at midnight. When set, MonthHeader becomes a `<Pressable>`.
   */
  onPressMonthHeader?: (firstDay: Date) => void
  /**
   * Lane 5 — keyboard navigation focus. When set, the matching day cell
   * renders a focus ring and announces the focused state. Driven by the
   * `useKeyboardNav` hook on platforms that emit `onKeyDown`.
   */
  focusedDate?: Date | null
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
  disabledRanges,
  minRangeLength,
  maxRangeLength,
  selectedDateKeys,
  onMultiToggle,
  renderDay,
  showHolidays = true,
  disableAnimation = false,
  style,
  monthContainerStyle,
  daysGridStyle,
  renderMonthHeader,
  renderWeekDayHeader,
  renderHolidayLabel,
  focusedDate,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
  getBadge,
  renderBadge,
  startFrom,
  onPressMonthHeader,
}) => {
  const { calendarData } = useCalendar({
    months,
    locale: locale.code,
    holidays,
    startFrom,
  })

  const handleDatePress = useCallback(
    (day: DateItem) => {
      const date = toDate(day.fullDate)
      if (!date) return

      for (const d of disabledDates) {
        const disabled = toDate(typeof d === 'string' ? d : d)
        if (disabled && isSameDate(date, disabled)) return
      }

      // Lane 1 — declarative disabled windows short-circuit before emit.
      if (isDateBlocked(date, disabledRanges)) return

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

      // Lane 1 — multi mode: tap toggles membership; parent owns the Set.
      if (mode === 'multi') {
        onMultiToggle?.(date)
        return
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
          // Lane 1 — clamp the picked end-date to satisfy min/max constraints.
          // The clamp helper preserves orientation, so we pass `start` first.
          if (
            typeof minRangeLength === 'number' ||
            typeof maxRangeLength === 'number'
          ) {
            const length = getRangeLength(startDate, date)
            if (
              (typeof minRangeLength === 'number' && length < minRangeLength) ||
              (typeof maxRangeLength === 'number' && length > maxRangeLength)
            ) {
              const clamped = clampRange(
                startDate,
                date,
                minRangeLength,
                maxRangeLength,
              )
              onEndDateChange(clamped.end)
              return
            }
          }
          onEndDateChange(date)
        } else {
          onStartDateChange(date)
        }
      }
    },
    [
      mode,
      startDate,
      endDate,
      minDate,
      disabledDates,
      disabledRanges,
      minRangeLength,
      maxRangeLength,
      onMultiToggle,
      locale,
      onStartDateChange,
      onEndDateChange,
    ],
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
                onPress={
                  onPressMonthHeader
                    ? () => {
                        const firstDay = new Date(month.year, month.month, 1)
                        firstDay.setHours(0, 0, 0, 0)
                        onPressMonthHeader(firstDay)
                      }
                    : undefined
                }
              />
            )}
            <View style={[styles.daysGrid, daysGridStyle]}>
              {month.days.map(day => {
                const dayDate = toDate(day.fullDate)
                const isBlocked = dayDate
                  ? isDateBlocked(dayDate, disabledRanges)
                  : false
                // Lane 5 — compose accessibilityLabel from locale + day state.
                // Skipped for empty placeholder cells so screen readers don't
                // announce them.
                let a11yLabel: string | undefined
                if (!day.isEmpty && dayDate) {
                  const dateText = (() => {
                    try {
                      return dayDate.toLocaleDateString(locale.code, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    } catch {
                      return dayDate.toDateString()
                    }
                  })()
                  const parts: string[] = [dateText]
                  if (day.isHoliday && day.holidayLabel) {
                    const prefix = locale.a11y_holiday_prefix ?? ''
                    parts.push(`${prefix} ${day.holidayLabel}`.trim())
                  }
                  if (day.isToday && locale.a11y_today) {
                    parts.push(locale.a11y_today)
                  }
                  const isStart =
                    !!startDate &&
                    isSameDate(toDate(startDate), dayDate)
                  const isEnd = !!endDate && isSameDate(toDate(endDate), dayDate)
                  // Lane 5 — multi-select a11y: selectedDateKeys uses
                  // `YYYY-MM-DD` (formatDateKey output), but `day.fullDate`
                  // is a full ISO string. Compose the same key from dayDate
                  // so the "selected" suffix actually fires.
                  const isMultiSel =
                    mode === 'multi' &&
                    !!selectedDateKeys &&
                    !!dayDate &&
                    selectedDateKeys.has(formatDateKey(dayDate))
                  if ((isStart || isEnd || isMultiSel) && locale.a11y_selected) {
                    parts.push(locale.a11y_selected)
                  }
                  const dayDisabled =
                    isBlocked ||
                    (!!minDate && dayDate < toDate(minDate)!) ||
                    (!!maxDate && dayDate > toDate(maxDate)!)
                  if (dayDisabled && locale.a11y_disabled) {
                    parts.push(locale.a11y_disabled)
                  }
                  a11yLabel = parts.join(', ')
                }
                return (
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
                    getBadge={getBadge}
                    renderBadge={renderBadge}
                    isMultiMode={mode === 'multi'}
                    selectedDateKeys={selectedDateKeys}
                    isBlocked={isBlocked}
                    accessibilityLabel={a11yLabel}
                    isFocused={
                      !!focusedDate &&
                      !!dayDate &&
                      isSameDate(focusedDate, dayDate)
                    }
                  />
                )
              })}
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
