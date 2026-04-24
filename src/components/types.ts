import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import type { DateItem, Holiday } from '../utils/types'

/**
 * Runtime state for a single day cell. Passed to `renderDay` and to every
 * per-day callback so the caller can branch on the cell's current status
 * (selected / range / disabled / weekend / holiday / today).
 */
export type DayCellState = {
  isSelected: boolean
  isInRange: boolean
  isDisabled: boolean
  isToday: boolean
  isHoliday: boolean
  isSunday: boolean
  isSaturday: boolean
}

/**
 * Slot render props — override a specific subtree of the calendar without
 * rewriting the whole component. Each is optional; when provided it replaces
 * the default rendering for that slot.
 */
export type RenderMonthHeader = (args: {
  month: string
  year: number
  theme: Theme
  locale: Locale
}) => ReactNode

export type RenderWeekDayHeader = (args: {
  days: string[]
  theme: Theme
  locale: Locale
}) => ReactNode

export type RenderHolidayLabel = (args: {
  holiday: Holiday
  day: DateItem
  theme: Theme
}) => ReactNode

export type RenderSaveButton = (args: {
  onPress: () => void
  theme: Theme
  locale: Locale
}) => ReactNode

export type RenderCloseIcon = (args: {
  onPress: () => void
  theme: Theme
}) => ReactNode

/**
 * Per-day callbacks — called for every non-empty day cell so the caller can
 * compute styles / colors / custom content from runtime state.
 *
 * Priority (highest wins):
 *   renderDay  >  getDayContent  >  default <Text>{day.day}</Text>
 *
 * Colors/styles from the callbacks compose ON TOP of the default chain —
 * returning `undefined` means "use the default".
 */
export type GetDayColor = (args: {
  day: DateItem
  state: DayCellState
  theme: Theme
}) => string | undefined

export type GetDayStyle = (args: {
  day: DateItem
  state: DayCellState
  theme: Theme
}) => StyleProp<ViewStyle> | undefined

export type GetDayTextStyle = (args: {
  day: DateItem
  state: DayCellState
  theme: Theme
}) => StyleProp<TextStyle> | undefined

export type GetDayContent = (args: {
  day: DateItem
  state: DayCellState
  theme: Theme
}) => ReactNode | undefined
