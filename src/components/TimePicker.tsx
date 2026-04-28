import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import { defaultTheme } from '../theme/defaultTheme'
import { en } from '../locale/en'

const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5 // odd → there's an obvious middle row

export type TimePickerValue = {
  /** 0-23 in 24h mode; 0-23 (already converted from AM/PM) in 12h mode. */
  hour: number
  /** 0-59. */
  minute: number
}

export type TimePickerProps = {
  /** Controlled value. */
  value?: TimePickerValue
  /** Initial value when uncontrolled. Defaults to `00:00`. */
  defaultValue?: TimePickerValue
  /** Fired on every wheel-snap. */
  onChange?: (value: TimePickerValue) => void
  /** 12h adds an AM/PM column; 24h is the default. */
  hourFormat?: '12' | '24'
  /** Minute step (1, 5, 15, 30 …). Default 1. */
  minuteStep?: number
  theme?: Partial<Theme>
  locale?: Locale
  style?: StyleProp<ViewStyle>
  /** Style applied to each wheel column wrapper. */
  columnStyle?: StyleProp<ViewStyle>
  /** Style applied to the highlighted center band. */
  centerBandStyle?: StyleProp<ViewStyle>
  /** Style applied to wheel item text. */
  itemTextStyle?: StyleProp<TextStyle>
}

type ColumnProps = {
  data: number[] | string[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  formatItem?: (item: number | string) => string
  theme: Theme
  itemTextStyle?: StyleProp<TextStyle>
  testID?: string
}

/**
 * Lane 2 — single wheel column. FlatList vertical, snapToInterval = ITEM_HEIGHT,
 * top + bottom padding so the first/last items can sit on the center line.
 *
 * Native driver friendly (no animated scroll listener) — we settle on
 * `onMomentumScrollEnd` and snap programmatically when an item is tapped.
 */
const WheelColumn: React.FC<ColumnProps> = ({
  data,
  selectedIndex,
  onSelectIndex,
  formatItem,
  theme,
  itemTextStyle,
  testID,
}) => {
  const ref = useRef<FlatList<number | string>>(null)
  const lastSelectedRef = useRef(selectedIndex)

  // Keep the wheel scrolled to the controlled `selectedIndex` if it changes
  // out-of-band (e.g. parent reset). We don't fire onSelectIndex from this
  // path to avoid an emit loop.
  useEffect(() => {
    if (lastSelectedRef.current === selectedIndex) return
    lastSelectedRef.current = selectedIndex
    ref.current?.scrollToOffset({
      offset: selectedIndex * ITEM_HEIGHT,
      animated: true,
    })
  }, [selectedIndex])

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.y
      const index = Math.max(
        0,
        Math.min(data.length - 1, Math.round(offset / ITEM_HEIGHT)),
      )
      if (index !== lastSelectedRef.current) {
        lastSelectedRef.current = index
        onSelectIndex(index)
      }
    },
    [data.length, onSelectIndex],
  )

  const handlePressItem = useCallback(
    (index: number) => {
      lastSelectedRef.current = index
      onSelectIndex(index)
      ref.current?.scrollToOffset({
        offset: index * ITEM_HEIGHT,
        animated: true,
      })
    },
    [onSelectIndex],
  )

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<number | string>) => {
      const isCenter = index === lastSelectedRef.current
      const distance = Math.abs(index - lastSelectedRef.current)
      const opacity = Math.max(0.25, 1 - distance * 0.25)
      const label = formatItem ? formatItem(item) : String(item)
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handlePressItem(index)}
          style={styles.item}>
          <Text
            style={[
              styles.itemText,
              {
                color: isCenter ? theme.primary : theme.textColor,
                fontFamily: theme.fontFamily,
                opacity,
                fontWeight: isCenter ? '600' : '400',
              },
              itemTextStyle,
            ]}>
            {label}
          </Text>
        </TouchableOpacity>
      )
    },
    [handlePressItem, formatItem, theme, itemTextStyle],
  )

  // Padding so the first/last items can be centered.
  const paddingVertical = ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT

  return (
    <FlatList
      ref={ref}
      testID={testID}
      data={data}
      keyExtractor={(_, idx) => `wheel-${idx}`}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      initialScrollIndex={selectedIndex}
      onMomentumScrollEnd={handleMomentumEnd}
      style={styles.column}
      contentContainerStyle={{ paddingVertical }}
    />
  )
}

const range = (count: number, start = 0, step = 1): number[] => {
  const out: number[] = []
  for (let i = 0; i < count; i++) out.push(start + i * step)
  return out
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Lane 2 — `TimePicker` is a 3-column wheel (hour | minute | optional AM/PM).
 * Zero-dep, FlatList-based, native driver friendly. Snap-to-item on momentum
 * end; tap an item to scroll-snap programmatically.
 */
const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  onChange,
  hourFormat = '24',
  minuteStep = 1,
  theme: themeOverrides,
  locale = en,
  style,
  columnStyle,
  centerBandStyle,
  itemTextStyle,
}) => {
  const theme = useMemo<Theme>(
    () => ({ ...defaultTheme, ...themeOverrides }),
    [themeOverrides],
  )

  const initial = value ?? defaultValue ?? { hour: 0, minute: 0 }

  // ---- Column data ----
  const hourData = useMemo<number[]>(() => {
    if (hourFormat === '12') return range(12, 1, 1) // 1..12
    return range(24, 0, 1) // 0..23
  }, [hourFormat])

  const minuteData = useMemo<number[]>(() => {
    const count = Math.ceil(60 / minuteStep)
    return range(count, 0, minuteStep)
  }, [minuteStep])

  const ampmLabels = useMemo<string[]>(
    () => [locale.am ?? 'AM', locale.pm ?? 'PM'],
    [locale],
  )

  // ---- Map controlled hour ↔ wheel index ----
  const toIndices = useCallback(
    (h: number, m: number) => {
      let hourIdx: number
      let isPm = false
      if (hourFormat === '12') {
        isPm = h >= 12
        const h12 = h % 12 === 0 ? 12 : h % 12
        hourIdx = hourData.indexOf(h12)
      } else {
        hourIdx = hourData.indexOf(h)
      }
      const minuteIdx = Math.max(
        0,
        Math.round(m / minuteStep) % minuteData.length,
      )
      return {
        hourIdx: hourIdx < 0 ? 0 : hourIdx,
        minuteIdx,
        ampmIdx: isPm ? 1 : 0,
      }
    },
    [hourData, hourFormat, minuteData.length, minuteStep],
  )

  const initialIdx = toIndices(initial.hour, initial.minute)

  // ---- State ----
  const hourIdxRef = useRef(initialIdx.hourIdx)
  const minuteIdxRef = useRef(initialIdx.minuteIdx)
  const ampmIdxRef = useRef(initialIdx.ampmIdx)

  // Re-sync from controlled prop changes.
  useEffect(() => {
    if (!value) return
    const idx = toIndices(value.hour, value.minute)
    hourIdxRef.current = idx.hourIdx
    minuteIdxRef.current = idx.minuteIdx
    ampmIdxRef.current = idx.ampmIdx
  }, [value, toIndices])

  const emit = useCallback(() => {
    const hShown = hourData[hourIdxRef.current]
    let h24: number
    if (hourFormat === '12') {
      const isPm = ampmIdxRef.current === 1
      const base = hShown === 12 ? 0 : hShown
      h24 = isPm ? base + 12 : base
    } else {
      h24 = hShown
    }
    const minute = minuteData[minuteIdxRef.current]
    onChange?.({ hour: h24, minute })
  }, [hourData, hourFormat, minuteData, onChange])

  const onHour = useCallback(
    (idx: number) => {
      hourIdxRef.current = idx
      emit()
    },
    [emit],
  )
  const onMinute = useCallback(
    (idx: number) => {
      minuteIdxRef.current = idx
      emit()
    },
    [emit],
  )
  const onAmPm = useCallback(
    (idx: number) => {
      ampmIdxRef.current = idx
      emit()
    },
    [emit],
  )

  const headerHour = locale.hour ?? 'Hour'
  const headerMinute = locale.minute ?? 'Minute'

  const totalHeight = ITEM_HEIGHT * VISIBLE_ITEMS

  return (
    <View
      style={[
        { backgroundColor: theme.background, padding: 12 },
        style,
      ]}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.headerText,
            { color: theme.weekDayHeaderColor, fontFamily: theme.fontFamily },
          ]}>
          {headerHour}
        </Text>
        <Text
          style={[
            styles.headerText,
            { color: theme.weekDayHeaderColor, fontFamily: theme.fontFamily },
          ]}>
          {headerMinute}
        </Text>
        {hourFormat === '12' && (
          <Text
            style={[
              styles.headerText,
              { color: theme.weekDayHeaderColor, fontFamily: theme.fontFamily },
            ]}
          />
        )}
      </View>

      <View style={[styles.wheelRow, { height: totalHeight }]}>
        {/* Highlight band for the center row */}
        <View
          pointerEvents="none"
          style={[
            styles.centerBand,
            {
              top: ((VISIBLE_ITEMS - 1) / 2) * ITEM_HEIGHT,
              height: ITEM_HEIGHT,
              borderColor: theme.dividerColor,
              backgroundColor: theme.rangeBackground,
            },
            centerBandStyle,
          ]}
        />

        <View style={[styles.columnWrap, columnStyle]}>
          <WheelColumn
            data={hourData}
            selectedIndex={hourIdxRef.current}
            onSelectIndex={onHour}
            formatItem={n => pad2(n as number)}
            theme={theme}
            itemTextStyle={itemTextStyle}
            testID="timepicker-hour"
          />
        </View>
        <View style={[styles.columnWrap, columnStyle]}>
          <WheelColumn
            data={minuteData}
            selectedIndex={minuteIdxRef.current}
            onSelectIndex={onMinute}
            formatItem={n => pad2(n as number)}
            theme={theme}
            itemTextStyle={itemTextStyle}
            testID="timepicker-minute"
          />
        </View>
        {hourFormat === '12' && (
          <View style={[styles.columnWrap, columnStyle]}>
            <WheelColumn
              data={ampmLabels}
              selectedIndex={ampmIdxRef.current}
              onSelectIndex={onAmPm}
              theme={theme}
              itemTextStyle={itemTextStyle}
              testID="timepicker-ampm"
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  wheelRow: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  columnWrap: {
    flex: 1,
  },
  column: {
    flex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
  },
  centerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
})

export default memo(TimePicker)
