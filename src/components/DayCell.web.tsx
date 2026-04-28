import React, { memo, useEffect, useState } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { DateItem } from '../utils/types'
import type { Theme } from '../theme/types'
import type {
  DayCellState,
  GetDayColor,
  GetDayStyle,
  GetDayTextStyle,
  GetDayContent,
} from './types'

/**
 * Lane 6 — Web shadow for `DayCell`.
 *
 * Same prop surface as the native sibling. Differences:
 *  - Range-fill band uses a CSS `transition` instead of `Animated.timing`
 *    (which warns on web when `useNativeDriver: true`).
 *  - Adds hover state via `onMouseEnter` / `onMouseLeave`. The hover layer
 *    sits underneath the range band / selected circle so it never masks
 *    them.
 *  - Keyboard focus (Tab) is handled by the underlying RN Web `<button>`.
 */

type Props = {
  day: DateItem
  onPress: (day: DateItem) => void
  startDate: Date | null
  endDate: Date | null
  theme: Theme
  isInRange?: boolean
  minDate?: Date
  maxDate?: Date
  disableAnimation?: boolean
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
  style?: StyleProp<ViewStyle>
  selectedStyle?: StyleProp<ViewStyle>
  rangeStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  getDayColor?: GetDayColor
  getDayStyle?: GetDayStyle
  getDayTextStyle?: GetDayTextStyle
  getDayContent?: GetDayContent
  selectedDateKeys?: Set<string>
  isMultiMode?: boolean
  isBlocked?: boolean
}

export type { DayCellState } from './types'

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

// Same slot math as the native sibling — keeping these constants in sync
// matters because consumers may compose calendars across platforms.
const SLOT = Math.floor((screenWidth - 32) / 7)
const CIRCLE = Math.min(SLOT - 8, 44)
const BAND_HEIGHT = CIRCLE

const DayCellWeb: React.FC<Props> = ({
  day,
  onPress,
  startDate,
  endDate,
  theme,
  isInRange = false,
  minDate,
  maxDate,
  disableAnimation = false,
  renderDay,
  style,
  selectedStyle,
  rangeStyle,
  textStyle,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
  selectedDateKeys,
  isMultiMode = false,
  isBlocked = false,
}) => {
  const startDateNorm = toDate(startDate)
  const endDateNorm = toDate(endDate)
  const dayDate = toDate(day.fullDate)

  const dayKey = dayDate
    ? `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
    : null
  const isMultiSelected =
    isMultiMode && !!dayKey && !!selectedDateKeys && selectedDateKeys.has(dayKey)

  const isRangeStart = isSameDate(startDateNorm, dayDate)
  const isRangeEnd = isSameDate(endDateNorm, dayDate)
  const isSelected = isMultiMode ? isMultiSelected : isRangeStart || isRangeEnd
  const hasValidRange =
    !isMultiMode &&
    !!startDateNorm &&
    !!endDateNorm &&
    !isSameDate(startDateNorm, endDateNorm)

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
    if (isBlocked) isDisabled = true
  }

  const isSaturday =
    typeof day.isSaturday === 'boolean'
      ? day.isSaturday
      : (() => {
          const d = toDate(day.fullDate)
          return d ? d.getDay() === 6 : false
        })()

  const state: DayCellState = {
    isSelected,
    isInRange: isMultiMode ? false : isInRange,
    isDisabled,
    isToday: day.isToday,
    isHoliday: day.isHoliday,
    isSunday: day.isSunday,
    isSaturday,
    isBlocked,
  }

  // Web-only hover state. We never do hover detection on native (it'd be
  // dead code on touch).
  const [hovered, setHovered] = useState(false)

  // Web range-fill: drive opacity via state + CSS transition. Mount at 0,
  // flip to 1 on the next frame so the transition fires. When `bandStyle`
  // disappears we drop straight to 0 (no exit animation needed — the
  // surrounding band is already being unmounted by the parent).
  const [bandOpacity, setBandOpacity] = useState(disableAnimation ? 1 : 0)

  // Compute bandStyle (same logic as native sibling).
  let bandStyle: any = null
  if (isMultiMode) {
    bandStyle = null
  } else if (isInRange) {
    bandStyle = styles.bandFull
  } else if (hasValidRange && isRangeStart) {
    bandStyle = styles.bandRight
  } else if (hasValidRange && isRangeEnd) {
    bandStyle = styles.bandLeft
  }

  useEffect(() => {
    if (!bandStyle) {
      setBandOpacity(0)
      return
    }
    if (disableAnimation) {
      setBandOpacity(1)
      return
    }
    setBandOpacity(0)
    const raf = requestAnimationFrame(() => setBandOpacity(1))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    !!bandStyle,
    startDateNorm?.getTime(),
    endDateNorm?.getTime(),
    disableAnimation,
  ])

  if (day.isEmpty) {
    return <View style={[styles.slot, style]} />
  }

  if (renderDay) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => !isDisabled && onPress(day)}
        disabled={isDisabled}
        style={[styles.slot, style]}>
        {renderDay(day, state)}
      </TouchableOpacity>
    )
  }

  // Weekend color resolution: weekendColor wins over saturday/sunday colors.
  const weekendOverride = theme.weekendColor
  const satColor = weekendOverride ?? theme.saturdayColor
  const sunColor = weekendOverride ?? theme.sundayColor

  const overrideColor = getDayColor ? getDayColor({ day, state, theme }) : undefined

  const textColor =
    overrideColor ??
    (isSelected
      ? theme.selectedTextColor
      : isDisabled
        ? theme.disabledColor
        : day.isSunday
          ? sunColor
          : isSaturday && satColor
            ? satColor
            : day.isHoliday
              ? theme.holidayColor
              : theme.textColor)

  const fontSize = theme.fontSize?.day ?? 14

  const overrideSlotStyle = getDayStyle ? getDayStyle({ day, state, theme }) : undefined
  const overrideTextStyle = getDayTextStyle
    ? getDayTextStyle({ day, state, theme })
    : undefined

  const customContent = getDayContent
    ? getDayContent({ day, state, theme })
    : undefined

  // CSS transition for range-fill — driven by state instead of Animated.
  const bandTransitionStyle: any = {
    transition: 'opacity 160ms cubic-bezier(0.33, 1, 0.68, 1)',
  }

  // Hover layer is purely web-cosmetic: a faint background tint when the
  // pointer is over the cell and it isn't already selected/in-range.
  const showHover = hovered && !isSelected && !isInRange && !isDisabled

  // RN Web forwards onMouseEnter / onMouseLeave to the DOM.
  const hoverHandlers: any = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => !isDisabled && onPress(day)}
      disabled={isDisabled}
      {...hoverHandlers}
      style={[styles.slot, style, overrideSlotStyle]}>
      {/* Layer 0: hover tint — sits below the band so it never occludes
          the range fill. Uses a 40-opacity hex of the primary color. */}
      {showHover && (
        <View
          style={[
            styles.bandFull,
            {
              backgroundColor: theme.rangeBackground,
              opacity: 0.35,
              borderRadius: theme.dayBorderRadius,
            },
          ]}
        />
      )}

      {/* Layer 1: range band with CSS transition. */}
      {bandStyle && (
        <View
          style={[
            bandStyle,
            {
              backgroundColor: theme.rangeBackground,
              opacity: bandOpacity,
            },
            bandTransitionStyle,
            rangeStyle,
          ]}
        />
      )}

      {/* Layer 2: selected circle. */}
      {isSelected && (
        <View
          style={[
            styles.circle,
            {
              backgroundColor: theme.primary,
              borderRadius: theme.dayBorderRadius,
            },
            selectedStyle,
          ]}
        />
      )}

      {/* Layer 3: day number. */}
      {customContent !== undefined ? (
        customContent
      ) : (
        <Text
          style={[
            styles.dayText,
            {
              color: textColor,
              fontFamily: theme.fontFamily,
              opacity: isDisabled ? 0.4 : 1,
              fontSize,
            },
            textStyle,
            overrideTextStyle,
          ]}>
          {day.day}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  slot: {
    width: SLOT,
    height: SLOT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bandFull: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (SLOT - BAND_HEIGHT) / 2,
    height: BAND_HEIGHT,
  },
  bandRight: {
    position: 'absolute',
    left: '50%',
    right: 0,
    top: (SLOT - BAND_HEIGHT) / 2,
    height: BAND_HEIGHT,
  },
  bandLeft: {
    position: 'absolute',
    left: 0,
    right: '50%',
    top: (SLOT - BAND_HEIGHT) / 2,
    height: BAND_HEIGHT,
  },
  circle: {
    position: 'absolute',
    width: CIRCLE,
    height: CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontWeight: '500',
  },
})

export default memo(DayCellWeb)
