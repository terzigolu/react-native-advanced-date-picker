import React, { memo, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'
import { getISOWeek, getWeekRange } from '../utils/dateUtils'

export type WeekGridProps = {
  /** Year whose ISO weeks should be displayed. Defaults to current year. */
  year?: number
  /** Optional theme overrides. */
  theme?: Partial<Theme>
  /** Optional locale (uses `monthNames` for the date sub-label). */
  locale?: Locale
  /** Currently selected week — Monday inside the desired week. */
  selectedDate?: Date | null
  /**
   * Lane 2 — fired when a week cell is tapped. Emits the inclusive
   * `{ start: Mon, end: Sun }` range so the consumer can drive their own
   * higher-level state (e.g. promote to range selection).
   */
  onSelectWeek?: (range: {
    start: Date
    end: Date
    year: number
    week: number
  }) => void
  /** Outer wrapper style. */
  style?: StyleProp<ViewStyle>
  /** Per-cell style override. */
  cellStyle?: StyleProp<ViewStyle>
  /** Per-cell text style override (week label). */
  cellTextStyle?: StyleProp<TextStyle>
}

/**
 * Lane 2 — `WeekGrid` renders a year's ISO 8601 weeks (52 or 53) in a 4-column
 * grid. Each cell shows the week number ("W23") on top and the inclusive
 * Mon-Sun range below ("Jun 5-11"). Tap emits `{ start, end, year, week }`.
 *
 * Zero-dep, FlatList-free; the entire grid is small enough to fit in a single
 * ScrollView so we can keep wrapping behaviour simple and predictable.
 */
const WeekGrid: React.FC<WeekGridProps> = ({
  year,
  theme: themeOverrides,
  locale = en,
  selectedDate,
  onSelectWeek,
  style,
  cellStyle,
  cellTextStyle,
}) => {
  const theme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const targetYear = year ?? new Date().getFullYear()

  // Determine whether the year has 52 or 53 ISO weeks. The probe sits on
  // Dec 28th of `targetYear` because that date is *always* in the last ISO
  // week of `targetYear` regardless of the year-end boundary case.
  const totalWeeks = useMemo(() => {
    const probe = new Date(targetYear, 11, 28)
    return getISOWeek(probe).week
  }, [targetYear])

  const selectedWeekKey = useMemo(() => {
    if (!selectedDate) return null
    const { year: y, week } = getISOWeek(selectedDate)
    return `${y}-${week}`
  }, [selectedDate])

  const handlePress = useCallback(
    (week: number) => {
      const range = getWeekRange(targetYear, week)
      onSelectWeek?.({
        start: range.start,
        end: range.end,
        year: targetYear,
        week,
      })
    },
    [targetYear, onSelectWeek],
  )

  const formatRange = useCallback(
    (start: Date, end: Date) => {
      const startMonth = locale.monthNames?.[start.getMonth()]?.slice(0, 3) ?? ''
      const endMonth = locale.monthNames?.[end.getMonth()]?.slice(0, 3) ?? ''
      if (start.getMonth() === end.getMonth()) {
        return `${startMonth} ${start.getDate()}-${end.getDate()}`
      }
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`
    },
    [locale],
  )

  const cells = useMemo(() => {
    const out: { week: number; start: Date; end: Date }[] = []
    for (let w = 1; w <= totalWeeks; w++) {
      const range = getWeekRange(targetYear, w)
      out.push({ week: w, start: range.start, end: range.end })
    }
    return out
  }, [totalWeeks, targetYear])

  const weekLabel = locale.week ?? 'W'

  return (
    <ScrollView
      style={[{ backgroundColor: theme.background }, style]}
      contentContainerStyle={styles.scrollContent}>
      <View style={styles.grid}>
        {cells.map(({ week, start, end }) => {
          const key = `${targetYear}-${week}`
          const isSelected = selectedWeekKey === key
          return (
            <TouchableOpacity
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${weekLabel} ${week}`}
              onPress={() => handlePress(week)}
              style={[
                styles.cell,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.background,
                  borderColor: theme.dividerColor,
                  borderRadius: theme.radius?.saveButton ?? 12,
                },
                cellStyle,
              ]}>
              <Text
                style={[
                  styles.weekText,
                  {
                    color: isSelected ? theme.selectedTextColor : theme.textColor,
                    fontFamily: theme.fontFamily,
                  },
                  cellTextStyle,
                ]}>
                {weekLabel === 'W' ? `W${week}` : `${weekLabel} ${week}`}
              </Text>
              <Text
                style={[
                  styles.rangeText,
                  {
                    color: isSelected
                      ? theme.selectedTextColor
                      : theme.disabledColor,
                    fontFamily: theme.fontFamily,
                  },
                ]}>
                {formatRange(start, end)}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '23.5%',
    aspectRatio: 1,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
})

export default memo(WeekGrid)
