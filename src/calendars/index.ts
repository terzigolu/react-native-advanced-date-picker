import { gregorian } from './gregorian'
import { hijri } from './hijri'
import { persian } from './persian'
import { buddhist } from './buddhist'
import type { CalendarEngine } from './types'

export type { CalendarEngine, EngineLocale } from './types'
export { gregorian, hijri, persian, buddhist }

/**
 * Registry of built-in calendar engines. Lane 7 adds hijri/persian/buddhist
 * alongside the default Gregorian engine.
 */
export const engines: Record<string, CalendarEngine> = {
  gregorian,
  hijri,
  persian,
  buddhist,
}

export const defaultEngine: CalendarEngine = gregorian
export default defaultEngine
