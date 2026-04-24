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
  /** Saturday text color. Fallback: textColor */
  saturdayColor?: string
  /** Weekend (Sat + Sun) text color. If set, overrides both saturdayColor and sundayColor */
  weekendColor?: string
  /** Granular font size overrides */
  fontSize?: {
    /** Day cell text size (default: 14) */
    day?: number
    /** Week day header text size (default: 12) */
    weekDay?: number
    /** Month header text size (default: 12) */
    monthHeader?: number
    /** Holiday label text size (default: 12) */
    holiday?: number
    /** Save button text size (default: 16) */
    saveButton?: number
  }
  /** Layout spacing overrides */
  spacing?: {
    /** Vertical gap between months (default: 24) */
    monthGap?: number
    /** Gap between week day header divider and first month (default: 16) */
    weekDayHeaderGap?: number
    /** Gap between month grid and holiday list (default: 8) */
    holidayGap?: number
  }
  /** Additional radius overrides (dayBorderRadius stays on root for back-compat) */
  radius?: {
    /** Save button border radius (default: 12) */
    saveButton?: number
    /** Modal container border radius (default: 0 — full screen) */
    modal?: number
  }
}
