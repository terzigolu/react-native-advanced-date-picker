import React from 'react'
import { create, act } from 'react-test-renderer'
import AdvancedDatePicker from '../AdvancedDatePicker'

/**
 * Backward-compat smoke tests — these assertions guarantee that the README
 * Quick Start example (mode='range', startDate, endDate, onDateChange) keeps
 * working exactly as it did in v0.2.x after the Lane 0 selection-union
 * refactor.
 */

const findTouchableForDay = (root: any, day: number): any | null => {
  const touchables = root.findAllByType('TouchableOpacity' as any)
  for (const t of touchables) {
    const search = (node: any): boolean => {
      if (!node) return false
      if (typeof node === 'string') return node === String(day)
      if (Array.isArray(node)) return node.some(search)
      if (node.children) return [].concat(node.children as any).some(search)
      return false
    }
    if (search(t.children)) return t
  }
  return null
}

describe('AdvancedDatePicker — legacy API (Quick Start regression)', () => {
  it("emits onDateChange({ startDate, endDate }) for mode='single'", () => {
    const onDateChange = jest.fn()
    const renderer = create(
      <AdvancedDatePicker
        mode="single"
        modal={false}
        locale="en"
        startDate={null}
        endDate={null}
        onDateChange={onDateChange}
        months={1}
      />,
    )
    // Find any day cell and tap it — emission should fire with the legacy shape
    const root = renderer.root
    const touchables = root.findAllByType('TouchableOpacity' as any)
    const enabled = touchables.filter((t: any) => t.props.disabled === false)
    expect(enabled.length).toBeGreaterThan(0)

    act(() => {
      enabled[0].props.onPress?.()
    })

    expect(onDateChange).toHaveBeenCalled()
    const payload = onDateChange.mock.calls[onDateChange.mock.calls.length - 1][0]
    expect(payload).toHaveProperty('startDate')
    expect(payload).toHaveProperty('endDate')
    expect(payload.endDate).toBeNull()
  })

  it("emits onDateChange with start then end for mode='range'", () => {
    const onDateChange = jest.fn()
    const renderer = create(
      <AdvancedDatePicker
        mode="range"
        modal={false}
        locale="en"
        startDate={null}
        endDate={null}
        onDateChange={onDateChange}
        months={1}
      />,
    )
    const enabled = () =>
      renderer.root
        .findAllByType('TouchableOpacity' as any)
        .filter((t: any) => t.props.disabled === false)
    expect(enabled().length).toBeGreaterThanOrEqual(2)

    act(() => {
      enabled()[0].props.onPress?.()
    })
    // Re-query after re-render — TouchableOpacity refs are recreated.
    act(() => {
      enabled()[1].props.onPress?.()
    })

    // At least one emission should carry both start and end as Dates.
    const calls = onDateChange.mock.calls.map(c => c[0])
    const completed = calls.find(p => p.startDate && p.endDate)
    expect(completed).toBeTruthy()
    expect(completed.startDate).toBeInstanceOf(Date)
    expect(completed.endDate).toBeInstanceOf(Date)
  })

  it('also emits the new onChange(selection) when provided', () => {
    const onDateChange = jest.fn()
    const onChange = jest.fn()
    const renderer = create(
      <AdvancedDatePicker
        mode="single"
        modal={false}
        locale="en"
        startDate={null}
        endDate={null}
        onDateChange={onDateChange}
        onChange={onChange}
        months={1}
      />,
    )
    const root = renderer.root
    const touchables = root.findAllByType('TouchableOpacity' as any)
    const enabled = touchables.filter((t: any) => t.props.disabled === false)

    act(() => {
      enabled[0].props.onPress?.()
    })

    expect(onDateChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalled()
    const sel = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(sel.kind).toBe('single')
  })
})
