# react-native-advanced-date-picker — Design Spec

## Overview
A zero-dependency, fully customizable calendar date picker for React Native. Supports single and range date selection, i18n via locale objects, theming, public holidays, and both a simple prop-driven API and composable sub-components.

## Goals
- Zero mandatory dependencies (dates via native Intl API)
- Global audience: locale system with English default, Turkish built-in
- Two usage modes: quick (single component) and composable (sub-components)
- Theming via theme prop
- Optional peer deps: react-native-reanimated (animations), react-native-safe-area-context (safe area)

## Public API

### Quick Usage
```tsx
<AdvancedDatePicker
  mode="range"
  locale="tr"
  startDate={startDate}
  endDate={endDate}
  onDateChange={({ startDate, endDate }) => {}}
  minDate={new Date()}
  maxDate={new Date(2027, 11, 31)}
  theme={{ primary: '#3B82F6' }}
  holidays={[{ date: '01-01', label: 'New Year' }]}
  modal={true}
  onClose={() => {}}
/>
```

### Composable Usage
```tsx
import { CalendarList, DayCell, DatePickerModal, WeekDayHeader, MonthHeader, useCalendar } from 'react-native-advanced-date-picker'
```

## Architecture

### File Structure
```
src/
├── index.ts                    # Public exports
├── AdvancedDatePicker.tsx       # Single component API
├── components/
│   ├── CalendarList.tsx         # Monthly calendar FlatList
│   ├── DayCell.tsx             # Individual day cell
│   ├── DatePickerModal.tsx     # Modal wrapper
│   ├── WeekDayHeader.tsx       # Mon-Sun header row
│   └── MonthHeader.tsx         # Month/year header
├── hooks/
│   └── useCalendar.ts          # Calendar data generation
├── locale/
│   ├── types.ts
│   ├── en.ts
│   └── tr.ts
├── theme/
│   ├── types.ts
│   └── defaultTheme.ts
└── utils/
    ├── dateUtils.ts            # Pure date math (Intl API)
    └── types.ts                # Shared types
```

### Core Types
- `DatePickerMode`: 'single' | 'range'
- `DateRange`: { startDate, endDate }
- `Holiday`: { date: 'MM-DD', label: string }
- `Locale`: day names, month names, UI strings
- `Theme`: colors, borderRadius, fontFamily

### Dependencies
| Dep | Type | Note |
|-----|------|------|
| react | peer | >=16.8 |
| react-native | peer | >=0.63 |
| react-native-reanimated | optional peer | Graceful fallback to Animated |
| react-native-safe-area-context | optional peer | Skip if absent |

### Migration from ucuzyolu codebase
| Original | Package equivalent |
|----------|-------------------|
| CustomCalendarList | CalendarList (locale/theme-aware) |
| DayCircle | DayCell (theme-aware, render prop) |
| useCalendarArray | useCalendar (Intl API, no AsyncStorage) |
| DateSelectorModalContent | DatePickerModal (reanimated optional) |
| Hardcoded Turkish | locale system, default English |
| Hardcoded colors | theme system |
| turkishPublicHolidays | holidays prop |

### Build
- react-native-builder-bob
- Outputs: CommonJS + ESM + TypeScript declarations
- License: MIT
