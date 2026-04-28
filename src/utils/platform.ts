import { Platform } from 'react-native'

/**
 * Lane 6 — single-source platform guards. Used by call sites that need to
 * branch between native (iOS/Android) and web (`react-native-web`). Prefer
 * `.web.tsx` shadow files for component-level forks; reach for these flags
 * only when a small inline branch is genuinely simpler.
 */
export const isWeb = Platform.OS === 'web'
export const isNative = !isWeb
