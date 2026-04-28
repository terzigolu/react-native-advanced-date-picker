import React from 'react'
import { View } from 'react-native'
import type { Preview } from '@storybook/react'

// ----------------------------------------------------------------------------
// Storybook preview decorators. Wrap every story in a centered View so it has
// breathing room in the canvas; plug in a SafeAreaProvider if/when stories
// start using `react-native-safe-area-context` directly.
// ----------------------------------------------------------------------------

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#FFFFFF' },
        { name: 'dark', value: '#0F172A' },
      ],
    },
  },
  decorators: [
    Story => (
      <View
        style={{
          padding: 24,
          backgroundColor: '#F9FAFB',
          minHeight: '100%',
          alignItems: 'flex-start',
        }}>
        <Story />
      </View>
    ),
  ],
}

export default preview
