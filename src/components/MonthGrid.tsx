import React, { memo, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'

export type MonthGridProps = {
  /** Year whose months should be displayed. Defaults to current year. */
  year?: number
  theme?: Partial<Theme>
  locale?: Locale
  /** Currently selected month — any date inside the desired month. */
  selectedDate?: Date | null
  /**
   * Lane 2 — fired when a month cell is tapped. Emits the first day of the
   * month (midnight) so consumers can lift it into their selection state.
   */
  onSelectMonth?: (firstDay: Date, month: number, year: number) => void
  style?: StyleProp<ViewStyle>
  cellStyle?: StyleProp<ViewStyle>
  cellTextStyle?: StyleProp<TextStyle>
}

/**
 * Lane 2 — `MonthGrid` is a 4×3 grid (12 cells) showing the months of a
 * single year. Tap emits `(firstDay, month, year)` — `firstDay` is the
 * Date object for the 1st-of-month at local midnight.
 */
const MonthGrid: React.FC<MonthGridProps> = ({
  year,
  theme: themeOverrides,
  locale = en,
  selectedDate,
  onSelectMonth,
  style,
  cellStyle,
  cellTextStyle,
}) => {
  const theme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const targetYear = year ?? new Date().getFullYear()

  const selectedKey = useMemo(() => {
    if (!selectedDate) return null
    return `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`
  }, [selectedDate])

  const handlePress = useCallback(
    (month: number) => {
      const firstDay = new Date(targetYear, month, 1)
      firstDay.setHours(0, 0, 0, 0)
      onSelectMonth?.(firstDay, month, targetYear)
    },
    [targetYear, onSelectMonth],
  )

  return (
    <View
      style={[
        styles.grid,
        { backgroundColor: theme.background },
        style,
      ]}>
      {locale.monthNames.map((monthName, idx) => {
        const isSelected = selectedKey === `${targetYear}-${idx}`
        return (
          <TouchableOpacity
            key={`${targetYear}-${idx}`}
            accessibilityRole="button"
            accessibilityLabel={monthName}
            onPress={() => handlePress(idx)}
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
                styles.text,
                {
                  color: isSelected
                    ? theme.selectedTextColor
                    : theme.textColor,
                  fontFamily: theme.fontFamily,
                },
                cellTextStyle,
              ]}>
              {monthName}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 12,
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
    fontSize: 15,
    fontWeight: '500',
  },
})

export default memo(MonthGrid)
