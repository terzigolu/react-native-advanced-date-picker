import React from 'react'
import { create, act } from 'react-test-renderer'
import WeekGrid from '../components/WeekGrid'
import MonthGrid from '../components/MonthGrid'
import YearGrid from '../components/YearGrid'
import TimePicker from '../components/TimePicker'
import DateTimePicker from '../components/DateTimePicker'
import { en } from '../locale/en'

// Helpers ---------------------------------------------------------------------

const findAllByType = (node: any, type: string): any[] => {
  const out: any[] = []
  const walk = (n: any) => {
    if (!n) return
    if (n.type === type) out.push(n)
    if (n.children) {
      for (const child of n.children) {
        if (typeof child === 'object') walk(child)
      }
    }
  }
  walk(node)
  return out
}

// ----------------------------------------------------------------------------
// WeekGrid
// ----------------------------------------------------------------------------

describe('WeekGrid', () => {
  it('renders ISO weeks for a regular year (52 weeks)', () => {
    // 2025 has exactly 52 ISO weeks
    const renderer = create(<WeekGrid year={2025} locale={en} />)
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    expect(touchables.length).toBe(52)
  })

  it('renders 53 weeks for a 53-week ISO year (e.g. 2026)', () => {
    const renderer = create(<WeekGrid year={2026} locale={en} />)
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    expect(touchables.length).toBe(53)
  })

  it('emits range on tap', () => {
    const onSelectWeek = jest.fn()
    const renderer = create(
      <WeekGrid year={2026} locale={en} onSelectWeek={onSelectWeek} />,
    )
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    act(() => {
      touchables[22].props.onPress()
    })
    expect(onSelectWeek).toHaveBeenCalledTimes(1)
    const arg = onSelectWeek.mock.calls[0][0]
    expect(arg.year).toBe(2026)
    expect(arg.week).toBe(23)
    expect(arg.start).toBeInstanceOf(Date)
    expect(arg.end).toBeInstanceOf(Date)
    // Mon → Sun span (6-day diff)
    const days = Math.round(
      (arg.end.getTime() - arg.start.getTime()) / (24 * 3600 * 1000),
    )
    expect(days).toBe(6)
  })
})

// ----------------------------------------------------------------------------
// MonthGrid
// ----------------------------------------------------------------------------

describe('MonthGrid', () => {
  it('renders all 12 months', () => {
    const renderer = create(<MonthGrid year={2026} locale={en} />)
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    expect(touchables.length).toBe(12)
  })

  it('emits firstDay of selected month', () => {
    const onSelectMonth = jest.fn()
    const renderer = create(
      <MonthGrid
        year={2026}
        locale={en}
        onSelectMonth={onSelectMonth}
      />,
    )
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    act(() => {
      touchables[5].props.onPress() // June (index 5)
    })
    expect(onSelectMonth).toHaveBeenCalledTimes(1)
    const [firstDay, month, year] = onSelectMonth.mock.calls[0]
    expect(month).toBe(5)
    expect(year).toBe(2026)
    expect(firstDay.getDate()).toBe(1)
    expect(firstDay.getMonth()).toBe(5)
    expect(firstDay.getFullYear()).toBe(2026)
  })
})

// ----------------------------------------------------------------------------
// YearGrid
// ----------------------------------------------------------------------------

describe('YearGrid', () => {
  it('renders 12 cells (year + 2 nav buttons = 14 touchables)', () => {
    const renderer = create(<YearGrid year={2026} />)
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    // 2 nav buttons + 12 year cells
    expect(touchables.length).toBe(14)
  })

  it('emits Jan 1st when tapping a year cell', () => {
    const onSelectYear = jest.fn()
    const renderer = create(
      <YearGrid year={2026} onSelectYear={onSelectYear} />,
    )
    const touchables = renderer.root.findAllByType('TouchableOpacity' as any)
    // Skip the 2 nav buttons; year cells start at index 2.
    act(() => {
      touchables[2 + 6].props.onPress() // 7th year of decade (2020 + 6 = 2026)
    })
    expect(onSelectYear).toHaveBeenCalledTimes(1)
    const [firstDay, year] = onSelectYear.mock.calls[0]
    expect(year).toBe(2026)
    expect(firstDay.getMonth()).toBe(0)
    expect(firstDay.getDate()).toBe(1)
    expect(firstDay.getFullYear()).toBe(2026)
  })
})

// ----------------------------------------------------------------------------
// TimePicker
// ----------------------------------------------------------------------------

describe('TimePicker', () => {
  it('renders 2 columns (no AM/PM) in 24h mode', () => {
    const renderer = create(
      <TimePicker hourFormat="24" defaultValue={{ hour: 9, minute: 30 }} />,
    )
    // Each FlatList renders inline as a virtualized list — count by testID.
    const wrappers = renderer.root.findAllByProps({ testID: 'timepicker-hour' })
    const minutes = renderer.root.findAllByProps({
      testID: 'timepicker-minute',
    })
    const ampm = renderer.root.findAllByProps({
      testID: 'timepicker-ampm',
    })
    expect(wrappers.length).toBeGreaterThan(0)
    expect(minutes.length).toBeGreaterThan(0)
    expect(ampm.length).toBe(0)
  })

  it('renders 3 columns (incl. AM/PM) in 12h mode', () => {
    const renderer = create(
      <TimePicker hourFormat="12" defaultValue={{ hour: 9, minute: 30 }} />,
    )
    const ampm = renderer.root.findAllByProps({
      testID: 'timepicker-ampm',
    })
    expect(ampm.length).toBeGreaterThan(0)
  })

  it('emits new value when an hour cell is tapped', () => {
    const onChange = jest.fn()
    const renderer = create(
      <TimePicker
        hourFormat="24"
        defaultValue={{ hour: 0, minute: 0 }}
        onChange={onChange}
      />,
    )
    // Find an item touchable inside the hour column.
    const hourCol = renderer.root.findByProps({ testID: 'timepicker-hour' })
    // Items are rendered as TouchableOpacity descendants inside the FlatList.
    const items = hourCol.findAllByType('TouchableOpacity' as any)
    expect(items.length).toBeGreaterThan(3)
    act(() => {
      items[5].props.onPress() // hour index 5 → 5
    })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last.hour).toBe(5)
    expect(last.minute).toBe(0)
  })

  it('respects minuteStep (e.g. 15 → 4 minutes per hour)', () => {
    const onChange = jest.fn()
    const renderer = create(
      <TimePicker
        hourFormat="24"
        minuteStep={15}
        defaultValue={{ hour: 0, minute: 0 }}
        onChange={onChange}
      />,
    )
    const minuteCol = renderer.root.findByProps({
      testID: 'timepicker-minute',
    })
    const items = minuteCol.findAllByType('TouchableOpacity' as any)
    // 60/15 = 4 cells
    expect(items.length).toBe(4)
    act(() => {
      items[2].props.onPress() // minute index 2 → 30
    })
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last.minute).toBe(30)
  })
})

// ----------------------------------------------------------------------------
// DateTimePicker (composition)
// ----------------------------------------------------------------------------

describe('DateTimePicker', () => {
  it('renders both calendar + time picker', () => {
    const renderer = create(
      <DateTimePicker
        value={{ date: new Date(2026, 5, 15), hour: 14, minute: 30 }}
      />,
    )
    // TimePicker hour column should be present
    const hourCol = renderer.root.findAllByProps({
      testID: 'timepicker-hour',
    })
    expect(hourCol.length).toBeGreaterThan(0)
  })

  it('emits time-kind selection when time changes', () => {
    const onChange = jest.fn()
    const renderer = create(
      <DateTimePicker
        value={{ date: new Date(2026, 5, 15), hour: 0, minute: 0 }}
        onChange={onChange}
      />,
    )
    const hourCol = renderer.root.findByProps({ testID: 'timepicker-hour' })
    const items = hourCol.findAllByType('TouchableOpacity' as any)
    act(() => {
      items[10].props.onPress() // hour 10
    })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(last.kind).toBe('time')
    expect(last.hour).toBe(10)
    // Date should be preserved through the time change
    expect(last.date).toBeTruthy()
  })
})
