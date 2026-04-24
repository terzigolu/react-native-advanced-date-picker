export interface Theme {
  /** Primary color for selected dates (default: '#2563EB') */
  primary: string
  /** Background color of the calendar (default: '#FFFFFF') */
  background: string
  /** Default text color (default: '#1F2937') */
  textColor: string
  /** Disabled/past date text color (default: '#9CA3AF') */
  disabledColor: string
  /** Background color for dates in range (default: '#EBF0FA') */
  rangeBackground: string
  /** Holiday text color (default: '#16A34A') */
  holidayColor: string
  /** Sunday text color (default: '#DC2626') */
  sundayColor: string
  /** Selected date text color (default: '#FFFFFF') */
  selectedTextColor: string
  /** Day cell border radius (default: 99) */
  dayBorderRadius: number
  /** Month header text color (default: '#2563EB') */
  monthHeaderColor: string
  /** Week day header text color (default: '#9CA3AF') */
  weekDayHeaderColor: string
  /** Divider color (default: '#E5E7EB') */
  dividerColor: string
  /** Font family (default: undefined — system font) */
  fontFamily?: string
}
