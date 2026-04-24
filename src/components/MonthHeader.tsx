import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { Theme } from '../theme/types'

type Props = {
  monthName: string
  year: number
  theme: Theme
}

const MonthHeader: React.FC<Props> = ({ monthName, year, theme }) => {
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.text,
          {
            color: theme.monthHeaderColor,
            fontFamily: theme.fontFamily,
          },
        ]}>
        {monthName} {year}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
})

export default memo(MonthHeader)
