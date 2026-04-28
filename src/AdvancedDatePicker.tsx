import React, { memo, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type {
  CalendarView,
  DatePickerMode,
  Holiday,
  OnDateChangePayload,
  DateItem,
  Selection,
  SelectionMode,
} from './utils/types'
import type { DisabledRange } from './utils/dateUtils'
import type { Theme } from './theme/types'
import type { Locale } from './locale/types'
import type {
  DayCellState,
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
import { defaultTheme } from './theme/defaultTheme'
import { en } from './locale/en'
import { tr } from './locale/tr'
import { ar } from './locale/ar'
import { fa } from './locale/fa'
import { th } from './locale/th'
import CalendarList from './components/CalendarList'
import DatePickerModal from './components/DatePickerModal'
import WeekGrid from './components/WeekGrid'
import MonthGrid from './components/MonthGrid'
import YearGrid from './components/YearGrid'
import TimePicker from './components/TimePicker'
import DateTimePicker from './components/DateTimePicker'
import PresetBar from './components/PresetBar'
import useDatePicker from './hooks/useDatePicker'
import { builtInPresets, type DateRangePreset } from './utils/presets'

// Lane 7 — register all five built-in locales so consumers can pass
// `locale="ar" | "fa" | "th"` as a string and get the Lane-7 calendars
// without hand-importing the locale object.
const builtInLocales: Record<string, Locale> = { en, tr, ar, fa, th }

type Props = {
  /**
   * `'single' | 'range'` keep the v0.2.x semantics. `'multi'` (Lane 1) flips
   * the picker into toggle-many mode; pair with `selectedDates` for legacy
   * controlled usage or read the union via `onChange`.
   */
  mode?: DatePickerMode | SelectionMode
  locale?: string | Locale
  startDate?: Date | null
  endDate?: Date | null
  /** Lane 1 — controlled multi-select seed (only honoured when `mode='multi'`). */
  selectedDates?: Date[]
  onDateChange: (payload: OnDateChangePayload) => void
  /** v0.3.0 — orthogonal selection union emitter (parallel to onDateChange). */
  onChange?: (selection: Selection) => void
  minDate?: Date
  maxDate?: Date
  theme?: Partial<Theme>
  holidays?: Holiday[]
  showHolidays?: boolean
  disabledDates?: (string | Date)[]
  /**
   * Lane 1 — declarative reservation-style blocked windows. Inclusive on
   * both endpoints. Dates inside any range render as `isDisabled + isBlocked`
   * and tap is short-circuited.
   */
  disabledRanges?: DisabledRange[]
  /** Lane 1 — minimum inclusive range length (days) for `mode='range'`. */
  minRangeLength?: number
  /** Lane 1 — maximum inclusive range length (days) for `mode='range'`. */
  maxRangeLength?: number
  /**
   * Lane 1 — fired with `'min' | 'max'` when the picker had to clamp the
   * end-date to satisfy a range-length constraint. Use it to surface a
   * Toast / haptic / a11y announcement.
   */
  onRangeClamp?: (reason: 'min' | 'max') => void
  months?: number
  modal?: boolean
  visible?: boolean
  onClose?: () => void
  onSave?: () => void
  topInset?: number
  showSaveButton?: boolean
  /** Disable the range band fill animation. Default: false */
  disableAnimation?: boolean
  /**
   * Lane 2 — orthogonal view granularity. `'day'` (default) preserves the
   * v0.2.x calendar surface. `'week' | 'month' | 'year'` swap in their
   * respective grids; `'time'` shows a standalone wheel; pair `'day'` with
   * `enableTime` to render the composed `DateTimePicker`.
   */
  view?: CalendarView
  /** Lane 2 — toggles datetime mode when paired with `view='day'`. */
  enableTime?: boolean
  /** Lane 2 — TimePicker hour format pass-through. Default `'24'`. */
  hourFormat?: '12' | '24'
  /** Lane 2 — TimePicker minute step pass-through. Default `1`. */
  minuteStep?: number
  /** Lane 2 — anchor year for `WeekGrid` / `MonthGrid` / `YearGrid`. */
  viewYear?: number
  renderDay?: (day: DateItem, state: DayCellState) => React.ReactNode

  /** Root view style (inline mode, i.e. modal=false). */
  style?: StyleProp<ViewStyle>
  /** Container (slide-up sheet) style in modal mode. */
  modalContainerStyle?: StyleProp<ViewStyle>
  /** Modal header row (close-icon row) style. */
  headerStyle?: StyleProp<ViewStyle>
  /** Save button wrapper style. */
  saveButtonStyle?: StyleProp<ViewStyle>
  /** Save button text style. */
  saveButtonTextStyle?: StyleProp<TextStyle>
  /** Close (X) button wrapper style. */
  closeButtonStyle?: StyleProp<ViewStyle>
  /** Close (X) glyph text style. */
  closeButtonTextStyle?: StyleProp<TextStyle>

  /** Slot: override the month header row. */
  renderMonthHeader?: RenderMonthHeader
  /** Slot: override the week day header row. */
  renderWeekDayHeader?: RenderWeekDayHeader
  /** Slot: override each holiday label in the holiday list. */
  renderHolidayLabel?: RenderHolidayLabel
  /** Slot: override the save button (modal mode). */
  renderSaveButton?: RenderSaveButton
  /** Slot: override the close (X) icon (modal mode). */
  renderCloseIcon?: RenderCloseIcon

  /** Per-day text color override. Return `undefined` to fall through. */
  getDayColor?: GetDayColor
  /** Per-day slot style override (composed on top of other styles). */
  getDayStyle?: GetDayStyle
  /** Per-day text style override (composed on top of other styles). */
  getDayTextStyle?: GetDayTextStyle
  /** Per-day custom content — replaces the default day number. */
  getDayContent?: GetDayContent
  /**
   * Lane 4 — per-day badge callback. Returns zero, one, or many `DayBadge`s
   * for the given cell. Default UI shows up to 3 dots and a "+N" overflow
   * indicator. Lives in its own absolutely-positioned layer, so the range
   * fill animation is unaffected.
   */
  getBadge?: GetDayBadge
  /** Lane 4 — full slot override for the badge row. */
  renderBadge?: RenderDayBadge
  /**
   * Lane 3 — quick-pick preset chips above the calendar surface.
   *  - `undefined`: feature disabled (default).
   *  - `true`: render the four built-in presets (today, last-7-days,
   *    this-month, last-month).
   *  - `DateRangePreset[]`: render the supplied custom list verbatim.
   *
   * Tapping a preset:
   *  - In `mode='range'`: sets both startDate and endDate.
   *  - In `mode='single'`: sets startDate to the preset's `start`.
   *  - In `mode='multi'`: ignored (presets emit a range, not a set).
   */
  presets?: DateRangePreset[] | true
  /**
   * Lane 3 — when `true`, the per-month header becomes pressable. Tap
   * drills into a 12-cell `MonthGrid`; selecting a month closes the grid
   * and re-anchors the calendar list at that month.
   */
  quickNav?: boolean
}

const AdvancedDatePicker: React.FC<Props> = ({
  mode = 'single',
  locale = 'en',
  startDate: startDateProp = null,
  endDate: endDateProp = null,
  selectedDates,
  onDateChange,
  onChange,
  minDate,
  maxDate,
  theme: themeOverrides,
  holidays = [],
  showHolidays = true,
  disabledDates = [],
  disabledRanges,
  minRangeLength,
  maxRangeLength,
  onRangeClamp,
  months = 12,
  modal = true,
  visible = false,
  onClose,
  onSave,
  topInset = 0,
  showSaveButton = true,
  disableAnimation = false,
  view = 'day',
  enableTime = false,
  hourFormat,
  minuteStep,
  viewYear,
  renderDay,
  style,
  modalContainerStyle,
  headerStyle,
  saveButtonStyle,
  saveButtonTextStyle,
  closeButtonStyle,
  closeButtonTextStyle,
  renderMonthHeader,
  renderWeekDayHeader,
  renderHolidayLabel,
  renderSaveButton,
  renderCloseIcon,
  getDayColor,
  getDayStyle,
  getDayTextStyle,
  getDayContent,
  getBadge,
  renderBadge,
  presets,
  quickNav = false,
}) => {
  const resolvedTheme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const resolvedLocale = useMemo<Locale>(() => {
    if (typeof locale === 'string') {
      return builtInLocales[locale] || en
    }
    return locale
  }, [locale])

  // ---------------------------------------------------------------------------
  // Headless state — useDatePicker owns selection union + emits both legacy
  // and new-style change events. The component is a thin UI shell.
  // ---------------------------------------------------------------------------
  // Lane 1 — multi mode is signalled via `selectionMode`, not the legacy
  // `mode` prop (which only knows 'single' | 'range'). When the consumer
  // passes `mode='multi'` we forward both: legacy stays 'single' so
  // propsToSelection() doesn't see an unrecognised value.
  const isMulti = mode === 'multi'
  const legacyMode: DatePickerMode = isMulti
    ? 'single'
    : (mode as DatePickerMode)
  const selectionMode: SelectionMode | undefined = isMulti ? 'multi' : undefined

  const { selection, handlers, selectedDateKeys } = useDatePicker({
    selectionMode,
    view,
    enableTime,
    mode: legacyMode,
    startDate: startDateProp,
    endDate: endDateProp,
    selectedDates,
    minDate,
    maxDate,
    holidays,
    months,
    disabledDates,
    disabledRanges,
    minRangeLength,
    maxRangeLength,
    onRangeClamp,
    locale: resolvedLocale,
    onChange,
    onDateChange,
  })

  // Project the union back to scalar `start/end` for the existing CalendarList
  // surface (Lane 0 keeps its API identical; Lane 1+ may flip CalendarList to
  // consume the union directly).
  const internalStart =
    selection.kind === 'range' || selection.kind === 'single'
      ? selection.kind === 'range'
        ? selection.start
        : selection.date
      : null
  const internalEnd = selection.kind === 'range' ? selection.end : null

  // CalendarList still owns the date-press selection logic (mode-specific
  // start/end behavior). The handlers below project its scalar callbacks onto
  // the union via functional `setSelection` — the hook just transports and
  // emits both onChange (union) and onDateChange (legacy payload). Using
  // functional updaters here is critical: CalendarList calls
  // onStartDateChange + onEndDateChange in the same tick, so closure-captured
  // `selection` would otherwise be stale on the second call.
  const handleStartDateChange = useCallback(
    (date: Date | null) => {
      if (mode === 'range') {
        handlers.setSelection(prev => {
          const prevEnd = prev.kind === 'range' ? prev.end : null
          return {
            kind: 'range',
            start: date,
            end: date === null ? null : prevEnd,
          }
        })
        return
      }
      handlers.setSelection({ kind: 'single', date })
    },
    [mode, handlers],
  )

  const handleEndDateChange = useCallback(
    (date: Date | null) => {
      // In single mode the end is always null and irrelevant — CalendarList
      // calls `onEndDateChange(null)` after every start change in single mode
      // for backward compat; we ignore it so the start-change isn't clobbered.
      if (mode !== 'range') return
      handlers.setSelection(prev => {
        const prevStart = prev.kind === 'range' ? prev.start : null
        return { kind: 'range', start: prevStart, end: date }
      })
    },
    [mode, handlers],
  )

  // Lane 1 — multi mode: each tap toggles the date in the Set. The reducer
  // already implements toggle semantics for `kind:'multi'` so we just call
  // selectDate. Disabled / blocked checks are enforced inside the hook.
  const handleMultiToggle = useCallback(
    (date: Date) => {
      handlers.selectDate(date)
    },
    [handlers],
  )

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  // Lane 2 — view router. `view='day'` keeps the v0.2.x surface; the other
  // views render their respective grids and lift their tap into the union via
  // `handlers.setSelection` so the existing `onChange` / `onDateChange`
  // emitters keep firing through the hook.
  const handleSelectWeek = useCallback(
    (range: { start: Date; end: Date }) => {
      handlers.setSelection({
        kind: 'range',
        start: range.start,
        end: range.end,
      })
    },
    [handlers],
  )

  const handleSelectMonth = useCallback(
    (firstDay: Date) => {
      handlers.setSelection({ kind: 'single', date: firstDay })
    },
    [handlers],
  )

  const handleSelectYear = useCallback(
    (firstDay: Date) => {
      handlers.setSelection({ kind: 'single', date: firstDay })
    },
    [handlers],
  )

  const handleTimeOnly = useCallback(
    (next: { hour: number; minute: number }) => {
      handlers.setSelection(prev => ({
        kind: 'time',
        date: prev.kind === 'time' ? prev.date : null,
        hour: next.hour,
        minute: next.minute,
      }))
    },
    [handlers],
  )

  const handleDateTimeChange = useCallback(
    (next: { kind: 'time'; date: Date | null; hour: number; minute: number }) => {
      handlers.setSelection(next)
    },
    [handlers],
  )

  // ---------------------------------------------------------------------------
  // Lane 3 — preset chips + quickNav drill-in
  // ---------------------------------------------------------------------------
  const resolvedPresets = useMemo<DateRangePreset[] | null>(() => {
    if (!presets) return null
    if (presets === true) return builtInPresets
    return presets
  }, [presets])

  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const handlePresetPress = useCallback(
    (preset: DateRangePreset) => {
      const { start, end } = preset.range()
      setActivePresetId(preset.id)
      if (mode === 'range') {
        handlers.setSelection({ kind: 'range', start, end })
        return
      }
      // 'single' (and any other non-multi) — collapse to the start date.
      // Multi mode: presets emit a range, not a set, so we no-op for safety.
      if (mode === 'multi') return
      handlers.setSelection({ kind: 'single', date: start })
    },
    [mode, handlers],
  )

  // Clear the active-preset highlight if the user picks a date manually after
  // a preset tap — the highlight is only meaningful while the selection still
  // matches the preset.
  React.useEffect(() => {
    if (activePresetId === null) return
    setActivePresetId(null)
    // Only depend on selection — `setActivePresetId` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection])

  // quickNav drill-in: 'calendar' shows the standard CalendarList; 'month'
  // swaps in the 12-cell MonthGrid. Picking a month flips back to 'calendar'
  // and re-anchors the list at the chosen month via `startFrom`.
  const [drillState, setDrillState] = useState<'calendar' | 'month'>('calendar')
  const [drillAnchor, setDrillAnchor] = useState<Date | undefined>(undefined)

  const handleMonthHeaderPress = useCallback(
    (firstDay: Date) => {
      if (!quickNav) return
      setDrillAnchor(firstDay)
      setDrillState('month')
    },
    [quickNav],
  )

  const handleDrillSelectMonth = useCallback((firstDay: Date) => {
    setDrillAnchor(firstDay)
    setDrillState('calendar')
  }, [])

  let viewContent: React.ReactNode
  if (view === 'week') {
    viewContent = (
      <WeekGrid
        year={viewYear}
        theme={resolvedTheme}
        locale={resolvedLocale}
        selectedDate={internalStart}
        onSelectWeek={handleSelectWeek}
      />
    )
  } else if (view === 'month') {
    viewContent = (
      <MonthGrid
        year={viewYear}
        theme={resolvedTheme}
        locale={resolvedLocale}
        selectedDate={internalStart}
        onSelectMonth={handleSelectMonth}
      />
    )
  } else if (view === 'year') {
    viewContent = (
      <YearGrid
        year={viewYear}
        theme={resolvedTheme}
        selectedDate={internalStart}
        onSelectYear={handleSelectYear}
        minYear={minDate?.getFullYear()}
        maxYear={maxDate?.getFullYear()}
      />
    )
  } else if (view === 'time') {
    const initialTime =
      selection.kind === 'time'
        ? { hour: selection.hour, minute: selection.minute }
        : { hour: 0, minute: 0 }
    viewContent = (
      <TimePicker
        value={initialTime}
        onChange={handleTimeOnly}
        theme={resolvedTheme}
        locale={resolvedLocale}
        hourFormat={hourFormat}
        minuteStep={minuteStep}
      />
    )
  } else if (view === 'day' && enableTime) {
    const dtValue =
      selection.kind === 'time'
        ? {
            date: selection.date,
            hour: selection.hour,
            minute: selection.minute,
          }
        : {
            date: internalStart,
            hour: 0,
            minute: 0,
          }
    viewContent = (
      <DateTimePicker
        value={dtValue}
        onChange={handleDateTimeChange}
        theme={resolvedTheme}
        locale={resolvedLocale}
        minDate={minDate}
        maxDate={maxDate}
        holidays={holidays}
        showHolidays={showHolidays}
        disabledDates={disabledDates}
        disabledRanges={disabledRanges}
        months={months}
        hourFormat={hourFormat}
        minuteStep={minuteStep}
        renderDay={renderDay}
        renderMonthHeader={renderMonthHeader}
        renderWeekDayHeader={renderWeekDayHeader}
        renderHolidayLabel={renderHolidayLabel}
        getDayColor={getDayColor}
        getDayStyle={getDayStyle}
        getDayTextStyle={getDayTextStyle}
        getDayContent={getDayContent}
      />
    )
    // Note: Lane 4 badges are only wired into the main day-grid CalendarList
    // path below. DateTimePicker (view='day' + enableTime) is intentionally
    // out of scope for this lane; opt-in via the CalendarList variant.
  } else if (quickNav && drillState === 'month') {
    // Lane 3 — drill-in MonthGrid. `drillAnchor` carries the year of the
    // header that was tapped. Selecting a month closes the drill and
    // re-anchors the calendar list via `startFrom`.
    const drillYear = drillAnchor?.getFullYear() ?? new Date().getFullYear()
    viewContent = (
      <MonthGrid
        year={drillYear}
        theme={resolvedTheme}
        locale={resolvedLocale}
        selectedDate={drillAnchor ?? internalStart}
        onSelectMonth={handleDrillSelectMonth}
      />
    )
  } else {
    viewContent = (
      <CalendarList
        mode={mode}
        locale={resolvedLocale}
        theme={resolvedTheme}
        startDate={internalStart}
        endDate={internalEnd}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        minDate={minDate}
        maxDate={maxDate}
        holidays={holidays}
        months={months}
        disabledDates={disabledDates}
        disabledRanges={disabledRanges}
        minRangeLength={minRangeLength}
        maxRangeLength={maxRangeLength}
        selectedDateKeys={selectedDateKeys}
        onMultiToggle={handleMultiToggle}
        renderDay={renderDay}
        showHolidays={showHolidays}
        disableAnimation={disableAnimation}
        renderMonthHeader={renderMonthHeader}
        renderWeekDayHeader={renderWeekDayHeader}
        renderHolidayLabel={renderHolidayLabel}
        getDayColor={getDayColor}
        getDayStyle={getDayStyle}
        getDayTextStyle={getDayTextStyle}
        getDayContent={getDayContent}
        getBadge={getBadge}
        renderBadge={renderBadge}
        startFrom={drillAnchor}
        onPressMonthHeader={quickNav ? handleMonthHeaderPress : undefined}
      />
    )
  }

  // Lane 3 — when presets are enabled, render the chip row above the
  // calendar surface. `<PresetBar>` is its own row so the picker layout
  // stays predictable across modal / inline modes.
  const calendarContent = resolvedPresets ? (
    <View style={{ flex: 1 }}>
      <PresetBar
        presets={resolvedPresets}
        activePresetId={activePresetId}
        onPress={handlePresetPress}
        theme={resolvedTheme}
        locale={resolvedLocale}
      />
      <View style={{ flex: 1 }}>{viewContent}</View>
    </View>
  ) : (
    viewContent
  )

  if (!modal) {
    return <View style={[{ flex: 1 }, style]}>{calendarContent}</View>
  }

  return (
    <DatePickerModal
      visible={visible}
      onClose={handleClose}
      onSave={onSave}
      theme={resolvedTheme}
      locale={resolvedLocale}
      showSaveButton={showSaveButton}
      style={modalContainerStyle}
      headerStyle={headerStyle}
      saveButtonStyle={saveButtonStyle}
      saveButtonTextStyle={saveButtonTextStyle}
      closeButtonStyle={closeButtonStyle}
      closeButtonTextStyle={closeButtonTextStyle}
      renderSaveButton={renderSaveButton}
      renderCloseIcon={renderCloseIcon}>
      {calendarContent}
    </DatePickerModal>
  )
}

export default memo(AdvancedDatePicker)
