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
}
