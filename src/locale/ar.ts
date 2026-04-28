import type { Locale } from './types'

const code = 'ar'

const monthNames: string[] = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
]

const dayNamesShort: string[] = [
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
]

export const ar: Locale = {
  code,
  dayNamesShort,
  monthNames,
  today: 'اليوم',
  save: 'حفظ',
  cancel: 'إلغاء',
  pastDateWarning: 'لا يمكنك اختيار تاريخ في الماضي.',
  warningTitle: 'تنبيه',
  ok: 'حسنا',
  selectDate: 'اختر التاريخ',
  selectRange: 'اختر نطاق التاريخ',
  from: 'من',
  to: 'إلى',
  clear: 'مسح',
}

export default ar
