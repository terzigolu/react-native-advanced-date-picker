import {
  builtInPresets,
  getPresetLabel,
  type DateRangePreset,
} from '../utils/presets'
import { en } from '../locale/en'
import { tr } from '../locale/tr'

const MS_PER_DAY = 24 * 60 * 60 * 1000

const dayDiff = (start: Date, end: Date): number =>
  Math.round((end.getTime() - start.getTime()) / MS_PER_DAY)

describe('builtInPresets', () => {
  it('exposes the four canonical presets in stable order', () => {
    expect(builtInPresets).toHaveLength(4)
    expect(builtInPresets.map(p => p.id)).toEqual([
      'today',
      'last-7-days',
      'this-month',
      'last-month',
    ])
  })

  it('every preset.range() returns a {start, end} pair of valid Dates', () => {
    for (const preset of builtInPresets) {
      const { start, end } = preset.range()
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(Number.isNaN(start.getTime())).toBe(false)
      expect(Number.isNaN(end.getTime())).toBe(false)
      // start <= end is true for all four built-ins.
      expect(start.getTime()).toBeLessThanOrEqual(end.getTime())
    }
  })

  it('"today" returns the same date for start and end at local midnight', () => {
    const today = builtInPresets.find(p => p.id === 'today')!
    const { start, end } = today.range()
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getTime()).toBe(end.getTime())
  })

  it('"last-7-days" spans 7 inclusive days (end - start = 6)', () => {
    const last7 = builtInPresets.find(p => p.id === 'last-7-days')!
    const { start, end } = last7.range()
    expect(dayDiff(start, end)).toBe(6)
  })

  it('"this-month" starts on the 1st of the current month', () => {
    const thisMonth = builtInPresets.find(p => p.id === 'this-month')!
    const { start } = thisMonth.range()
    expect(start.getDate()).toBe(1)
    const now = new Date()
    expect(start.getMonth()).toBe(now.getMonth())
    expect(start.getFullYear()).toBe(now.getFullYear())
  })

  it('"last-month" ends on the last day of the previous month', () => {
    const lastMonth = builtInPresets.find(p => p.id === 'last-month')!
    const { start, end } = lastMonth.range()
    expect(start.getDate()).toBe(1)
    // The end date is "the last day of (start.getMonth())", so adding 1 day
    // should roll into the next month.
    const next = new Date(end)
    next.setDate(end.getDate() + 1)
    expect(next.getMonth()).toBe((start.getMonth() + 1) % 12)
  })
})

describe('getPresetLabel', () => {
  it('falls back to preset.label when no locale is provided', () => {
    const preset = builtInPresets.find(p => p.id === 'today')!
    expect(getPresetLabel(preset)).toBe('Today')
  })

  it('reads the locale field for a built-in preset id', () => {
    const preset = builtInPresets.find(p => p.id === 'last-7-days')!
    expect(getPresetLabel(preset, en)).toBe('Last 7 days')
    expect(getPresetLabel(preset, tr)).toBe('Son 7 gün')
  })

  it('falls back to preset.label for an unknown id', () => {
    const custom: DateRangePreset = {
      id: 'q1',
      label: 'Q1',
      range: () => ({
        start: new Date(2025, 0, 1),
        end: new Date(2025, 2, 31),
      }),
    }
    expect(getPresetLabel(custom, en)).toBe('Q1')
    expect(getPresetLabel(custom, tr)).toBe('Q1')
  })
})
