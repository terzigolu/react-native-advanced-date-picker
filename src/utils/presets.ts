// ============================================================================
// Lane 3 — date range presets
// ============================================================================
//
// Lightweight, dependency-free preset definitions. Each preset describes a
// stable identifier (used for locale lookups + `activePresetId` highlighting),
// a fallback English label, and a `range()` thunk that materialises the
// actual `{ start, end }` window at the moment the user taps the chip.
//
// The thunks are evaluated lazily so consumers can keep the preset list as
// a stable, frozen module-level constant — no `useMemo` plumbing required at
// the call site.

import type { Locale } from '../locale/types'

/** A single quick-pick range — chip on the `<PresetBar>`. */
export interface DateRangePreset {
  /**
   * Stable identifier for theming, locale lookup, and activeness comparison.
   * Built-in IDs use kebab-case (e.g. `'last-7-days'`); custom presets may
   * use any string they like.
   */
  id: string
  /** English fallback label — used when locale has no `preset_<id>` entry. */
  label: string
  /** Returns the inclusive `{ start, end }` window at call-time. */
  range: () => { start: Date; end: Date }
}

const startOfDay = (d: Date): Date => {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

/**
 * The four built-in presets. Re-export shape is stable; consumers can spread
 * this array into a custom one or replace it entirely via the `presets`
 * prop on `<AdvancedDatePicker>`.
 */
export const builtInPresets: DateRangePreset[] = [
  {
    id: 'today',
    label: 'Today',
    range: () => {
      const today = startOfDay(new Date())
      return { start: today, end: today }
    },
  },
  {
    id: 'last-7-days',
    label: 'Last 7 days',
    range: () => {
      const end = startOfDay(new Date())
      const start = startOfDay(new Date())
      start.setDate(end.getDate() - 6)
      return { start, end }
    },
  },
  {
    id: 'this-month',
    label: 'This month',
    range: () => {
      const now = new Date()
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
      const end = startOfDay(now)
      return { start, end }
    },
  },
  {
    id: 'last-month',
    label: 'Last month',
    range: () => {
      const now = new Date()
      const start = startOfDay(
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
      )
      // Day 0 of the current month === last day of the previous month.
      const end = startOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
      return { start, end }
    },
  },
]

// Map preset IDs to their locale field on the `Locale` type. Built-in IDs
// have a 1:1 mapping; unknown IDs fall through to the preset's literal label.
const localeKeyById: Record<string, keyof Locale> = {
  today: 'preset_today',
  'last-7-days': 'preset_last_7_days',
  'this-month': 'preset_this_month',
  'last-month': 'preset_last_month',
}

/**
 * Resolve the user-facing label for a preset.
 *
 * Resolution order:
 *  1. `locale.preset_<id>` if defined (built-in IDs only)
 *  2. `preset.label` (English fallback baked into the preset itself)
 */
export const getPresetLabel = (
  preset: DateRangePreset,
  locale?: Locale,
): string => {
  if (locale) {
    const key = localeKeyById[preset.id]
    if (key) {
      const value = locale[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
  }
  return preset.label
}
