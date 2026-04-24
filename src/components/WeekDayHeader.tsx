import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'

type Props = {
  locale: Locale
  theme: Theme
}

const WeekDayHeader: React.FC<Props> = ({ locale, theme }) => {
  return (
    <View style={styles.container}>
      {locale.dayNamesShort.map((day, index) => {
        const isSunday = index === 6
        return (
          <View style={styles.dayItem} key={index}>
            <Text
              style={[
                styles.text,
                {
                  color: isSunday ? theme.sundayColor : theme.weekDayHeaderColor,
                  fontFamily: theme.fontFamily,
                },
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
  text: {
    fontSize: 12,
  },
})

export default memo(WeekDayHeader)
