import React from 'react'
import { View } from 'react-native'
import type { Meta, StoryObj } from '@storybook/react'
import MonthHeader from './MonthHeader'
import { defaultTheme } from '../theme/defaultTheme'

// ----------------------------------------------------------------------------
// Storybook story for the MonthHeader sub-component. Locale + theme variants
// so designers can sanity-check translated month names and colored headers.
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

const meta: Meta<typeof MonthHeader> = {
  title: 'Components/MonthHeader',
  component: MonthHeader,
}

export default meta

type Story = StoryObj<typeof MonthHeader>

export const English: Story = {
  render: () => (
    <Frame>
      <MonthHeader monthName="January" year={2025} theme={defaultTheme} />
    </Frame>
  ),
}

export const Turkish: Story = {
  render: () => (
    <Frame>
      <MonthHeader monthName="Ocak" year={2025} theme={defaultTheme} />
    </Frame>
  ),
}

export const Branded: Story = {
  render: () => (
    <Frame>
      <MonthHeader
        monthName="March"
        year={2025}
        theme={{
          ...defaultTheme,
          monthHeaderColor: '#7C3AED',
          fontSize: { ...defaultTheme.fontSize, monthHeader: 18 },
        }}
      />
    </Frame>
  ),
}

export const Minimal: Story = {
  render: () => (
    <Frame>
      <MonthHeader
        monthName="June"
        year={2025}
        theme={{
          ...defaultTheme,
          monthHeaderColor: '#374151',
          fontSize: { ...defaultTheme.fontSize, monthHeader: 12 },
        }}
      />
    </Frame>
  ),
}
