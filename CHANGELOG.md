# Changelog

All notable changes to `react-native-advanced-date-picker` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
