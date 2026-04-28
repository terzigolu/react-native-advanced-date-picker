import React, { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'

type Props = {
  monthName: string
  year: number
  theme: Theme
  /**
   * Lane 3 — quickNav drill-in. When supplied the entire header row becomes
   * a `<Pressable>`; otherwise the original passive `<View>` markup is used
   * to preserve byte-for-byte backward compatibility.
   */
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}

const MonthHeader: React.FC<Props> = ({
  monthName,
  year,
  theme,
  onPress,
  style,
  textStyle,
}) => {
  const fontSize = theme.fontSize?.monthHeader ?? 14
  const label = (
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
  )

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${monthName} ${year}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
          style,
        ]}>
        {label}
      </Pressable>
    )
  }

  return <View style={[styles.container, style]}>{label}</View>
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
  },
})

export default memo(MonthHeader)
