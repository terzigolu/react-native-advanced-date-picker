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
  /**
   * Lane 1 — true when the date falls inside one of the consumer-declared
   * `disabledRanges` (e.g. reservation calendar booked nights). Optional for
   * backward compatibility: callers that don't pass `disabledRanges` keep
   * receiving the original 7-flag shape.
   */
  isBlocked?: boolean
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

// ---------------------------------------------------------------------------
// Lane 4 — per-date badges (event marker dots)
// ---------------------------------------------------------------------------

/**
 * Lane 4 — a single badge dot rendered under the day number. Multiple badges
 * stack horizontally in a row; the default UI caps the visible count at 3 and
 * collapses the remainder into a "+N" overflow indicator.
 */
export interface DayBadge {
  /** Dot fill color. */
  color: string
  /** Optional human-readable label (a11y / future tooltip surface). */
  label?: string
  /** Optional stable id for React key reconciliation. */
  id?: string
}

/**
 * Lane 4 — per-day callback returning zero, one, or many `DayBadge`s. Returning
 * `undefined` (or an empty array) means "no badges for this cell". Called for
 * every non-empty day cell, so keep the body cheap.
 */
export type GetDayBadge = (args: {
  day: DateItem
  state: DayCellState
  theme: Theme
}) => DayBadge | DayBadge[] | undefined

/**
 * Lane 4 — full slot override for the badge row. When provided, the default
 * dot+overflow UI is bypassed entirely and the consumer's return is rendered
 * verbatim under the day number. The `badges` array is the normalized result
 * of `getBadge` (always an array, never `undefined`).
 */
export type RenderDayBadge = (args: {
  badges: DayBadge[]
  day: DateItem
  theme: Theme
}) => ReactNode
