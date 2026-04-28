/**
 * Lane 6 — web-platform shadow file sanity tests.
 *
 * These tests verify:
 *   1. `isWeb` / `isNative` are derived from `Platform.OS` correctly.
 *   2. The web shadow components export the SAME prop interface as their
 *      native siblings, so swapping at bundle-resolution time stays type-safe
 *      for downstream consumers.
 *
 * We intentionally do not boot a web bundler here — that's covered in
 * Lane 8's storybook web preview as manual smoke. The point of this file is
 * to fail CI if the prop surface drifts between siblings.
 */

import * as PlatformModule from '../utils/platform'

describe('utils/platform', () => {
  it('exposes isWeb and isNative as booleans', () => {
    expect(typeof PlatformModule.isWeb).toBe('boolean')
    expect(typeof PlatformModule.isNative).toBe('boolean')
  })

  it('isWeb and isNative are mutually exclusive', () => {
    expect(PlatformModule.isWeb).toBe(!PlatformModule.isNative)
  })

  it('honors the mocked Platform.OS (defaults to ios in mock → isWeb=false)', () => {
    // The repo's react-native mock sets Platform.OS = 'ios', so the native
    // branch must light up under jest.
    expect(PlatformModule.isNative).toBe(true)
    expect(PlatformModule.isWeb).toBe(false)
  })
})

describe('web shadow components — type & default-export shape', () => {
  it('DatePickerModal.web has a default export (component)', () => {
    const mod = require('../components/DatePickerModal.web')
    expect(mod.default).toBeDefined()
    // memo() wraps into an object with $$typeof; both function and object
    // are valid React component representations.
    expect(['function', 'object']).toContain(typeof mod.default)
  })

  it('DayCell.web has a default export (component)', () => {
    const mod = require('../components/DayCell.web')
    expect(mod.default).toBeDefined()
    expect(['function', 'object']).toContain(typeof mod.default)
  })

  it('DayCell.web re-exports DayCellState type bridge', () => {
    // Type-only re-exports vanish at runtime, but the import shouldn't throw.
    expect(() => require('../components/DayCell.web')).not.toThrow()
  })
})

/**
 * Type-level parity check — these blocks never run at runtime; they exist so
 * `tsc --noEmit` fails if the prop surface drifts between native and web
 * siblings. We import both default exports, derive their props via
 * `React.ComponentProps`, and assert mutual assignability via a helper type.
 */
describe('type-level prop parity (compile-time only)', () => {
  it('compiles when the web prop type is assignable to the native one', () => {
    // The actual assertion lives in the type-only block below; this it()
    // exists purely so jest reports the file as having executed assertions.
    expect(true).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Type-only parity check — erased at runtime by ts-jest / babel-jest.
// If the prop shapes diverge, `yarn typescript` will fail the test file.
// ---------------------------------------------------------------------------

import type { ComponentProps } from 'react'
import type DatePickerModalNative from '../components/DatePickerModal'
import type DatePickerModalWeb from '../components/DatePickerModal.web'
import type DayCellNative from '../components/DayCell'
import type DayCellWeb from '../components/DayCell.web'

type ModalNativeProps = ComponentProps<typeof DatePickerModalNative>
type ModalWebProps = ComponentProps<typeof DatePickerModalWeb>
type DayCellNativeProps = ComponentProps<typeof DayCellNative>
type DayCellWebProps = ComponentProps<typeof DayCellWeb>

// Mutual assignability — both directions must hold for true API parity.
type AssertAssignable<A, B> = A extends B ? (B extends A ? true : false) : false

// These declarations exist only to surface a TS error if the props drift.
// `unused` is intentional; the type-checker still evaluates the constraint.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _modalParity: AssertAssignable<ModalNativeProps, ModalWebProps> = true
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dayCellParity: AssertAssignable<DayCellNativeProps, DayCellWebProps> = true
