import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useDatePicker, en } from 'react-native-advanced-date-picker'

// A deliberately minimalist UI built from the headless hook —
// nothing reused from <DayCell />. Demonstrates that the calendar
// grid logic, day-state derivation, and selection reducer are
// completely decoupled from any rendering.
const HeadlessHookScreen: React.FC = () => {
  const picker = useDatePicker({
    selectionMode: 'single',
    locale: en,
  })

  const month = picker.calendarData[0]
  const sel = picker.selection

  const selectedLabel =
    sel.kind === 'single' && sel.date ? sel.date.toDateString() : '—'

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Custom UI via useDatePicker()</Text>
      <Text style={styles.subheading}>Selected: {selectedLabel}</Text>

      {month ? (
        <View style={styles.month}>
          <Text style={styles.monthLabel}>
            {month.monthName} {month.year}
          </Text>
          <View style={styles.grid}>
            {month.days.map((day, i) => {
              if (day.isEmpty || !day.fullDate) {
                return <View key={i} style={styles.cell} />
              }
              const props = picker.dayProps(day.fullDate)
              return (
                <Pressable
                  key={i}
                  onPress={props.onPress}
                  disabled={props.isDisabled}
                  style={[
                    styles.cell,
                    props.isSelected && styles.cellSelected,
                    props.isToday && !props.isSelected && styles.cellToday,
                    props.isDisabled && styles.cellDisabled,
                  ]}>
                  <Text
                    style={[
                      styles.cellText,
                      props.isSelected && styles.cellTextSelected,
                    ]}>
                    {day.day}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}
    </ScrollView>
  )
}

const CELL = `${(100 / 7).toFixed(4)}%`

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 32 },
  heading: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  month: { borderRadius: 12, backgroundColor: '#F9FAFB', padding: 8 },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 8,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellSelected: { backgroundColor: '#2563EB' },
  cellToday: { borderWidth: 1, borderColor: '#2563EB' },
  cellDisabled: { opacity: 0.3 },
  cellText: { fontSize: 14, color: '#1F2937' },
  cellTextSelected: { color: '#FFFFFF', fontWeight: '600' },
})

export default HeadlessHookScreen
