import React, { memo, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Platform,
  StatusBar,
} from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'

type Props = {
  visible: boolean
  onClose: () => void
  onSave?: () => void
  theme: Theme
  locale: Locale
  children: React.ReactNode
  showSaveButton?: boolean
}

// Try to use react-native-safe-area-context if available
let useSafeAreaInsets: (() => { top: number; bottom: number }) | null = null
try {
  const safeArea = require('react-native-safe-area-context')
  useSafeAreaInsets = safeArea.useSafeAreaInsets
} catch {
  // not available
}

const DatePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  theme,
  locale,
  children,
  showSaveButton = true,
}) => {
  // Safe area insets: use hook if available, fallback to StatusBar height
  const insets = useSafeAreaInsets
    ? useSafeAreaInsets()
    : { top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0, bottom: 0 }

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fadeAnim.setValue(0)
      slideAnim.setValue(300)
    }
  }, [visible, fadeAnim, slideAnim])

  const handleSave = useCallback(() => {
    onSave?.()
    onClose()
  }, [onSave, onClose])

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim },
        ]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.background,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text
                style={[
                  styles.closeText,
                  { color: theme.textColor, fontFamily: theme.fontFamily },
                ]}>
                ✕
              </Text>
            </TouchableOpacity>
            <View />
          </View>

          {/* Calendar Content */}
          <View style={styles.content}>{children}</View>

          {/* Save Button */}
          {showSaveButton && (
            <View style={[styles.footer, { backgroundColor: theme.background }]}>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.primary },
                ]}>
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: theme.selectedTextColor,
                      fontFamily: theme.fontFamily,
                    },
                  ]}>
                  {locale.save}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '300',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default memo(DatePickerModal)
