# react-native-advanced-date-picker

A zero-dependency, fully customizable calendar date picker for React Native. Supports single and range date selection, i18n, theming, holidays, and both a simple prop-driven API and composable sub-components.

## Features

- **Zero mandatory dependencies** — date math uses native `Intl` API
- **Single & Range selection** — pick one date or a date range
- **i18n ready** — built-in English & Turkish, add your own locale
- **Fully themeable** — colors, fonts, border radius, everything
- **Holidays support** — highlight public holidays with labels
- **Modal & Inline** — use as a full-screen modal or embed inline
- **Safe area aware** — modal respects notch/status bar via `react-native-safe-area-context` (optional)
- **Composable** — use the main component or import individual parts
- **TypeScript** — full type definitions included

## Installation

```bash
npm install react-native-advanced-date-picker
# or
yarn add react-native-advanced-date-picker
```

### Optional peer dependency

For modal safe-area support (notch/status bar awareness), install:

```bash
yarn add react-native-safe-area-context
```

If not installed, the modal falls back to platform-default insets.

## Quick Start

```tsx
import { useState } from 'react'
import { AdvancedDatePicker } from 'react-native-advanced-date-picker'

const App = () => {
  const [visible, setVisible] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  return (
    <>
      <Button title="Pick dates" onPress={() => setVisible(true)} />
      <AdvancedDatePicker
        mode="range"
        locale="en"
        visible={visible}
        startDate={startDate}
        endDate={endDate}
        onDateChange={({ startDate, endDate }) => {
          setStartDate(startDate)
          setEndDate(endDate)
        }}
        onClose={() => setVisible(false)}
        minDate={new Date()}
      />
    </>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'single' \| 'range'` | `'single'` | Date selection mode |
| `locale` | `string \| Locale` | `'en'` | Locale code or custom locale object |
| `startDate` | `Date \| null` | `null` | Selected start date |
| `endDate` | `Date \| null` | `null` | Selected end date (range mode) |
| `onDateChange` | `(payload) => void` | required | Called on date selection |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `theme` | `Partial<Theme>` | default | Theme overrides |
| `holidays` | `Holiday[]` | `[]` | Holidays to highlight |
| `showHolidays` | `boolean` | `true` | Show holiday labels |
| `disabledDates` | `(string \| Date)[]` | `[]` | Non-selectable dates |
| `months` | `number` | `12` | Number of months to render |
| `modal` | `boolean` | `true` | Modal or inline mode |
| `visible` | `boolean` | `false` | Modal visibility |
| `onClose` | `() => void` | — | Modal close callback |
| `onSave` | `() => void` | — | Save button callback |
| `showSaveButton` | `boolean` | `true` | Show save button in modal |
| `renderDay` | `(day, state) => ReactNode` | — | Custom day cell renderer |

## Theming

```tsx
<AdvancedDatePicker
  theme={{
    primary: '#8B5CF6',
    background: '#1F2937',
    textColor: '#F9FAFB',
    sundayColor: '#EF4444',
    holidayColor: '#34D399',
    rangeBackground: 'rgba(139, 92, 246, 0.15)',
    selectedTextColor: '#FFFFFF',
    dayBorderRadius: 12,
  }}
/>
```

### Theme Properties

| Property | Default | Description |
|----------|---------|-------------|
| `primary` | `#2563EB` | Selected date background |
| `background` | `#FFFFFF` | Calendar background |
| `textColor` | `#1F2937` | Default text color |
| `disabledColor` | `#9CA3AF` | Disabled date text |
| `rangeBackground` | `#EBF0FA` | Range highlight color |
| `holidayColor` | `#16A34A` | Holiday text color |
| `sundayColor` | `#DC2626` | Sunday text color |
| `selectedTextColor` | `#FFFFFF` | Selected date text |
| `dayBorderRadius` | `99` | Day cell border radius |
| `monthHeaderColor` | `#2563EB` | Month title color |
| `weekDayHeaderColor` | `#9CA3AF` | Weekday header color |
| `dividerColor` | `#E5E7EB` | Divider line color |
| `fontFamily` | system | Custom font family |

## Custom Locale

```tsx
import type { Locale } from 'react-native-advanced-date-picker'

const german: Locale = {
  code: 'de',
  dayNamesShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  monthNames: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  today: 'Heute',
  save: 'Speichern',
  cancel: 'Abbrechen',
  pastDateWarning: 'Sie können kein vergangenes Datum auswählen.',
  warningTitle: 'Warnung',
  ok: 'OK',
}

<AdvancedDatePicker locale={german} />
```

## Holidays

```tsx
<AdvancedDatePicker
  holidays={[
    { date: '01-01', label: 'New Year' },
    { date: '12-25', label: 'Christmas' },
    { date: '07-04', label: 'Independence Day' },
  ]}
  showHolidays={true}
/>
```

## Composable Usage

For advanced customization, import individual components:

```tsx
import {
  CalendarList,
  DatePickerModal,
  WeekDayHeader,
  MonthHeader,
  DayCell,
  useCalendar,
  en,
  defaultTheme,
} from 'react-native-advanced-date-picker'

const MyCustomCalendar = () => {
  const { calendarData } = useCalendar({
    months: 6,
    locale: 'en',
    holidays: [{ date: '12-25', label: 'Christmas' }],
  })

  return (
    <CalendarList
      mode="single"
      locale={en}
      theme={defaultTheme}
      startDate={null}
      endDate={null}
      onStartDateChange={date => console.log(date)}
      onEndDateChange={date => console.log(date)}
    />
  )
}
```

## Custom Day Rendering

```tsx
<AdvancedDatePicker
  renderDay={(day, state) => (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: state.isSelected ? 'purple' : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: state.isSelected ? 'white' : 'black' }}>
        {day.day}
      </Text>
      {state.isHoliday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'green' }} />}
    </View>
  )}
/>
```

## Inline Mode

```tsx
<AdvancedDatePicker
  modal={false}
  mode="single"
  startDate={selectedDate}
  onDateChange={({ startDate }) => setSelectedDate(startDate)}
/>
```

## License

MIT
