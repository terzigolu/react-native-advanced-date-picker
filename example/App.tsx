import React, { useState } from 'react'
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import SingleDateScreen from './screens/SingleDateScreen'
import RangeDateScreen from './screens/RangeDateScreen'
import InlineCalendarScreen from './screens/InlineCalendarScreen'
import HeadlessHookScreen from './screens/HeadlessHookScreen'
import ThemeShowcaseScreen from './screens/ThemeShowcaseScreen'

// ----------------------------------------------------------------------------
// Tiny in-memory navigator. We deliberately avoid `@react-navigation/native`
// here so the example app stays zero-extra-dep beyond Expo + the library
// itself. Each screen renders inline; tap the Back button to return.
// ----------------------------------------------------------------------------

type ScreenKey =
  | 'home'
  | 'single'
  | 'range'
  | 'inline'
  | 'headless'
  | 'theme'

type ScreenEntry = {
  key: ScreenKey
  title: string
  subtitle: string
  Component: React.FC
}

const SCREENS: ScreenEntry[] = [
  {
    key: 'single',
    title: 'Single date',
    subtitle: 'AdvancedDatePicker mode="single"',
    Component: SingleDateScreen,
  },
  {
    key: 'range',
    title: 'Date range + holidays',
    subtitle: 'AdvancedDatePicker mode="range"',
    Component: RangeDateScreen,
  },
  {
    key: 'inline',
    title: 'CalendarList sub-component',
    subtitle: 'Headless calendar grid',
    Component: InlineCalendarScreen,
  },
  {
    key: 'headless',
    title: 'useDatePicker hook',
    subtitle: 'Custom UI from the headless API',
    Component: HeadlessHookScreen,
  },
  {
    key: 'theme',
    title: 'Theme showcase',
    subtitle: 'Light / dark / branded presets',
    Component: ThemeShowcaseScreen,
  },
]

const App: React.FC = () => {
  const [screen, setScreen] = useState<ScreenKey>('home')

  const active = SCREENS.find(s => s.key === screen)

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        {screen === 'home' || !active ? (
          <ScrollView contentContainerStyle={styles.menuContent}>
            <Text style={styles.heading}>react-native-advanced-date-picker</Text>
            <Text style={styles.tagline}>
              Tap a row to explore each picker variant.
            </Text>

            {SCREENS.map(s => (
              <Pressable
                key={s.key}
                onPress={() => setScreen(s.key)}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{s.title}</Text>
                  <Text style={styles.rowSubtitle}>{s.subtitle}</Text>
                </View>
                <Text style={styles.chevron}>{'›'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.screenContainer}>
            <View style={styles.header}>
              <Pressable
                onPress={() => setScreen('home')}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}>
                <Text style={styles.backText}>{'‹ Back'}</Text>
              </Pressable>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {active.title}
              </Text>
              <View style={styles.backSpacer} />
            </View>
            <View style={styles.screenBody}>
              <active.Component />
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  menuContent: {
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowPressed: {
    backgroundColor: '#EEF2FF',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#94A3B8',
    marginLeft: 12,
  },
  screenContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 72,
  },
  backButtonPressed: {
    backgroundColor: '#EEF2FF',
  },
  backText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  backSpacer: {
    width: 72,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  screenBody: {
    flex: 1,
  },
})

export default App
