import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AdvancedDatePicker } from 'react-native-advanced-date-picker'

const SingleDateScreen: React.FC = () => {
  const [selected, setSelected] = useState<Date | null>(null)

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.summary}>
        <Text style={styles.label}>Selected date</Text>
        <Text style={styles.value}>
          {selected ? selected.toDateString() : 'No date selected yet'}
        </Text>
      </View>

      <AdvancedDatePicker
        mode="single"
        locale="en"
        inline
        startDate={selected}
        onDateChange={({ startDate }) => setSelected(startDate)}
        minDate={new Date(2020, 0, 1)}
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
  value: { fontSize: 18, fontWeight: '600', color: '#111827' },
})

export default SingleDateScreen
