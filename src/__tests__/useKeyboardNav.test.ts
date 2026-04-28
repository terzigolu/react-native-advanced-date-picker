import { renderHook, act } from '@testing-library/react-hooks'
import { useKeyboardNav } from '../hooks/useKeyboardNav'

const D = (y: number, m: number, d: number) => new Date(y, m, d)

describe('useKeyboardNav', () => {
  it('initialises with null focus by default', () => {
    const { result } = renderHook(() => useKeyboardNav())
    expect(result.current.focusedDate).toBeNull()
  })

  it('seeds focus from initialFocus', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    expect(result.current.focusedDate?.getDate()).toBe(15)
    expect(result.current.focusedDate?.getMonth()).toBe(0)
  })

  it('moves focus left/right by one day', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    act(() => result.current.moveFocus('right'))
    expect(result.current.focusedDate?.getDate()).toBe(16)
    act(() => result.current.moveFocus('left'))
    expect(result.current.focusedDate?.getDate()).toBe(15)
  })

  it('moves focus up/down by 7 days', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    act(() => result.current.moveFocus('down'))
    expect(result.current.focusedDate?.getDate()).toBe(22)
    act(() => result.current.moveFocus('up'))
    expect(result.current.focusedDate?.getDate()).toBe(15)
  })

  it('PageUp/PageDown changes month', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 5, 15) })
    )
    act(() => result.current.moveFocus('pageup'))
    expect(result.current.focusedDate?.getMonth()).toBe(4)
    act(() => result.current.moveFocus('pagedown'))
    expect(result.current.focusedDate?.getMonth()).toBe(5)
  })

  it('Home → first day of month, End → last day of month', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    act(() => result.current.moveFocus('home'))
    expect(result.current.focusedDate?.getDate()).toBe(1)
    act(() => result.current.moveFocus('end'))
    expect(result.current.focusedDate?.getDate()).toBe(31)
  })

  it('crosses month boundary when ArrowLeft from day 1', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 1, 1) })
    )
    act(() => result.current.moveFocus('left'))
    expect(result.current.focusedDate?.getMonth()).toBe(0)
    expect(result.current.focusedDate?.getDate()).toBe(31)
  })

  it('clamps to minDate / maxDate', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({
        initialFocus: D(2026, 0, 15),
        minDate: D(2026, 0, 10),
        maxDate: D(2026, 0, 20),
      })
    )
    act(() => result.current.moveFocus('pageup')) // Dec 15 — below min
    expect(result.current.focusedDate?.getDate()).toBe(10)
    act(() => result.current.moveFocus('end')) // Jan 31 — above max
    expect(result.current.focusedDate?.getDate()).toBe(20)
  })

  it('handleKeyDown dispatches arrow keys', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    act(() => result.current.handleKeyDown({ key: 'ArrowRight' }))
    expect(result.current.focusedDate?.getDate()).toBe(16)
  })

  it('Enter triggers onSelectDate with focused date', () => {
    const onSelectDate = jest.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15), onSelectDate })
    )
    act(() => result.current.handleKeyDown({ key: 'Enter' }))
    expect(onSelectDate).toHaveBeenCalledTimes(1)
    expect(onSelectDate.mock.calls[0][0].getDate()).toBe(15)
  })

  it('Space also triggers onSelectDate', () => {
    const onSelectDate = jest.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15), onSelectDate })
    )
    act(() => result.current.handleKeyDown({ key: ' ' }))
    expect(onSelectDate).toHaveBeenCalledTimes(1)
  })

  it('Escape triggers onEscape', () => {
    const onEscape = jest.fn()
    const { result } = renderHook(() => useKeyboardNav({ onEscape }))
    act(() => result.current.handleKeyDown({ key: 'Escape' }))
    expect(onEscape).toHaveBeenCalled()
  })

  it('respects enabled=false (no-op)', () => {
    const onSelectDate = jest.fn()
    const { result } = renderHook(() =>
      useKeyboardNav({
        enabled: false,
        initialFocus: D(2026, 0, 15),
        onSelectDate,
      })
    )
    act(() => result.current.moveFocus('right'))
    expect(result.current.focusedDate?.getDate()).toBe(15) // unchanged
    act(() => result.current.handleKeyDown({ key: 'Enter' }))
    expect(onSelectDate).not.toHaveBeenCalled()
  })

  it('isFocused matches by Y/M/D', () => {
    const { result } = renderHook(() =>
      useKeyboardNav({ initialFocus: D(2026, 0, 15) })
    )
    expect(result.current.isFocused(D(2026, 0, 15))).toBe(true)
    expect(result.current.isFocused(D(2026, 0, 16))).toBe(false)
  })

  it('setFocus updates the focused date', () => {
    const { result } = renderHook(() => useKeyboardNav())
    act(() => result.current.setFocus(D(2026, 5, 1)))
    expect(result.current.focusedDate?.getMonth()).toBe(5)
    act(() => result.current.setFocus(null))
    expect(result.current.focusedDate).toBeNull()
  })
})
