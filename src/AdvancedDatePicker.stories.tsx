import React, { useState } from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react'
import AdvancedDatePicker from './AdvancedDatePicker'
import type { Holiday } from './utils/types'

// ----------------------------------------------------------------------------
// Storybook story for the top-level AdvancedDatePicker. Exercises every
// shipped mode (single, range, inline, holidays, modal). Each story keeps
// internal state via React.useState so the storybook web preview stays
// interactive without bringing in a global state lib.
// ----------------------------------------------------------------------------

const Stage: React.FC<{ children: React.ReactNode; height?: number }> = ({
  children,
  height = 600,
}) => (
  <View
    style={{
      backgroundColor: '#fff',
      width: 360,
      height,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    }}>
    {children}
  </View>
)

const SAMPLE_HOLIDAYS: Holiday[] = [
  { date: '01-01', label: 'New Year' },
  { date: '05-01', label: 'Labour Day' },
  { date: '12-25', label: 'Christmas' },
]

const meta: Meta<typeof AdvancedDatePicker> = {
  title: 'AdvancedDatePicker',
  component: AdvancedDatePicker,
}

export default meta

type Story = StoryObj<typeof AdvancedDatePicker>

// ---- Inline single ---------------------------------------------------------
const InlineSingleDemo: React.FC = () => {
  const [date, setDate] = useState<Date | null>(null)
  return (
    <Stage>
      <AdvancedDatePicker
        modal={false}
        mode="single"
        startDate={date}
        onDateChange={({ startDate }) => setDate(startDate)}
      />
    </Stage>
  )
}

export const InlineSingle: Story = {
  render: () => <InlineSingleDemo />,
}

// ---- Inline range ----------------------------------------------------------
const InlineRangeDemo: React.FC = () => {
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  return (
    <Stage>
      <AdvancedDatePicker
        modal={false}
        mode="range"
        startDate={start}
        endDate={end}
        onDateChange={({ startDate, endDate }) => {
          setStart(startDate)
          setEnd(endDate)
        }}
      />
    </Stage>
  )
}

export const InlineRange: Story = {
  render: () => <InlineRangeDemo />,
}

// ---- Inline range with holidays -------------------------------------------
const InlineRangeWithHolidaysDemo: React.FC = () => {
  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)
  return (
    <Stage>
      <AdvancedDatePicker
        modal={false}
        mode="range"
        startDate={start}
        endDate={end}
        holidays={SAMPLE_HOLIDAYS}
        showHolidays
        onDateChange={({ startDate, endDate }) => {
          setStart(startDate)
          setEnd(endDate)
        }}
      />
    </Stage>
  )
}

export const InlineRangeWithHolidays: Story = {
  render: () => <InlineRangeWithHolidaysDemo />,
}

// ---- Modal single ----------------------------------------------------------
const ModalSingleDemo: React.FC = () => {
  const [visible, setVisible] = useState(true)
  const [date, setDate] = useState<Date | null>(null)
  return (
    <Stage>
      <AdvancedDatePicker
        modal
        visible={visible}
        mode="single"
        startDate={date}
        onDateChange={({ startDate }) => setDate(startDate)}
        onClose={() => setVisible(false)}
        onSave={() => setVisible(false)}
      />
    </Stage>
  )
}

export const ModalSingle: Story = {
  render: () => <ModalSingleDemo />,
}

// ---- Branded theme ---------------------------------------------------------
const BrandedThemeDemo: React.FC = () => {
  const [date, setDate] = useState<Date | null>(null)
  return (
    <Stage>
      <AdvancedDatePicker
        modal={false}
        mode="single"
        startDate={date}
        onDateChange={({ startDate }) => setDate(startDate)}
        theme={{
          primary: '#7C3AED',
          rangeBackground: '#EDE9FE',
          monthHeaderColor: '#7C3AED',
          dayBorderRadius: 12,
        }}
      />
    </Stage>
  )
}

export const BrandedTheme: Story = {
  render: () => <BrandedThemeDemo />,
}
