// ----------------------------------------------------------------------------
// Vite config for the Storybook web preview only. The library itself ships via
// react-native-builder-bob (commonjs/module/typescript) and never touches Vite.
//
// react-native -> react-native-web alias lets RN component imports
// (`import { View } from 'react-native'`) resolve to web-compatible primitives
// when stories render in the browser at http://localhost:6006.
// ----------------------------------------------------------------------------
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
    ],
  },
  define: {
    // react-native-web reads __DEV__; ensure it's defined for browser bundles.
    __DEV__: JSON.stringify(true),
  },
})
