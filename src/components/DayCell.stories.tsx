import React from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react'
import DayCell from './DayCell'
import { defaultTheme } from '../theme/defaultTheme'
import type { DateItem } from '../utils/types'

// ----------------------------------------------------------------------------
// Storybook story for the DayCell sub-component. Each variant exercises one
// of the runtime DayCellState flags so designers can review every visual
// permutation in isolation (no calendar, no modal). The stories render in
// react-native-web so they show up in `storybook dev` (web preview).
// ----------------------------------------------------------------------------

const todayISO = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
})()

const buildDay = (overrides: Partial<DateItem> = {}): DateItem => ({
  id: 'demo-15',
  day: 15,
  fullDate: todayISO,
  dayName: 'Mon',
  monthName: 'January',
  isSunday: false,
  isSaturday: false,
  isToday: false,
  isHoliday: false,
  isEmpty: false,
  ...overrides,
})

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View
    style={{
      flexDirection: 'row',
      backgroundColor: '#fff',
      padding: 16,
    }}>
    {children}
  </View>
)

const meta: Meta<typeof DayCell> = {
  title: 'Components/DayCell',
  component: DayCell,
}

export default meta

type Story = StoryObj<typeof DayCell>

export const Default: Story = {
  render: () => (
    <Frame>
      <DayCell
        day={buildDay()}
        onPress={() => {}}
        startDate={null}
        endDate={null}
        theme={defaultTheme}
      />
    </Frame>
  ),
}

export const Selected: Story = {
  render: () => {
    const day = buildDay()
    return (
      <Frame>
        <DayCell
          day={day}
          onPress={() => {}}
          startDate={new Date(day.fullDate)}
          endDate={null}
          theme={defaultTheme}
        />
      </Frame>
    )
  },
}

export const InRange: Story = {
  render: () => {
    const start = new Date()
    start.setDate(start.getDate() - 3)
    const end = new Date()
    end.setDate(end.getDate() + 3)
    return (
      <Frame>
        <DayCell
          day={buildDay()}
          onPress={() => {}}
          startDate={start}
          endDate={end}
          isInRange
          theme={defaultTheme}
        />
      </Frame>
    )
  },
}

export const Disabled: Story = {
  render: () => {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    return (
      <Frame>
        <DayCell
          day={buildDay()}
          onPress={() => {}}
          startDate={null}
          endDate={null}
          minDate={future}
          theme={defaultTheme}
        />
      </Frame>
    )
  },
}

export const Holiday: Story = {
  render: () => (
    <Frame>
      <DayCell
        day={buildDay({
          isHoliday: true,
          holidayLabel: 'New Year',
        })}
        onPress={() => {}}
        startDate={null}
        endDate={null}
        theme={defaultTheme}
      />
    </Frame>
  ),
}

export const Today: Story = {
  render: () => (
    <Frame>
      <DayCell
        day={buildDay({ isToday: true })}
        onPress={() => {}}
        startDate={null}
        endDate={null}
        theme={defaultTheme}
      />
    </Frame>
  ),
}

export const Sunday: Story = {
  render: () => (
    <Frame>
      <DayCell
        day={buildDay({ isSunday: true })}
        onPress={() => {}}
        startDate={null}
        endDate={null}
        theme={defaultTheme}
      />
    </Frame>
  ),
}
