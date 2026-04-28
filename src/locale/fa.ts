import type { Locale } from './types'

const code = 'fa'

const monthNames: string[] = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const dayNamesShort: string[] = [
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
  'یکشنبه',
]

export const fa: Locale = {
  code,
  dayNamesShort,
  monthNames,
  today: 'امروز',
  save: 'ذخیره',
  cancel: 'لغو',
  pastDateWarning: 'شما نمی‌توانید تاریخ گذشته را انتخاب کنید.',
  warningTitle: 'هشدار',
  ok: 'تایید',
  selectDate: 'انتخاب تاریخ',
  selectRange: 'انتخاب بازه‌ی زمانی',
  from: 'از',
  to: 'تا',
  clear: 'پاک کردن',
}

export default fa
