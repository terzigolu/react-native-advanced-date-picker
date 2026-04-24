// Main component (prop-driven API)
export { default as AdvancedDatePicker } from './AdvancedDatePicker'
export { default } from './AdvancedDatePicker'

// Composable sub-components
export { default as CalendarList } from './components/CalendarList'
export { default as DayCell } from './components/DayCell'
export { default as DatePickerModal } from './components/DatePickerModal'
export { default as WeekDayHeader } from './components/WeekDayHeader'
export { default as MonthHeader } from './components/MonthHeader'

// Hook
export { default as useCalendar } from './hooks/useCalendar'

// Built-in locales
export { en } from './locale/en'
export { tr } from './locale/tr'

// Theme
export { defaultTheme } from './theme/defaultTheme'

// Types
export type { Locale } from './locale/types'
export type { Theme } from './theme/types'
export type {
  DatePickerMode,
  DateRange,
  Holiday,
  DateItem,
  MonthData,
  OnDateChangePayload,
} from './utils/types'
export type { DayCellState } from './components/DayCell'

// Utilities
export {
  toDate,
  isSameDate,
  isDateInRange,
  isDateBefore,
  getShortDayNames,
  getMonthName,
  getDayName,
  generateCalendarData,
} from './utils/dateUtils'
