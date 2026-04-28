import { useCallback, useState } from 'react'

export type KeyboardNavDirection =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'pageup'
  | 'pagedown'
  | 'home'
  | 'end'

export interface UseKeyboardNavOptions {
  /** Disable handling without unmounting the hook (default: true). */
  enabled?: boolean
  /** Seed value for the focused date. */
  initialFocus?: Date | null
  /** Lower bound for navigation (focus is clamped). */
  minDate?: Date
  /** Upper bound for navigation. */
  maxDate?: Date
  /** Fired on Enter / Space when a date is focused. */
  onSelectDate?: (date: Date) => void
  /** Fired on Escape. The caller decides what to do (close modal, etc.). */
  onEscape?: () => void
}

export interface UseKeyboardNavReturn {
  focusedDate: Date | null
  setFocus: (date: Date | null) => void
  moveFocus: (direction: KeyboardNavDirection) => void
  handleKeyDown: (e: { key: string; preventDefault?: () => void }) => void
  isFocused: (date: Date) => boolean
}

const clone = (d: Date) => new Date(d.getTime())

const clamp = (d: Date, min?: Date, max?: Date): Date => {
  if (min && d < min) return clone(min)
  if (max && d > max) return clone(max)
  return d
}

export function useKeyboardNav(
  options: UseKeyboardNavOptions = {}
): UseKeyboardNavReturn {
  const {
    enabled = true,
    initialFocus = null,
    minDate,
    maxDate,
    onSelectDate,
    onEscape,
  } = options

  const [focusedDate, setFocusedDate] = useState<Date | null>(initialFocus)

  const setFocus = useCallback((date: Date | null) => {
    setFocusedDate(date ? clone(date) : null)
  }, [])

  const moveFocus = useCallback(
    (direction: KeyboardNavDirection) => {
      if (!enabled) return
      setFocusedDate(prev => {
        const base = prev ? clone(prev) : new Date()
        switch (direction) {
          case 'left':
            base.setDate(base.getDate() - 1)
            break
          case 'right':
            base.setDate(base.getDate() + 1)
            break
          case 'up':
            base.setDate(base.getDate() - 7)
            break
          case 'down':
            base.setDate(base.getDate() + 7)
            break
          case 'pageup':
            base.setMonth(base.getMonth() - 1)
            break
          case 'pagedown':
            base.setMonth(base.getMonth() + 1)
            break
          case 'home':
            base.setDate(1)
            break
          case 'end':
            // Last day of the current month: set to day 0 of NEXT month.
            base.setMonth(base.getMonth() + 1, 0)
            break
        }
        return clamp(base, minDate, maxDate)
      })
    },
    [enabled, minDate, maxDate]
  )

  const handleKeyDown = useCallback(
    (e: { key: string; preventDefault?: () => void }) => {
      if (!enabled) return
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault?.()
          moveFocus('left')
          return
        case 'ArrowRight':
          e.preventDefault?.()
          moveFocus('right')
          return
        case 'ArrowUp':
          e.preventDefault?.()
          moveFocus('up')
          return
        case 'ArrowDown':
          e.preventDefault?.()
          moveFocus('down')
          return
        case 'PageUp':
          e.preventDefault?.()
          moveFocus('pageup')
          return
        case 'PageDown':
          e.preventDefault?.()
          moveFocus('pagedown')
          return
        case 'Home':
          e.preventDefault?.()
          moveFocus('home')
          return
        case 'End':
          e.preventDefault?.()
          moveFocus('end')
          return
        case 'Enter':
        case ' ':
          if (focusedDate && onSelectDate) {
            e.preventDefault?.()
            onSelectDate(clone(focusedDate))
          }
          return
        case 'Escape':
          if (onEscape) {
            e.preventDefault?.()
            onEscape()
          }
          return
      }
    },
    [enabled, moveFocus, focusedDate, onSelectDate, onEscape]
  )

  const isFocused = useCallback(
    (date: Date) => {
      if (!focusedDate) return false
      return (
        date.getFullYear() === focusedDate.getFullYear() &&
        date.getMonth() === focusedDate.getMonth() &&
        date.getDate() === focusedDate.getDate()
      )
    },
    [focusedDate]
  )

  return { focusedDate, setFocus, moveFocus, handleKeyDown, isFocused }
}

export default useKeyboardNav
