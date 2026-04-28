// ============================================================================
// react-native-advanced-date-picker — public API
// ============================================================================

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export { default as AdvancedDatePicker } from './AdvancedDatePicker'
export { default } from './AdvancedDatePicker'

// ---------------------------------------------------------------------------
// Composable sub-components
// ---------------------------------------------------------------------------
export { default as CalendarList } from './components/CalendarList'
export { default as DayCell } from './components/DayCell'
export { default as DatePickerModal } from './components/DatePickerModal'
export { default as WeekDayHeader } from './components/WeekDayHeader'
export { default as MonthHeader } from './components/MonthHeader'

// Lane 2 — view-granularity components
export { default as WeekGrid } from './components/WeekGrid'
export { default as MonthGrid } from './components/MonthGrid'
export { default as YearGrid } from './components/YearGrid'
export { default as TimePicker } from './components/TimePicker'
export { default as DateTimePicker } from './components/DateTimePicker'
export type { WeekGridProps } from './components/WeekGrid'
export type { MonthGridProps } from './components/MonthGrid'
export type { YearGridProps } from './components/YearGrid'
export type { TimePickerProps, TimePickerValue } from './components/TimePicker'
export type { DateTimePickerProps } from './components/DateTimePicker'

// Lane 3 — preset chip row + presets util
export { default as PresetBar } from './components/PresetBar'
export type { PresetBarProps } from './components/PresetBar'
export { builtInPresets, getPresetLabel } from './utils/presets'
export type { DateRangePreset } from './utils/presets'

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { default as useCalendar } from './hooks/useCalendar'
export { default as useDatePicker } from './hooks/useDatePicker'
export { default as useKeyboardNav } from './hooks/useKeyboardNav'
export type {
  UseKeyboardNavOptions,
  UseKeyboardNavReturn,
  KeyboardNavDirection,
} from './hooks/useKeyboardNav'

// ---------------------------------------------------------------------------
// Calendar engines (Gregorian default; Hijri / Persian / Buddhist added Lane 7)
// ---------------------------------------------------------------------------
export {
  gregorian,
  hijri,
  persian,
  buddhist,
  engines,
  defaultEngine,
} from './calendars'
export type { CalendarEngine } from './calendars/types'

// ---------------------------------------------------------------------------
// Built-in locales
// ---------------------------------------------------------------------------
export { en } from './locale/en'
export { tr } from './locale/tr'
export { ar } from './locale/ar'
export { fa } from './locale/fa'
export { th } from './locale/th'

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------
export { defaultTheme } from './theme/defaultTheme'

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export {
  toDate,
  isSameDate,
  isDateInRange,
  isDateBefore,
  formatDateKey,
  isDateBlocked,
  getRangeLength,
  clampRange,
  countWorkdays,
  getShortDayNames,
  getMonthName,
  getDayName,
  generateCalendarData,
  generateMonthData,
  addMonths,
  getISOWeek,
  getWeekRange,
  getDecade,
} from './utils/dateUtils'

export type { DisabledRange } from './utils/dateUtils'

// ---------------------------------------------------------------------------
// Types — locale & theme
// ---------------------------------------------------------------------------
export type { Locale } from './locale/types'
export type { Theme } from './theme/types'

// ---------------------------------------------------------------------------
// Types — domain models
// ---------------------------------------------------------------------------
export type {
  DatePickerMode,
  DateRange,
  Holiday,
  DateItem,
  MonthData,
  OnDateChangePayload,
  Selection,
  SelectionMode,
  CalendarView,
} from './utils/types'

// ---------------------------------------------------------------------------
// Types — useDatePicker
// ---------------------------------------------------------------------------
export type {
  UseDatePickerOptions,
  UseDatePickerReturn,
  DayProps,
} from './hooks/useDatePicker'

// ---------------------------------------------------------------------------
// Types — slot render props & per-day callbacks
// ---------------------------------------------------------------------------
export type {
  DayCellState,
  DayBadge,
  RenderMonthHeader,
  RenderWeekDayHeader,
  RenderHolidayLabel,
  RenderSaveButton,
  RenderCloseIcon,
  GetDayColor,
  GetDayStyle,
  GetDayTextStyle,
  GetDayContent,
  GetDayBadge,
  RenderDayBadge,
} from './components/types'
