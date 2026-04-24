import type { Locale } from './types'
import { getShortDayNames, getMonthName } from '../utils/dateUtils'

const code = 'tr'

const monthNames: string[] = []
for (let i = 0; i < 12; i++) {
  monthNames.push(getMonthName(2024, i, code))
}

export const tr: Locale = {
  code,
  dayNamesShort: getShortDayNames(code),
  monthNames,
  today: 'Bugün',
  save: 'Kaydet',
  cancel: 'İptal',
  pastDateWarning: 'Geçmiş bir tarih seçemezsiniz.',
  warningTitle: 'Uyarı',
  ok: 'Tamam',
}
