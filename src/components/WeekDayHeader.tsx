import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'

type Props = {
  locale: Locale
  theme: Theme
  style?: StyleProp<ViewStyle>
  dayItemStyle?: StyleProp<ViewStyle>
  dayTextStyle?: StyleProp<TextStyle>
}

const WeekDayHeader: React.FC<Props> = ({
  locale,
  theme,
  style,
  dayItemStyle,
  dayTextStyle,
}) => {
  const fontSize = theme.fontSize?.weekDay ?? 12
  return (
    <View style={[styles.container, style]}>
      {locale.dayNamesShort.map((day, index) => {
        // dayNamesShort is generated Monday-first (see getShortDayNames),
        // so index 5 = Saturday, index 6 = Sunday.
        const isSaturday = index === 5
        const isSunday = index === 6
        const weekendOverride = theme.weekendColor
        const color = isSunday
          ? weekendOverride ?? theme.sundayColor
          : isSaturday
            ? weekendOverride ?? theme.saturdayColor ?? theme.weekDayHeaderColor
            : theme.weekDayHeaderColor
        return (
          <View style={[styles.dayItem, dayItemStyle]} key={index}>
            <Text
              style={[
                styles.text,
                {
                  color,
                  fontFamily: theme.fontFamily,
                  fontSize,
                },
                dayTextStyle,
              ]}>
              {day}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
})

export default memo(WeekDayHeader)
