import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AdvancedDatePicker, type Holiday } from 'react-native-advanced-date-picker'

const HOLIDAYS: Holiday[] = [
  { date: '01-01', label: 'New Year', color: '#16A34A' },
  { date: '04-23', label: 'National Sovereignty Day', color: '#DC2626', important: true },
  { date: '12-25', label: 'Christmas', color: '#16A34A' },
]

const RangeDateScreen: React.FC = () => {
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.label}>Selected range</Text>
        <Text style={styles.value}>
          {start ? start.toDateString() : '—'}
          {'  →  '}
          {end ? end.toDateString() : '—'}
        </Text>
      </View>

      <AdvancedDatePicker
        mode="range"
        locale="en"
        inline
        startDate={start}
        endDate={end}
        holidays={HOLIDAYS}
        onDateChange={({ startDate, endDate }) => {
          setStart(startDate)
          setEnd(endDate)
        }}
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

export default RangeDateScreen
