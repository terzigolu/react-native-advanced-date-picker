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
}
