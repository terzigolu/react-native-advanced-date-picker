import type { Theme } from './types'

export const defaultTheme: Theme = {
  primary: '#2563EB',
  background: '#FFFFFF',
  textColor: '#1F2937',
  disabledColor: '#9CA3AF',
  rangeBackground: '#EBF0FA',
  holidayColor: '#16A34A',
  sundayColor: '#DC2626',
  selectedTextColor: '#FFFFFF',
  dayBorderRadius: 99,
  monthHeaderColor: '#2563EB',
  weekDayHeaderColor: '#9CA3AF',
  dividerColor: '#E5E7EB',
  fontSize: {
    day: 14,
    weekDay: 12,
    monthHeader: 12,
    holiday: 12,
    saveButton: 16,
  },
  spacing: {
    monthGap: 24,
    weekDayHeaderGap: 16,
    holidayGap: 8,
  },
  radius: {
    saveButton: 12,
    modal: 0,
  },
}
