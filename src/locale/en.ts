import type { Locale } from './types'
import { getShortDayNames, getMonthName } from '../utils/dateUtils'

const code = 'en'

const monthNames: string[] = []
for (let i = 0; i < 12; i++) {
  monthNames.push(getMonthName(2024, i, code))
}

export const en: Locale = {
  code,
  dayNamesShort: getShortDayNames(code),
  monthNames,
  today: 'Today',
  save: 'Save',
  cancel: 'Cancel',
  pastDateWarning: 'You cannot select a past date.',
  warningTitle: 'Warning',
  ok: 'OK',
  selectDate: 'Select date',
  selectRange: 'Select date range',
  from: 'From',
  to: 'To',
  clear: 'Clear',
  hour: 'Hour',
  minute: 'Minute',
  am: 'AM',
  pm: 'PM',
  week: 'Week',
  preset_today: 'Today',
  preset_last_7_days: 'Last 7 days',
  preset_this_month: 'This month',
  preset_last_month: 'Last month',
  preset_custom: 'Custom',
  a11y_holiday_prefix: 'holiday:',
  a11y_selected: 'selected',
  a11y_today: 'today',
  a11y_disabled: 'unavailable',
  a11y_change_month: 'Tap to change the month or year',
  a11y_modal_announce: 'Date picker opened. Select a date.',
}
