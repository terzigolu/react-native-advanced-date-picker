import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  CalendarList,
  defaultTheme,
  en,
} from 'react-native-advanced-date-picker'

const InlineCalendarScreen: React.FC = () => {
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.label}>Composing CalendarList directly</Text>
        <Text style={styles.value}>
          {start && end
            ? `${start.toDateString()}  →  ${end.toDateString()}`
            : 'Pick two dates to form a range'}
        </Text>
      </View>

      <CalendarList
        startDate={start}
        endDate={end}
        onStartDateChange={setStart}
        onEndDateChange={setEnd}
        mode="range"
        theme={defaultTheme}
        locale={en}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  summary: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#111827' },
})

export default InlineCalendarScreen
