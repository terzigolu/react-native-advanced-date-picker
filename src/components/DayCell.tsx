import React, { memo, useEffect, useRef } from 'react'
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { DateItem } from '../utils/types'
import type { Theme } from '../theme/types'
import type {
  DayCellState,
  DayBadge,
  GetDayColor,
  GetDayStyle,
  GetDayTextStyle,
  GetDayContent,
  GetDayBadge,
  RenderDayBadge,
} from './types'

type Props = {
  day: DateItem
  onPress: (day: DateItem) => void
  startDate: Date | null
  endDate: Date | null
  theme: Theme
  /** Whether this day is strictly between startDate and endDate (range mode). */
  isInRange?: boolean
  /** Minimum selectable date — dates before this are disabled. */
  minDate?: Date
  /** Maximum selectable date — dates after this are disabled. */
  maxDate?: Date
  /** Disable range band animation (band appears instantly). */
  disableAnimation?: boolean
  /** Custom day cell renderer — full override for the touchable children. */
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode
  /** Style applied to the outer touchable slot. */
  style?: StyleProp<ViewStyle>
  /** Style applied on top of the selected circle. */
  selectedStyle?: StyleProp<ViewStyle>
  /** Style applied on top of the range band fill. */
  rangeStyle?: StyleProp<ViewStyle>
  /** Style applied on top of the day number text. */
  textStyle?: StyleProp<TextStyle>
  /** Per-day text color override. Return `undefined` to use the default. */
  getDayColor?: GetDayColor
  /** Per-day slot style override. Composed on top of `style`. */
  getDayStyle?: GetDayStyle
  /** Per-day text style override. Composed on top of `textStyle`. */
  getDayTextStyle?: GetDayTextStyle
  /** Per-day custom content. Replaces the default day-number <Text>. */
  getDayContent?: GetDayContent
  /**
   * Lane 4 — per-day badge callback. Returns zero, one, or many `DayBadge`s
   * to render under the day number. Default UI caps visible dots at 3 with
   * a "+N" overflow indicator. The badge layer lives in its own absolutely-
   * positioned View so the existing range-fill `bandOpacity` animation is
   * not affected.
   */
  getBadge?: GetDayBadge
  /**
   * Lane 4 — full slot override for the badge row. When provided, the default
   * dot UI is bypassed and the consumer's return is rendered verbatim under
   * the day number.
   */
  renderBadge?: RenderDayBadge
  /**
   * Lane 1 — multi-select hit-set. When provided, a date is "selected" iff
   * its ISO `YYYY-MM-DD` key is in this Set. Used in conjunction with
   * `isMultiMode` so the cell skips range-fill animation and renders just
   * the selected circle.
   */
  selectedDateKeys?: Set<string>
  /** Lane 1 — true when the parent is operating in multi mode. */
  isMultiMode?: boolean
  /** Lane 1 — true when the cell falls inside a `disabledRanges` window. */
  isBlocked?: boolean
  /**
   * Lane 5 — accessibility label for screen readers. When omitted, the cell
   * renders without a custom label and platform defaults apply (which read
   * the day number only). Composed by CalendarList from the active locale +
   * day state so the cell stays presentational.
   */
  accessibilityLabel?: string
  /** Lane 5 — accessibility hint paired with the composed label. */
  accessibilityHint?: string
  /**
   * Lane 5 — keyboard navigation focus indicator. When true the cell gets a
   * subtle focus ring. Animation-free, sits in its own layer so the existing
   * range-band `bandOpacity` is untouched.
   */
  isFocused?: boolean
}

// Re-export for backward compatibility (originally declared here).
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

// One grid cell owns a full slot of the 7-column row. Background bands fill
// the slot edge-to-edge, so adjacent in-range cells visually connect without
// leaking into neighbouring slots (which would clip neighbouring text).
const SLOT = Math.floor((screenWidth - 32) / 7)
const CIRCLE = Math.min(SLOT - 8, 44)

const DayCell: React.FC<Props> = ({
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
  getBadge,
  renderBadge,
  selectedDateKeys,
  isMultiMode = false,
  isBlocked = false,
  accessibilityLabel,
  accessibilityHint,
  isFocused = false,
}) => {
  const startDateNorm = toDate(startDate)
  const endDateNorm = toDate(endDate)
  const dayDate = toDate(day.fullDate)

  // Lane 1 — multi-select membership lookup. Computed inline to avoid
  // re-deriving the ISO key when the parent already maintains a Set.
  const dayKey = dayDate
    ? `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
    : null
  const isMultiSelected =
    isMultiMode && !!dayKey && !!selectedDateKeys && selectedDateKeys.has(dayKey)

  const isRangeStart = isSameDate(startDateNorm, dayDate)
  const isRangeEnd = isSameDate(endDateNorm, dayDate)
  const isSelected = isMultiMode ? isMultiSelected : isRangeStart || isRangeEnd
  // A valid range exists only when both endpoints are set and distinct.
  // Disabled in multi mode (no band fill there).
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

  // Some DateItems generated by older callers may not carry isSaturday; infer.
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

  // Decide which part of the range band to render in this cell:
  // - Middle day in range: full-width band
  // - Range start with valid range: right half only (connects to next cell)
  // - Range end with valid range: left half only (connects to prev cell)
  let bandStyle: any = null
  if (isMultiMode) {
    // Multi mode never paints a connecting band — each cell stands alone.
    bandStyle = null
  } else if (isInRange) {
    bandStyle = styles.bandFull
  } else if (hasValidRange && isRangeStart) {
    bandStyle = styles.bandRight
  } else if (hasValidRange && isRangeEnd) {
    bandStyle = styles.bandLeft
  }

  // Range band fill: uniform opacity fade-in. Every in-range cell fades in
  // at the same time. No stagger — any sequential reveal, no matter how
  // fast, reads as cascading noise rather than "the range is now selected".
  // Uniform = the range snaps into place as a single state transition,
  // which is what Apple Calendar / Notion / Google Calendar all do.
  const bandOpacity = useRef(
    new Animated.Value(disableAnimation ? 1 : 0),
  ).current
  useEffect(() => {
    if (!bandStyle) {
      bandOpacity.setValue(0)
      return
    }
    if (disableAnimation) {
      bandOpacity.setValue(1)
      return
    }
    bandOpacity.setValue(0)
    Animated.timing(bandOpacity, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandStyle, startDateNorm?.getTime(), endDateNorm?.getTime(), disableAnimation])

// Weekend color resolution: weekendColor wins over saturday/sunday colors.
  const weekendOverride = theme.weekendColor
  const satColor = weekendOverride ?? theme.saturdayColor
  const sunColor = weekendOverride ?? theme.sundayColor

  // Per-day color callback wins over the default chain. Returning `undefined`
  // means "fall through to the default resolution".
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

  // Per-day slot / text style overrides are composed ON TOP of user-provided
  // style props so they can selectively patch individual cells.
  const overrideSlotStyle = getDayStyle ? getDayStyle({ day, state, theme }) : undefined
  const overrideTextStyle = getDayTextStyle
    ? getDayTextStyle({ day, state, theme })
    : undefined

  // Custom per-day content replaces the default <Text>{day.day}</Text>. If the
  // callback returns `undefined` we fall back to the default number text.
  const customContent = getDayContent
    ? getDayContent({ day, state, theme })
    : undefined

  // Lane 4 — resolve per-day badges. `getBadge` may return a single badge,
  // an array, or undefined. Normalise to an array so the render path is
  // uniform and `renderBadge` consumers receive a stable shape.
  const rawBadges = getBadge ? getBadge({ day, state, theme }) : undefined
  const badges: DayBadge[] = !rawBadges
    ? []
    : Array.isArray(rawBadges)
      ? rawBadges
      : [rawBadges]

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => !isDisabled && onPress(day)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
      style={[styles.slot, style, overrideSlotStyle]}>
      {/* Lane 5 — keyboard focus ring (separate layer, no animation). */}
      {isFocused && (
        <View
          pointerEvents="none"
          style={[
            styles.focusRing,
            {
              borderColor: theme.primary,
              borderRadius: theme.dayBorderRadius,
            },
          ]}
        />
      )}
      {/* Layer 1: range band — uniform opacity fade-in for the whole range.
          Every in-range cell animates simultaneously. */}
      {bandStyle && (
        <Animated.View
          style={[
            bandStyle,
            {
              backgroundColor: theme.rangeBackground,
              opacity: bandOpacity,
            },
            rangeStyle,
          ]}
        />
      )}

      {/* Layer 2: selected circle — appears instantly when tapped. TouchableOpacity's
          activeOpacity already provides tactile feedback on the tap itself. */}
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

      {/* Layer 3: day number (top) — replaced wholesale by getDayContent when
          provided. Fallback path keeps the default <Text> so textColor / fontSize
          / textStyle / getDayTextStyle still apply. */}
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

      {/* Layer 4 (Lane 4): badge row — sits underneath the day number, in its
          OWN absolutely-positioned View so the range-band's bandOpacity is not
          touched. `renderBadge` (when provided) wins over the default UI. The
          default UI shows up to 3 dots, then "+N" for overflow. */}
      {badges.length > 0 && (
        <View pointerEvents="none" style={styles.badgeRow}>
          {renderBadge ? (
            renderBadge({ badges, day, theme })
          ) : (
            <DefaultBadgeRow badges={badges} theme={theme} />
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

/**
 * Lane 4 — default badge UI. Renders up to 3 colored dots in a horizontal row;
 * if there are more, the third slot is replaced by a "+N" text indicator so
 * the cell visually communicates "additional events exist" without overflowing
 * the slot width.
 */
const DefaultBadgeRow: React.FC<{ badges: DayBadge[]; theme: Theme }> = ({
  badges,
  theme,
}) => {
  const MAX_DOTS = 3
  const visible = badges.slice(0, MAX_DOTS)
  const overflow = badges.length - MAX_DOTS

  return (
    <View style={styles.badgeRowInner}>
      {visible.map((badge, idx) => {
        // When there are more than MAX_DOTS, swap the LAST visible dot for the
        // "+N" indicator so the row reads as: dot dot +N (instead of three
        // dots followed by an extra label that would overflow the slot).
        if (overflow > 0 && idx === MAX_DOTS - 1) {
          return (
            <Text
              key={`overflow-${idx}`}
              accessibilityLabel={`+${overflow + 1} more`}
              style={[
                styles.badgeOverflow,
                {
                  color: theme.textColor,
                  fontFamily: theme.fontFamily,
                },
              ]}>
              +{overflow + 1}
            </Text>
          )
        }
        return (
          <View
            key={badge.id ?? `badge-${idx}`}
            accessibilityLabel={badge.label}
            style={[styles.badgeDot, { backgroundColor: badge.color }]}
          />
        )
      })}
    </View>
  )
}

const BAND_HEIGHT = CIRCLE

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
  // Lane 5 — keyboard focus ring. Sits behind the selected circle/text so it
  // stays visible on unselected cells without occluding the day number.
  focusRing: {
    position: 'absolute',
    width: CIRCLE + 4,
    height: CIRCLE + 4,
    borderWidth: 2,
  },
  dayText: {
    fontWeight: '500',
  },
  // Lane 4 — badge row. Anchored to the bottom of the slot, centered, and
  // pointer-events disabled so taps still hit the underlying TouchableOpacity.
  badgeRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  badgeOverflow: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
})

export default memo(DayCell)
