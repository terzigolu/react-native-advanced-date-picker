import type { Locale } from './types'

const code = 'th'

const monthNames: string[] = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const dayNamesShort: string[] = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.']

export const th: Locale = {
  code,
  dayNamesShort,
  monthNames,
  today: 'วันนี้',
  save: 'บันทึก',
  cancel: 'ยกเลิก',
  pastDateWarning: 'ไม่สามารถเลือกวันที่ผ่านมาแล้วได้',
  warningTitle: 'คำเตือน',
  ok: 'ตกลง',
  selectDate: 'เลือกวันที่',
  selectRange: 'เลือกช่วงวันที่',
  from: 'จาก',
  to: 'ถึง',
  clear: 'ล้าง',
}

export default th
