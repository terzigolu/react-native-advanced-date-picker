import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'

type Props = {
  monthName: string
  year: number
  theme: Theme
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const MonthHeader: React.FC<Props> = ({
  monthName,
  year,
  theme,
  style,
  textStyle,
}) => {
  const fontSize = theme.fontSize?.monthHeader ?? 14
  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.text,
          {
            color: theme.monthHeaderColor,
            fontFamily: theme.fontFamily,
            fontSize,
          },
          textStyle,
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
    fontWeight: '600',
  },
})

export default memo(MonthHeader)
