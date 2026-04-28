/**
 * @jest-environment jest-environment-jsdom
 */
import { renderHook, act } from '@testing-library/react'
import useDatePicker, {
  propsToSelection,
  selectionEqual,
} from '../hooks/useDatePicker'
import type { Selection } from '../utils/types'

describe('useDatePicker — single mode', () => {
  it('initializes with null date', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single' }),
    )
    expect(result.current.selection).toEqual({ kind: 'single', date: null })
  })

  it('selectDate sets the selection', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single' }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 5, 15))
    })
    expect(result.current.selection.kind).toBe('single')
    if (result.current.selection.kind === 'single') {
      expect(result.current.selection.date?.getDate()).toBe(15)
      expect(result.current.selection.date?.getMonth()).toBe(5)
    }
  })

  it('clear resets to null', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single' }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 1))
    })
    act(() => {
      result.current.handlers.clear()
    })
    expect(result.current.selection).toEqual({ kind: 'single', date: null })
  })

  it('emits legacy onDateChange with { startDate, endDate }', () => {
    const onDateChange = jest.fn()
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single', onDateChange }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 2, 10))
    })
    expect(onDateChange).toHaveBeenCalledTimes(1)
    expect(onDateChange.mock.calls[0][0]).toMatchObject({
      endDate: null,
    })
    expect(onDateChange.mock.calls[0][0].startDate).toBeInstanceOf(Date)
  })

  it('emits onChange with the union', () => {
    const onChange = jest.fn()
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single', onChange }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 2, 10))
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].kind).toBe('single')
  })
})

describe('useDatePicker — range mode', () => {
  it('initializes empty range', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'range' }),
    )
    expect(result.current.selection).toEqual({
      kind: 'range',
      start: null,
      end: null,
    })
  })

  it('first selectDate sets start, second sets end', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'range' }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 5))
    })
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getDate()).toBe(5)
      expect(result.current.selection.end).toBeNull()
    }
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 12))
    })
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getDate()).toBe(5)
      expect(result.current.selection.end?.getDate()).toBe(12)
    }
  })

  it('selecting before start replaces start', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'range' }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 10))
    })
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 5))
    })
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getDate()).toBe(5)
      expect(result.current.selection.end).toBeNull()
    }
  })

  it('third selectDate after complete range starts a new range', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'range' }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 5))
    })
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 12))
    })
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 20))
    })
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getDate()).toBe(20)
      expect(result.current.selection.end).toBeNull()
    }
  })
})

describe('useDatePicker — multi mode', () => {
  it('toggles dates in/out of the Set', () => {
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'multi' }),
    )
    const d1 = new Date(2026, 5, 1)
    const d2 = new Date(2026, 5, 2)
    act(() => {
      result.current.handlers.selectDate(d1)
    })
    act(() => {
      result.current.handlers.selectDate(d2)
    })
    if (result.current.selection.kind === 'multi') {
      expect(result.current.selection.dates.size).toBe(2)
    }
    // toggle off d1
    act(() => {
      result.current.handlers.selectDate(d1)
    })
    if (result.current.selection.kind === 'multi') {
      expect(result.current.selection.dates.size).toBe(1)
      expect(result.current.selection.dates.has('2026-06-02')).toBe(true)
    }
  })
})

describe('useDatePicker — disabled handling', () => {
  it('skips selectDate for dates before minDate', () => {
    const minDate = new Date(2026, 0, 10)
    const { result } = renderHook(() =>
      useDatePicker({ selectionMode: 'single', minDate }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 5))
    })
    expect(result.current.selection).toEqual({ kind: 'single', date: null })
  })

  it('skips selectDate for dates in disabledDates list', () => {
    const blocked = new Date(2026, 0, 10)
    const { result } = renderHook(() =>
      useDatePicker({
        selectionMode: 'single',
        disabledDates: [blocked],
      }),
    )
    act(() => {
      result.current.handlers.selectDate(new Date(2026, 0, 10))
    })
    expect(result.current.selection).toEqual({ kind: 'single', date: null })
  })

  it('isDisabled reflects min/max/disabledDates', () => {
    const { result } = renderHook(() =>
      useDatePicker({
        selectionMode: 'single',
        minDate: new Date(2026, 0, 5),
        maxDate: new Date(2026, 0, 25),
        disabledDates: [new Date(2026, 0, 15)],
      }),
    )
    expect(result.current.isDisabled(new Date(2026, 0, 1))).toBe(true)
    expect(result.current.isDisabled(new Date(2026, 0, 30))).toBe(true)
    expect(result.current.isDisabled(new Date(2026, 0, 15))).toBe(true)
    expect(result.current.isDisabled(new Date(2026, 0, 10))).toBe(false)
  })
})

describe('useDatePicker — backward compat (legacy mode prop)', () => {
  it("mode='single' maps to selectionMode='single'", () => {
    const { result } = renderHook(() => useDatePicker({ mode: 'single' }))
    expect(result.current.selection.kind).toBe('single')
  })

  it("mode='range' maps to selectionMode='range'", () => {
    const { result } = renderHook(() => useDatePicker({ mode: 'range' }))
    expect(result.current.selection.kind).toBe('range')
  })

  it('initial startDate seeds single selection', () => {
    const start = new Date(2026, 5, 15)
    const { result } = renderHook(() =>
      useDatePicker({ mode: 'single', startDate: start }),
    )
    if (result.current.selection.kind === 'single') {
      expect(result.current.selection.date?.getTime()).toBe(start.getTime())
    }
  })

  it('initial startDate+endDate seeds range', () => {
    const s = new Date(2026, 5, 1)
    const e = new Date(2026, 5, 10)
    const { result } = renderHook(() =>
      useDatePicker({ mode: 'range', startDate: s, endDate: e }),
    )
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getTime()).toBe(s.getTime())
      expect(result.current.selection.end?.getTime()).toBe(e.getTime())
    }
  })
})

describe('propsToSelection', () => {
  it('initialSelection wins over legacy', () => {
    const init: Selection = { kind: 'single', date: new Date(2026, 1, 1) }
    const out = propsToSelection({
      initialSelection: init,
      mode: 'range',
      startDate: new Date(2026, 0, 1),
    })
    expect(out).toBe(init)
  })

  it("legacy mode='range' produces range shape", () => {
    const out = propsToSelection({ mode: 'range' })
    expect(out.kind).toBe('range')
  })
})

describe('selectionEqual', () => {
  it('returns false across different kinds', () => {
    const a: Selection = { kind: 'single', date: null }
    const b: Selection = { kind: 'range', start: null, end: null }
    expect(selectionEqual(a, b)).toBe(false)
  })

  it('compares single by date', () => {
    expect(
      selectionEqual(
        { kind: 'single', date: new Date(2026, 0, 1) },
        { kind: 'single', date: new Date(2026, 0, 1) },
      ),
    ).toBe(true)
  })

  it('compares multi by Set membership', () => {
    expect(
      selectionEqual(
        { kind: 'multi', dates: new Set(['2026-01-01', '2026-01-02']) },
        { kind: 'multi', dates: new Set(['2026-01-02', '2026-01-01']) },
      ),
    ).toBe(true)
  })
})

describe('useDatePicker — calendarData', () => {
  it('returns 12 months by default', () => {
    const { result } = renderHook(() => useDatePicker({}))
    expect(result.current.calendarData).toHaveLength(12)
  })

  it('respects months option', () => {
    const { result } = renderHook(() => useDatePicker({ months: 3 }))
    expect(result.current.calendarData).toHaveLength(3)
  })
})

describe('useDatePicker — setSelection', () => {
  it('directly sets the union state', () => {
    const { result } = renderHook(() => useDatePicker({ mode: 'range' }))
    const next: Selection = {
      kind: 'range',
      start: new Date(2026, 0, 5),
      end: new Date(2026, 0, 12),
    }
    act(() => {
      result.current.handlers.setSelection(next)
    })
    if (result.current.selection.kind === 'range') {
      expect(result.current.selection.start?.getDate()).toBe(5)
      expect(result.current.selection.end?.getDate()).toBe(12)
    }
  })
})
