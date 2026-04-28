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
  selectDate: 'Tarih seçin',
  selectRange: 'Tarih aralığı seçin',
  from: 'Başlangıç',
  to: 'Bitiş',
  clear: 'Temizle',
  hour: 'Saat',
  minute: 'Dakika',
  am: 'ÖÖ',
  pm: 'ÖS',
  week: 'Hafta',
  preset_today: 'Bugün',
  preset_last_7_days: 'Son 7 gün',
  preset_this_month: 'Bu ay',
  preset_last_month: 'Geçen ay',
  preset_custom: 'Özel',
  a11y_holiday_prefix: 'tatil:',
  a11y_selected: 'seçili',
  a11y_today: 'bugün',
  a11y_disabled: 'kullanılamaz',
  a11y_change_month: 'Ay veya yıl değiştirmek için dokun',
  a11y_modal_announce: 'Tarih seçici açıldı. Bir tarih seçin.',
}
