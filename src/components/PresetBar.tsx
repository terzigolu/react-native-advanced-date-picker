import React, { memo, useCallback } from 'react'
import {
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  View,
} from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'
import {
  builtInPresets,
  getPresetLabel,
  type DateRangePreset,
} from '../utils/presets'

export type PresetBarProps = {
  /**
   * Preset list. Defaults to `builtInPresets` when omitted so the component
   * is useful as a drop-in even without configuration.
   */
  presets?: DateRangePreset[]
  /** Currently active preset id — chip is highlighted. */
  activePresetId?: string | null
  /** Tap handler — receives the preset (call `.range()` to get dates). */
  onPress: (preset: DateRangePreset) => void
  theme?: Partial<Theme>
  locale?: Locale
  style?: StyleProp<ViewStyle>
  chipStyle?: StyleProp<ViewStyle>
  chipTextStyle?: StyleProp<TextStyle>
}

/**
 * Lane 3 — horizontal scrollable row of preset chips. Standalone exportable
 * so consumers can drop it above any picker surface (or even above a search
 * UI, divorced from `<AdvancedDatePicker>`).
 */
const PresetBar: React.FC<PresetBarProps> = ({
  presets = builtInPresets,
  activePresetId,
  onPress,
  theme: themeOverrides,
  locale = en,
  style,
  chipStyle,
  chipTextStyle,
}) => {
  const theme = React.useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const handlePress = useCallback(
    (preset: DateRangePreset) => () => {
      onPress(preset)
    },
    [onPress],
  )

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: theme.background },
        style,
      ]}>
      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        {presets.map(preset => {
          const isActive = preset.id === activePresetId
          const bg = isActive ? theme.primary : theme.background
          const fg = isActive ? theme.selectedTextColor : theme.textColor
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityLabel={getPresetLabel(preset, locale)}
              accessibilityState={{ selected: isActive }}
              onPress={handlePress(preset)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: bg,
                  borderColor: isActive ? theme.primary : theme.dividerColor,
                  borderRadius: theme.radius?.saveButton ?? 12,
                },
                pressed && !isActive && styles.pressed,
                chipStyle,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: fg,
                    fontFamily: theme.fontFamily,
                  },
                  chipTextStyle,
                ]}>
                {getPresetLabel(preset, locale)}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  contentContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.6,
  },
})

export default memo(PresetBar)
