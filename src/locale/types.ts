export interface Locale {
  /** ISO locale code used for Intl formatting (e.g. 'en', 'tr', 'de') */
  code: string
  /** Short day names: ['Mon', 'Tue', ...] */
  dayNamesShort: string[]
  /** Full month names: ['January', 'February', ...] */
  monthNames: string[]
  /** "Today" label */
  today: string
  /** Save/confirm button text */
  save: string
  /** Cancel button text */
  cancel: string
  /** Warning shown when user selects a past date */
  pastDateWarning: string
  /** Title for the past date warning alert */
  warningTitle: string
  /** OK button text in alerts */
  ok: string
  /** Title/placeholder for single date selection (e.g. "Select date") */
  selectDate?: string
  /** Title/placeholder for range selection (e.g. "Select date range") */
  selectRange?: string
  /** "From" label for range start (e.g. "From") */
  from?: string
  /** "To" label for range end (e.g. "To") */
  to?: string
  /** Clear/reset button text (e.g. "Clear") */
  clear?: string
  /** Lane 2 — TimePicker hour column header (e.g. "Hour" / "Saat") */
  hour?: string
  /** Lane 2 — TimePicker minute column header (e.g. "Minute" / "Dakika") */
  minute?: string
  /** Lane 2 — AM marker for 12-hour TimePicker mode */
  am?: string
  /** Lane 2 — PM marker for 12-hour TimePicker mode */
  pm?: string
  /** Lane 2 — WeekGrid prefix / label (e.g. "Week" / "Hafta") */
  week?: string
  /** Lane 3 — preset chip label: "Today" / "Bugün" */
  preset_today?: string
  /** Lane 3 — preset chip label: "Last 7 days" / "Son 7 gün" */
  preset_last_7_days?: string
  /** Lane 3 — preset chip label: "This month" / "Bu ay" */
  preset_this_month?: string
  /** Lane 3 — preset chip label: "Last month" / "Geçen ay" */
  preset_last_month?: string
  /** Lane 3 — fallback prefix for non-built-in custom presets (e.g. "Custom") */
  preset_custom?: string
  /** Lane 5 — a11y prefix when announcing a holiday on a day cell (e.g. "holiday:") */
  a11y_holiday_prefix?: string
  /** Lane 5 — a11y suffix appended to a selected day's label (e.g. "selected") */
  a11y_selected?: string
  /** Lane 5 — a11y suffix appended to today's day label (e.g. "today") */
  a11y_today?: string
  /** Lane 5 — a11y suffix appended to a disabled / blocked day label */
  a11y_disabled?: string
  /** Lane 5 — a11y hint announced for a tappable MonthHeader */
  a11y_change_month?: string
  /** Lane 5 — a11y label announced when the picker modal opens */
  a11y_modal_announce?: string
}
