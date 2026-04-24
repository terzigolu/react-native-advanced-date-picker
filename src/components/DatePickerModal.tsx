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
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import type { RenderSaveButton, RenderCloseIcon } from './types'

type Props = {
  visible: boolean
  onClose: () => void
  onSave?: () => void
  theme: Theme
  locale: Locale
  children: React.ReactNode
  showSaveButton?: boolean
  /** Style applied to the slide-up container view. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the dark overlay behind the modal. */
  overlayStyle?: StyleProp<ViewStyle>
  /** Style applied to the header row (close-icon row). */
  headerStyle?: StyleProp<ViewStyle>
  /** Style applied to the footer row that wraps the save button. */
  footerStyle?: StyleProp<ViewStyle>
  /** Style applied to the save button itself. */
  saveButtonStyle?: StyleProp<ViewStyle>
  /** Style applied to the save button label text. */
  saveButtonTextStyle?: StyleProp<TextStyle>
  /** Style applied to the close (X) button wrapper. */
  closeButtonStyle?: StyleProp<ViewStyle>
  /** Style applied to the close (X) glyph text. */
  closeButtonTextStyle?: StyleProp<TextStyle>
  /** Slot: override the default save button. */
  renderSaveButton?: RenderSaveButton
  /** Slot: override the default close (X) icon. */
  renderCloseIcon?: RenderCloseIcon
}

// Try to use react-native-safe-area-context if available.
// We read SafeAreaInsetsContext directly (not via the hook) so that apps
// without <SafeAreaProvider> don't crash — they just get platform defaults.
let SafeAreaInsetsContext: React.Context<{ top: number; bottom: number; left: number; right: number } | null> | null = null
try {
  const safeArea = require('react-native-safe-area-context')
  SafeAreaInsetsContext = safeArea.SafeAreaInsetsContext
} catch {
  // package not installed — fall back to platform defaults below
}

const defaultInsets = {
  top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  bottom: 0,
}

const DatePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  theme,
  locale,
  children,
  showSaveButton = true,
  style,
  overlayStyle,
  headerStyle,
  footerStyle,
  saveButtonStyle,
  saveButtonTextStyle,
  closeButtonStyle,
  closeButtonTextStyle,
  renderSaveButton,
  renderCloseIcon,
}) => {
  // Read insets from context if available; null means no <SafeAreaProvider>
  // in the tree — fall back to platform defaults in that case.
  const ctxInsets = SafeAreaInsetsContext
    ? React.useContext(SafeAreaInsetsContext)
    : null
  const insets = ctxInsets ?? defaultInsets

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

  const saveButtonRadius = theme.radius?.saveButton ?? 12
  const modalRadius = theme.radius?.modal ?? 0
  const saveFontSize = theme.fontSize?.saveButton ?? 16

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim }, overlayStyle]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.background,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom,
              transform: [{ translateY: slideAnim }],
              borderTopLeftRadius: modalRadius,
              borderTopRightRadius: modalRadius,
            },
            style,
          ]}>
          {/* Header */}
          <View style={[styles.header, headerStyle]}>
            {renderCloseIcon ? (
              renderCloseIcon({ onPress: onClose, theme })
            ) : (
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={closeButtonStyle}>
                <Text
                  style={[
                    styles.closeText,
                    { color: theme.textColor, fontFamily: theme.fontFamily },
                    closeButtonTextStyle,
                  ]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
            <View />
          </View>

          {/* Calendar Content */}
          <View style={styles.content}>{children}</View>

          {/* Save Button */}
          {showSaveButton && (
            <View
              style={[
                styles.footer,
                { backgroundColor: theme.background },
                footerStyle,
              ]}>
              {renderSaveButton ? (
                renderSaveButton({ onPress: handleSave, theme, locale })
              ) : (
                <TouchableOpacity
                  onPress={handleSave}
                  activeOpacity={0.8}
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: theme.primary,
                      borderRadius: saveButtonRadius,
                    },
                    saveButtonStyle,
                  ]}>
                  <Text
                    style={[
                      styles.saveButtonText,
                      {
                        color: theme.selectedTextColor,
                        fontFamily: theme.fontFamily,
                        fontSize: saveFontSize,
                      },
                      saveButtonTextStyle,
                    ]}>
                    {locale.save}
                  </Text>
                </TouchableOpacity>
              )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontWeight: '600',
  },
})

export default memo(DatePickerModal)
