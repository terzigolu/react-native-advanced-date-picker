import React, { memo, useCallback, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import { defaultTheme } from '../theme/defaultTheme'
import { getDecade } from '../utils/dateUtils'

export type YearGridProps = {
  /** Anchor year — `getDecade()` derives the 12-cell window. */
  year?: number
  theme?: Partial<Theme>
  /** Currently selected year (any date inside it). */
  selectedDate?: Date | null
  /**
   * Lane 2 — fired when a year cell is tapped. Emits the Jan-1st Date plus
   * the raw year integer so consumers can lift directly into their state.
   */
  onSelectYear?: (firstDay: Date, year: number) => void
  /** Optional bound — disables prev navigation past this year. */
  minYear?: number
  /** Optional bound — disables next navigation past this year. */
  maxYear?: number
  style?: StyleProp<ViewStyle>
  cellStyle?: StyleProp<ViewStyle>
  cellTextStyle?: StyleProp<TextStyle>
}

/**
 * Lane 2 — `YearGrid` shows a 12-cell decade-ish window (e.g. 2020-2031)
 * with prev/next navigation. Tap a year to emit it.
 */
const YearGrid: React.FC<YearGridProps> = ({
  year,
  theme: themeOverrides,
  selectedDate,
  onSelectYear,
  minYear,
  maxYear,
  style,
  cellStyle,
  cellTextStyle,
}) => {
  const theme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const initialAnchor = year ?? selectedDate?.getFullYear() ?? new Date().getFullYear()
  const [anchorYear, setAnchorYear] = useState(initialAnchor)

  const decade = useMemo(() => getDecade(anchorYear), [anchorYear])

  const years = useMemo(() => {
    const out: number[] = []
    for (let y = decade.start; y <= decade.end; y++) out.push(y)
    return out
  }, [decade])

  const selectedYear = selectedDate?.getFullYear() ?? null

  const goPrev = useCallback(() => {
    setAnchorYear(prev => prev - 12)
  }, [])

  const goNext = useCallback(() => {
    setAnchorYear(prev => prev + 12)
  }, [])

  const handlePress = useCallback(
    (y: number) => {
      const firstDay = new Date(y, 0, 1)
      firstDay.setHours(0, 0, 0, 0)
      onSelectYear?.(firstDay, y)
    },
    [onSelectYear],
  )

  const prevDisabled =
    typeof minYear === 'number' && decade.start <= minYear
  const nextDisabled =
    typeof maxYear === 'number' && decade.end >= maxYear

  return (
    <View
      style={[
        { backgroundColor: theme.background, padding: 12 },
        style,
      ]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={prevDisabled}
          accessibilityRole="button"
          accessibilityLabel="Previous decade"
          style={styles.navBtn}>
          <Text
            style={{
              color: prevDisabled ? theme.disabledColor : theme.primary,
              fontSize: 18,
              fontFamily: theme.fontFamily,
            }}>
            {'‹'}
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: theme.monthHeaderColor,
            fontSize: theme.fontSize?.monthHeader ?? 14,
            fontFamily: theme.fontFamily,
            fontWeight: '600',
          }}>
          {`${decade.start} – ${decade.end}`}
        </Text>
        <TouchableOpacity
          onPress={goNext}
          disabled={nextDisabled}
          accessibilityRole="button"
          accessibilityLabel="Next decade"
          style={styles.navBtn}>
          <Text
            style={{
              color: nextDisabled ? theme.disabledColor : theme.primary,
              fontSize: 18,
              fontFamily: theme.fontFamily,
            }}>
            {'›'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {years.map(y => {
          const isSelected = selectedYear === y
          const outOfBounds =
            (typeof minYear === 'number' && y < minYear) ||
            (typeof maxYear === 'number' && y > maxYear)
          return (
            <TouchableOpacity
              key={y}
              accessibilityRole="button"
              accessibilityLabel={String(y)}
              disabled={outOfBounds}
              onPress={() => handlePress(y)}
              style={[
                styles.cell,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.background,
                  borderColor: theme.dividerColor,
                  borderRadius: theme.radius?.saveButton ?? 12,
                  opacity: outOfBounds ? 0.4 : 1,
                },
                cellStyle,
              ]}>
              <Text
                style={[
                  styles.text,
                  {
                    color: isSelected
                      ? theme.selectedTextColor
                      : theme.textColor,
                    fontFamily: theme.fontFamily,
                  },
                  cellTextStyle,
                ]}>
                {y}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '31%',
    aspectRatio: 1.6,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
})

export default memo(YearGrid)
