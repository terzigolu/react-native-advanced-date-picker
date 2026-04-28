import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  AdvancedDatePicker,
  defaultTheme,
  type Theme,
} from 'react-native-advanced-date-picker'

type Preset = 'light' | 'dark' | 'branded'

const PRESETS: Record<Preset, Partial<Theme>> = {
  light: defaultTheme,
  dark: {
    primary: '#60A5FA',
    background: '#0F172A',
    textColor: '#E2E8F0',
    disabledColor: '#475569',
    rangeBackground: '#1E293B',
    holidayColor: '#34D399',
    sundayColor: '#F87171',
    selectedTextColor: '#0F172A',
    monthHeaderColor: '#60A5FA',
    weekDayHeaderColor: '#94A3B8',
    dividerColor: '#1E293B',
    dayBorderRadius: 99,
  },
  branded: {
    primary: '#FF5A5F',
    background: '#FFFFFF',
    textColor: '#1F2937',
    disabledColor: '#D1D5DB',
    rangeBackground: '#FFE4E6',
    holidayColor: '#F97316',
    sundayColor: '#EF4444',
    selectedTextColor: '#FFFFFF',
    monthHeaderColor: '#FF5A5F',
    weekDayHeaderColor: '#9CA3AF',
    dividerColor: '#F3F4F6',
    dayBorderRadius: 8,
  },
}

const ThemeShowcaseScreen: React.FC = () => {
  const [preset, setPreset] = useState<Preset>('light')
  const [date, setDate] = useState<Date | null>(null)

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        preset === 'dark' && styles.contentDark,
      ]}>
      <View style={styles.tabs}>
        {(['light', 'dark', 'branded'] as Preset[]).map(p => (
          <Pressable
            key={p}
            onPress={() => setPreset(p)}
            style={[
              styles.tab,
              preset === p && styles.tabActive,
              preset === 'dark' && styles.tabDark,
              preset === 'dark' && preset === p && styles.tabActiveDark,
            ]}>
            <Text
              style={[
                styles.tabText,
                preset === p && styles.tabTextActive,
                preset === 'dark' && styles.tabTextDark,
              ]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      <AdvancedDatePicker
        mode="single"
        locale="en"
        inline
        startDate={date}
        onDateChange={({ startDate }) => setDate(startDate)}
        theme={PRESETS[preset]}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  contentDark: { backgroundColor: '#0F172A' },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    backgroundColor: '#F3F4F6',
  },
  tabDark: { backgroundColor: '#1E293B' },
  tabActive: { backgroundColor: '#2563EB' },
  tabActiveDark: { backgroundColor: '#60A5FA' },
  tabText: { fontSize: 13, color: '#374151', textTransform: 'capitalize' },
  tabTextDark: { color: '#94A3B8' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
})

export default ThemeShowcaseScreen
