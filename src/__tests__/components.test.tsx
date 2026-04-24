import React from 'react'
import { create, act } from 'react-test-renderer'
import DayCell from '../components/DayCell'
import WeekDayHeader from '../components/WeekDayHeader'
import MonthHeader from '../components/MonthHeader'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'
import { tr } from '../locale/tr'
import type { DateItem } from '../utils/types'

const makeDay = (overrides: Partial<DateItem> = {}): DateItem => ({
  id: 'test-1',
  day: 15,
  fullDate: new Date(2026, 2, 15).toISOString(),
  dayName: 'Sunday',
  monthName: 'March',
  isSunday: false,
  isToday: false,
  isHoliday: false,
  isEmpty: false,
  ...overrides,
})

const findAllByType = (tree: any, type: string): any[] => {
  const results: any[] = []
  const search = (node: any) => {
    if (!node) return
    if (node.type === type) results.push(node)
    if (node.children) {
      for (const child of node.children) {
        if (typeof child === 'object') search(child)
      }
    }
  }
  search(tree)
  return results
}

const findByText = (tree: any, text: string): any | null => {
  const search = (node: any): any | null => {
    if (!node) return null
    if (typeof node === 'string' && node === String(text)) return node
    if (node.children) {
      for (const child of node.children) {
        const found = search(child)
        if (found !== null) return found
      }
    }
    return null
  }
  return search(tree)
}

describe('DayCell', () => {
  const defaultProps = {
    day: makeDay(),
    startDate: null,
    endDate: null,
    theme: defaultTheme,
    onPress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the day number', () => {
    const tree = create(<DayCell {...defaultProps} />).toJSON()
    expect(findByText(tree, '15')).not.toBeNull()
  })

  it('calls onPress with the DateItem when pressed', () => {
    const onPress = jest.fn()
    const renderer = create(<DayCell {...defaultProps} onPress={onPress} />)
    const root = renderer.root
    const touchable = root.findByType('TouchableOpacity' as any)
    act(() => {
      touchable.props.onPress?.()
    })
    expect(onPress).toHaveBeenCalledTimes(1)
    const calledDay = onPress.mock.calls[0][0]
    expect(calledDay.day).toBe(15)
    expect(calledDay.fullDate).toBeTruthy()
  })

  it('renders empty cell for isEmpty day', () => {
    const emptyDay = makeDay({ isEmpty: true, day: 0, fullDate: '' })
    const tree = create(<DayCell {...defaultProps} day={emptyDay} />).toJSON()
    expect(tree).toBeTruthy()
    expect(findByText(tree, '0')).toBeNull()
  })

  it('does not fire onPress when disabled by minDate', () => {
    const onPress = jest.fn()
    const futureMinDate = new Date(2027, 0, 1)
    const renderer = create(
      <DayCell {...defaultProps} onPress={onPress} minDate={futureMinDate} />
    )
    const root = renderer.root
    const touchable = root.findByType('TouchableOpacity' as any)
    expect(touchable.props.disabled).toBe(true)
  })

  it('does not fire onPress when disabled by maxDate', () => {
    const onPress = jest.fn()
    const pastMaxDate = new Date(2020, 0, 1)
    const renderer = create(
      <DayCell {...defaultProps} onPress={onPress} maxDate={pastMaxDate} />
    )
    const root = renderer.root
    const touchable = root.findByType('TouchableOpacity' as any)
    expect(touchable.props.disabled).toBe(true)
  })

  it('enables dates when no minDate/maxDate restriction', () => {
    const onPress = jest.fn()
    const renderer = create(<DayCell {...defaultProps} onPress={onPress} />)
    const root = renderer.root
    const touchable = root.findByType('TouchableOpacity' as any)
    expect(touchable.props.disabled).toBe(false)
  })

  it('marks day as selected when startDate matches', () => {
    const renderDay = jest.fn(() => React.createElement('View', null))
    const startDate = new Date(2026, 2, 15)
    create(
      <DayCell
        {...defaultProps}
        startDate={startDate}
        renderDay={renderDay}
      />
    )
    expect(renderDay).toHaveBeenCalled()
    const state = (renderDay.mock.calls[0] as any)[1]
    expect(state.isSelected).toBe(true)
  })

  it('uses custom renderDay when provided', () => {
    const renderDay = jest.fn(() => React.createElement('View', null))
    create(<DayCell {...defaultProps} renderDay={renderDay} />)
    expect(renderDay).toHaveBeenCalledTimes(1)
    const [day, state] = (renderDay.mock.calls[0] as any)
    expect(day.day).toBe(15)
    expect(state).toHaveProperty('isSelected')
    expect(state).toHaveProperty('isInRange')
    expect(state).toHaveProperty('isDisabled')
    expect(state).toHaveProperty('isToday')
    expect(state).toHaveProperty('isHoliday')
    expect(state).toHaveProperty('isSunday')
  })
})

describe('WeekDayHeader', () => {
  it('renders 7 day names', () => {
    const tree = create(
      <WeekDayHeader locale={en} theme={defaultTheme} />
    ).toJSON()
    const texts = findAllByType(tree, 'Text')
    expect(texts).toHaveLength(7)
  })

  it('renders Turkish day names', () => {
    const tree = create(
      <WeekDayHeader locale={tr} theme={defaultTheme} />
    ).toJSON()
    const texts = findAllByType(tree, 'Text')
    expect(texts).toHaveLength(7)
  })
})

describe('MonthHeader', () => {
  it('renders month name and year', () => {
    const tree = create(
      <MonthHeader monthName="March" year={2026} theme={defaultTheme} />
    ).toJSON()
    expect(findByText(tree, 'March')).not.toBeNull()
    expect(findByText(tree, '2026')).not.toBeNull()
  })

  it('renders Turkish month name', () => {
    const tree = create(
      <MonthHeader monthName="Mart" year={2026} theme={defaultTheme} />
    ).toJSON()
    expect(findByText(tree, 'Mart')).not.toBeNull()
    expect(findByText(tree, '2026')).not.toBeNull()
  })
})

describe('Locale objects', () => {
  it('en locale has all required fields', () => {
    expect(en.code).toBe('en')
    expect(en.dayNamesShort).toHaveLength(7)
    expect(en.monthNames).toHaveLength(12)
    expect(en.save).toBeTruthy()
    expect(en.cancel).toBeTruthy()
    expect(en.pastDateWarning).toBeTruthy()
    expect(en.warningTitle).toBeTruthy()
    expect(en.ok).toBeTruthy()
  })

  it('tr locale has all required fields', () => {
    expect(tr.code).toBe('tr')
    expect(tr.dayNamesShort).toHaveLength(7)
    expect(tr.monthNames).toHaveLength(12)
    expect(tr.save).toBe('Kaydet')
    expect(tr.cancel).toBe('İptal')
  })
})

describe('Theme', () => {
  it('defaultTheme has all required properties', () => {
    expect(defaultTheme.primary).toBeTruthy()
    expect(defaultTheme.background).toBeTruthy()
    expect(defaultTheme.textColor).toBeTruthy()
    expect(defaultTheme.disabledColor).toBeTruthy()
    expect(defaultTheme.rangeBackground).toBeTruthy()
    expect(defaultTheme.holidayColor).toBeTruthy()
    expect(defaultTheme.sundayColor).toBeTruthy()
    expect(defaultTheme.selectedTextColor).toBeTruthy()
    expect(defaultTheme.dayBorderRadius).toBeDefined()
    expect(defaultTheme.monthHeaderColor).toBeTruthy()
    expect(defaultTheme.weekDayHeaderColor).toBeTruthy()
    expect(defaultTheme.dividerColor).toBeTruthy()
  })
})
