import React from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react'
import WeekDayHeader from './WeekDayHeader'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'
import { tr } from '../locale/tr'

// ----------------------------------------------------------------------------
// Storybook story for the WeekDayHeader sub-component. Locale variants exercise
// the Mon-first ordering and weekend coloring.
// ----------------------------------------------------------------------------

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View
    style={{
      backgroundColor: '#fff',
      padding: 16,
      width: 320,
    }}>
    {children}
  </View>
)

const meta: Meta<typeof WeekDayHeader> = {
  title: 'Components/WeekDayHeader',
  component: WeekDayHeader,
}

export default meta

type Story = StoryObj<typeof WeekDayHeader>

export const English: Story = {
  render: () => (
    <Frame>
      <WeekDayHeader locale={en} theme={defaultTheme} />
    </Frame>
  ),
}

export const Turkish: Story = {
  render: () => (
    <Frame>
      <WeekDayHeader locale={tr} theme={defaultTheme} />
    </Frame>
  ),
}

export const WeekendOverride: Story = {
  render: () => (
    <Frame>
      <WeekDayHeader
        locale={en}
        theme={{
          ...defaultTheme,
          weekendColor: '#DC2626',
        }}
      />
    </Frame>
  ),
}
