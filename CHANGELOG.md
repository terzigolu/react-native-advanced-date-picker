# Changelog

All notable changes to `react-native-advanced-date-picker` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-04-29

This is a large additive release. **Zero breaking changes** — every v0.2.x prop, callback shape, and import keeps working as-is. New surfaces are opt-in.

### Added — selection
- **Multi-select mode** (`mode="multi"`) — toggle any number of independent dates. New `selectedDates?: Date[]` prop and `selection.kind === 'multi'` branch (Set-backed).
- **Disabled date ranges** (`disabledRanges?: { start, end }[]`) and **range-length constraints** (`minRangeLength`, `maxRangeLength`) — booking-calendar primitives.
- **`Selection` discriminated union** is now public — `{ kind: 'single', date } | { kind: 'range', start, end } | { kind: 'multi', dates: Set<string> } | { kind: 'time', date, hour, minute }`.
- **`onChange?: (selection: Selection) => void`** — new emit channel that gives you the full union. The legacy `onDateChange({ startDate, endDate })` continues to fire in parallel for `single`/`range` so existing handlers keep working.

### Added — views
- **`WeekGrid`**, **`MonthGrid`**, **`YearGrid`**, **`TimePicker`**, **`DateTimePicker`** components for non-day pickers (ISO weeks, 12-cell month grid, decade view, hour/minute scroll, date+time composition).
- **`view`** prop routes `<AdvancedDatePicker>` between these views (`'day' | 'week' | 'month' | 'year' | 'time'`).

### Added — UX layers
- **Preset chips** — `presets={true}` enables built-ins (`Today / Last 7 days / This month / Last month`); pass an array to use custom presets. New exports: `PresetBar`, `builtInPresets`, `getPresetLabel`, `DateRangePreset`.
- **Quick year/month navigation** — tap the month header to drill into a 12-cell month grid; opt in via `quickNav={true}`.
- **Per-date event badges** — `getBadge` callback returns one or many `{ color, label?, id? }` dots; the default UI renders up to 3 with `+N` overflow. `renderBadge` slot for full custom layouts.

### Added — engines
- **`CalendarEngine` interface** + pluggable engines: `gregorian` (default), `hijri` (Umm al-Qura via `Intl.DateTimeFormat({ calendar: 'islamic-umalqura' })` + tabular Kuwaiti fallback), `persian` (Borkowski algorithm with `~~` truncation, no third-party libs), `buddhist` (Gregorian + 543 offset).
- **New built-in locales:** `ar` (Arabic), `fa` (Persian), `th` (Thai). String locale codes (`"ar" | "fa" | "th"`) now resolve to the right locale on `<AdvancedDatePicker>`.
- The legacy `generateCalendarData`, `generateMonthData`, `getMonthName`, `getDayName`, `getShortDayNames`, `addMonths` remain re-exported via the Gregorian engine — same behaviour, same imports.

### Added — headless API
- **`useDatePicker(options)`** hook exposes the full state machine: `selection`, `calendarData`, `dayProps(date)`, `handlers.{ selectDate, clear, setSelection }`, plus per-date predicates (`isSelected`, `isInRange`, `isDisabled`).
- The component is now a thin shell over the hook — UI and state are cleanly decoupled. Build a custom date picker UI without forking.

### Added — accessibility & keyboard
- `<DayCell>` ships `accessibilityRole="button"`, dynamic `accessibilityLabel` (locale-aware: weekday + full date + holiday + selected + today + unavailable), and `accessibilityState={{ selected, disabled }}`.
- `<DatePickerModal>` announces on open via `AccessibilityInfo.announceForAccessibility` and tags the container with `accessibilityViewIsModal`.
- New `useKeyboardNav()` hook with focus state machine: `Arrow*`, `PageUp`/`PageDown` (month), `Home`/`End` (month boundaries), `Enter`/`Space` (select), `Escape` (caller-defined).
- New a11y locale strings: `a11y_holiday_prefix`, `a11y_selected`, `a11y_today`, `a11y_disabled`, `a11y_change_month`, `a11y_modal_announce`.

### Added — utilities
- **`countWorkdays(start, end, { holidays, weekendDays })`** — DST-aware workday counter.
- **`isDateBlocked`**, **`getRangeLength`**, **`clampRange`** — booking helpers.
- **`getISOWeek`**, **`getWeekRange`**, **`getDecade`** — for week / year views.
- **`formatDateKey(date)`** — ISO `YYYY-MM-DD` key used by multi-select and a11y composition.
- **`isWeb` / `isNative`** platform guards.

### Added — web support
- `react-native-web` declared as an **optional** peer dependency (`peerDependenciesMeta.optional`).
- `DatePickerModal.web.tsx` (fixed-position overlay, ESC handler, focus management, `<div role="dialog" aria-modal>`) and `DayCell.web.tsx` (CSS transition for the range fill, hover state) shadow files. Native bundles are unaffected.

### Added — example app & docs
- `example/` — standalone Expo SDK 55 app with screens for every feature (single, range, multi-select, booking, presets, badges, headless hook, locales).
- `.storybook/` — Storybook (React + Vite) scaffold with stories for `DayCell`, `MonthHeader`, `WeekDayHeader`, `AdvancedDatePicker`.

### Changed
- `package.json` `version` is now `0.3.0`.
- Internal state in `<AdvancedDatePicker>` migrated to a single `Selection` union driven by a reducer; legacy scalar props (`startDate`, `endDate`, `mode`, `onDateChange`) are bridged through a `propsToSelection` adapter and a parallel echo emit. Externally identical.

### Deprecated
- The legacy `mode`, `startDate`, `endDate`, and `onDateChange` props remain fully supported in v0.3.x but are slated for removal in v1.0.0 in favour of `selection` / `view` / `enableTime` + `value` / `onChange`.

### Notes
- 213 tests, all green. TypeScript strict, `react-native-builder-bob` cjs + esm + typescript targets all clean.
- 8 work streams merged: foundation refactor (selection union + engine interface + `useDatePicker`), multi-select + booking constraints, non-day pickers, presets + quick-nav, badges + workdays, a11y + keyboard, web shadow files, non-Gregorian engines, plus an Expo example app and a Storybook scaffold.

## [0.2.3] — 2026-04-24

### Changed
- **Range-fill animation is now uniform instead of staggered.** All in-range cells fade in at the same time (160 ms, cubic ease-out). Matches what Apple Calendar, Notion, and Google Calendar do — sequential reveal reads as cascading noise, uniform reads as "the range is now selected", regardless of length.
- **Endpoint selected circle no longer springs.** It appears instantly; `TouchableOpacity`'s `activeOpacity` already provides tap feedback. One less animation competing for attention.

### Notes
- Simpler code path — no per-cell stagger delay math, no spring config. Animation surface is a single `Animated.timing` on opacity.

## [0.2.2] — 2026-04-24

### Changed
- **Range-fill animation is now ~3× snappier.** Reworked based on user feedback ("feels like 10 fps"): the per-cell stagger dropped from 70 ms to 18 ms, fade duration 120 → 110 ms, and the total cap from 920 ms to ~390 ms for long ranges. Short ranges (≤ 10 days) now settle in under 280 ms.
- **Band animation switched from `scaleX + translateX` origin-left trick to plain `opacity` fade-in.** Kills the visible "stretch" artefact and reduces native-driver work. Easing is `Easing.out(Easing.cubic)`.
- **Endpoint selected circle now has a spring "pop"** (damping 14, stiffness 240, mass 0.8, native driver) so the tap feels tactile and immediate, independent of range length.

### Notes
- No public API changes. `disableAnimation` still disables both the band fade and the circle pop.

## [0.2.1] — 2026-04-24

### Added
- Demo GIF in README (hosted in the GitHub repo, embedded via raw URL so it renders on both GitHub and npm).

## [0.2.0] — 2026-04-24

### Added
- **Smooth range-fill animation** — selecting a range now fills cells left-to-right from the start date with a staggered scale animation (native driver). `disableAnimation` prop turns it off.
- **Safe-area aware modal** — modal respects notch/status bar via `react-native-safe-area-context` when installed; platform-default fallback otherwise (no crash if the app lacks `SafeAreaProvider`).
- **Style escape hatches** on every public component: `style`, `modalContainerStyle`, `headerStyle`, `saveButtonStyle`, `saveButtonTextStyle`, `closeButtonStyle`, `closeButtonTextStyle`, plus per-component style props on `DayCell` / `MonthHeader` / `WeekDayHeader` / `CalendarList`.
- **Slot render props** — `renderMonthHeader`, `renderWeekDayHeader`, `renderHolidayLabel`, `renderSaveButton`, `renderCloseIcon` for full control over individual layout pieces without replacing the whole picker.
- **Per-day callbacks** — `getDayColor`, `getDayStyle`, `getDayTextStyle`, `getDayContent` let consumers tweak individual cells based on runtime state (isSelected, isHoliday, isSunday, isSaturday, isToday, etc).
- **Theme extensions** — `saturdayColor`, `weekendColor` (wins over sun/sat colors), `fontSize.{day,weekDay,monthHeader,holiday,saveButton}`, `spacing.{monthGap,weekDayHeaderGap,holidayGap}`, `radius.{saveButton,modal}`.
- **Locale extensions** — `selectDate`, `selectRange`, `from`, `to`, `clear` optional strings.
- **Holiday extensions** — `color`, `icon`, `important` optional fields per holiday.
- **`DateItem.isSaturday`** field in the calendar data model.

### Changed
- `DayCell` internal layout reworked so range bands no longer clip neighbouring cells' numbers — bands fill one slot at a time and connect seamlessly at cell edges.
- Range endpoint cells now render a half-band (right-half at start, left-half at end) that visually joins the interior range fill.

### Fixed
- Dates inside a modal no longer require a second tap to appear selected — the picker now keeps internal state synced without relying on a parent round-trip that was getting dropped by `<Modal>`'s native-side re-render.
- Modal no longer crashes when the host app lacks `<SafeAreaProvider>`; falls back to platform insets.

## [0.1.0] — 2026-04-24

### Added
- Initial release with single & range selection, EN/TR locales, theming, holidays, modal + inline modes.
