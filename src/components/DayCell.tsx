import React, { memo } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native'
import type { DateItem } from '../utils/types'
import type { Theme } from '../theme/types'

type Props = {
  day: DateItem
  onPress: (day: DateItem) => void
  startDate: Date | null
  endDate: Date | null
  theme: Theme
  /** Whether this day is inside the selected range (range mode only) */
  isInRange?: boolean
  /** Minimum selectable date — dates before this are disabled */
  minDate?: Date
  /** Maximum selectable date — dates after this are disabled */
  maxDate?: Date
  /** Custom day cell renderer */
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
}

export type DayCellState = {
  isSelected: boolean
  isInRange: boolean
  isDisabled: boolean
  isToday: boolean
  isHoliday: boolean
  isSunday: boolean
}

const toDate = (date: Date | string | null) => {
  if (!date) return null
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (isNaN(parsed.getTime())) return null
  const d = new Date(parsed.getTime())
  d.setHours(0, 0, 0, 0)
  return d
}

const isSameDate = (a: Date | null, b: Date | null) => {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const { width: screenWidth } = Dimensions.get('window')

const DayCell: React.FC<Props> = ({
  day,
  onPress,
  startDate,
  endDate,
  theme,
  isInRange = false,
  minDate,
  maxDate,
  renderDay,
}) => {
  const startDateNorm = toDate(startDate)
  const endDateNorm = toDate(endDate)
  const dayDate = toDate(day.fullDate)

  const isSelected =
    isSameDate(startDateNorm, dayDate) || isSameDate(endDateNorm, dayDate)

  let isDisabled = !dayDate
  if (dayDate) {
    if (minDate) {
      const min = toDate(minDate)
      if (min && dayDate < min) isDisabled = true
    }
    if (maxDate) {
      const max = toDate(maxDate)
      if (max && dayDate > max) isDisabled = true
    }
  }

  const state: DayCellState = {
    isSelected,
    isInRange,
    isDisabled,
    isToday: day.isToday,
    isHoliday: day.isHoliday,
    isSunday: day.isSunday,
  }

  if (day.isEmpty) {
    return <View style={styles.cell} />
  }

  if (renderDay) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => !isDisabled && onPress(day)}
        disabled={isDisabled}
        style={styles.cell}>
        {renderDay(day, state)}
      </TouchableOpacity>
    )
  }

  const cellStyle = isSelected
    ? [styles.cellInner, { borderRadius: theme.dayBorderRadius, backgroundColor: theme.primary }]
    : isDisabled
      ? [styles.cellInner, { opacity: 0.4 }]
      : [styles.cellInner]

  const textColor = isSelected
    ? theme.selectedTextColor
    : isDisabled
      ? theme.disabledColor
      : day.isSunday
        ? theme.sundayColor
        : day.isHoliday
          ? theme.holidayColor
          : theme.textColor

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => !isDisabled && onPress(day)}
      disabled={isDisabled}
      style={styles.cell}>
      {isInRange && (
        <View
          style={[
            styles.rangeBackground,
            { backgroundColor: theme.rangeBackground },
          ]}
        />
      )}
      <View style={cellStyle}>
        <Text
          style={[
            styles.dayText,
            {
              color: textColor,
              fontFamily: theme.fontFamily,
              zIndex: 2,
            },
          ]}>
          {day.day}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// Match original ucuzyolu sizing: screenWidth / 6.25 - 32 with margin 10
const baseSize = screenWidth / 6.25 - 32

const styles = StyleSheet.create({
  cell: {
    height: baseSize,
    maxHeight: baseSize,
    width: baseSize,
    maxWidth: baseSize,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    zIndex: 1,
  },
  cellInner: {
    width: baseSize,
    height: baseSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rangeBackground: {
    position: 'absolute',
    zIndex: -999,
    width: screenWidth / 4,
    height: 32,
    borderRadius: 12,
  },
})

export default memo(DayCell)
