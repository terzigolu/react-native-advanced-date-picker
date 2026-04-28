import type { StorybookConfig } from '@storybook/react-vite'

// ----------------------------------------------------------------------------
// Storybook web preview config. Stories live next to the source they describe
// (`src/**/*.stories.tsx`). Storybook runs Vite + react-native-web so RN
// components render in the browser at http://localhost:6006.
// ----------------------------------------------------------------------------
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  // Map `react-native` to `react-native-web` so RN component imports resolve
  // to web-compatible primitives in the storybook preview.
  async viteFinal(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    }
    config.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      ...(config.resolve.extensions || [
        '.mjs',
        '.js',
        '.mts',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
      ]),
    ]
    return config
  },
}

export default config
