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
  isSaturday: false,
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

describe('DayCell — callbacks & customization', () => {
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

  it('getDayColor overrides day text color', () => {
    const getDayColor = jest.fn(() => '#FF00AA')
    const renderer = create(
      <DayCell {...defaultProps} getDayColor={getDayColor} />
    )
    expect(getDayColor).toHaveBeenCalled()
    const callArg = (getDayColor.mock.calls[0] as any)[0]
    expect(callArg.day.day).toBe(15)
    expect(callArg.state).toHaveProperty('isSelected')
    expect(callArg.theme).toBeTruthy()

    // The rendered <Text> should carry the overridden color in its style array.
    const textNode = renderer.root.findByType('Text' as any)
    const styles = Array.isArray(textNode.props.style)
      ? textNode.props.style
      : [textNode.props.style]
    const flat = Object.assign({}, ...styles.filter(Boolean))
    expect(flat.color).toBe('#FF00AA')
  })

  it('getDayContent replaces the default day number', () => {
    const getDayContent = jest.fn(() =>
      React.createElement('View', { testID: 'custom-day' })
    )
    const renderer = create(
      <DayCell {...defaultProps} getDayContent={getDayContent} />
    )
    expect(getDayContent).toHaveBeenCalled()

    // Custom node is rendered.
    const customNodes = renderer.root.findAll(
      (node) => node.props && node.props.testID === 'custom-day'
    )
    expect(customNodes.length).toBeGreaterThanOrEqual(1)

    // Default day-number <Text> is NOT rendered.
    const tree = renderer.toJSON()
    expect(findByText(tree, '15')).toBeNull()
  })

  it('getDayStyle is merged onto the slot style', () => {
    const getDayStyle = jest.fn(() => ({ backgroundColor: '#112233' }))
    const renderer = create(
      <DayCell {...defaultProps} getDayStyle={getDayStyle} />
    )
    expect(getDayStyle).toHaveBeenCalled()

    // The outer TouchableOpacity is the slot in normal (non-renderDay) path.
    const touchable = renderer.root.findByType('TouchableOpacity' as any)
    const rawStyle = touchable.props.style
    const styles = Array.isArray(rawStyle) ? rawStyle : [rawStyle]
    const flat = Object.assign({}, ...styles.filter(Boolean))
    expect(flat.backgroundColor).toBe('#112233')
  })

  it('disableAnimation renders without crashing and produces a range band', () => {
    // Range of two consecutive days: the middle-state cell gets `isInRange`.
    // Here we test the range-start endpoint, which still renders a band.
    const startDate = new Date(2026, 2, 15)
    const endDate = new Date(2026, 2, 16)
    const renderer = create(
      <DayCell
        {...defaultProps}
        day={makeDay()}
        startDate={startDate}
        endDate={endDate}
        disableAnimation
      />
    )
    // Smoke: render succeeded and produced some tree.
    const tree = renderer.toJSON()
    expect(tree).toBeTruthy()

    // Day number should still render in normal (non-content-override) path.
    expect(findByText(tree, '15')).not.toBeNull()

    // An Animated.View (the range band) should be present as a child node.
    // In the RN mock Animated.View === View, so look for a view with an
    // absolutely positioned style (the band layer).
    const views = renderer.root.findAllByType('View' as any)
    const hasBand = views.some((v) => {
      const s = v.props.style
      if (!s) return false
      const styles = Array.isArray(s) ? s : [s]
      const flat = Object.assign({}, ...styles.filter(Boolean))
      return flat.position === 'absolute' && flat.height && flat.backgroundColor
    })
    expect(hasBand).toBe(true)
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
