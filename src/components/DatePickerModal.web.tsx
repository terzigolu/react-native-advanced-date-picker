import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native'
import type { StyleProp, ViewStyle, TextStyle } from 'react-native'
import type { Theme } from '../theme/types'
import type { Locale } from '../locale/types'
import type { RenderSaveButton, RenderCloseIcon } from './types'

/**
 * Lane 6 — Web shadow for `DatePickerModal`.
 *
 * Metro / webpack auto-resolve `.web.tsx` over `.tsx` when `platform=web`,
 * so the public API is identical to the native sibling — the consumer
 * never imports this file directly.
 *
 * Differences vs native sibling:
 *  - No RN `<Modal>`. We render a fixed-position overlay (RN Web supports
 *    `position: 'fixed'`). This avoids RN Web's `Modal` shim, which paints
 *    into a portal-like container but mishandles ESC / focus.
 *  - No `Animated.timing(useNativeDriver: true)` — that emits a runtime
 *    warning on web. We drive opacity/transform via inline CSS transitions.
 *  - ESC key closes the modal.
 *  - Focus moves to the dialog container on open and back to the previously
 *    focused element on close (minimum focus-trap).
 *  - `accessibilityRole="dialog"` + `aria-modal` (RN Web maps these to the
 *    underlying div).
 */

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

// Try to use react-native-safe-area-context if available — same pattern as
// the native sibling so consumers see identical behaviour either way.
let SafeAreaInsetsContext: React.Context<{
  top: number
  bottom: number
  left: number
  right: number
} | null> | null = null
try {
  const safeArea = require('react-native-safe-area-context')
  SafeAreaInsetsContext = safeArea.SafeAreaInsetsContext
} catch {
  // optional peer not installed — fall back to zero insets on web
}

const defaultInsets = { top: 0, bottom: 0 }

const DatePickerModalWeb: React.FC<Props> = ({
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
  const ctxInsets = SafeAreaInsetsContext
    ? React.useContext(SafeAreaInsetsContext)
    : null
  const insets = ctxInsets ?? defaultInsets

  // We mount the overlay only once visibility has been requested, then drive
  // opacity / transform via state so the CSS transition has a frame to fire.
  // On hide we keep the DOM mounted long enough to play the exit transition.
  const [mounted, setMounted] = useState(visible)
  const [animateIn, setAnimateIn] = useState(false)

  const containerRef = useRef<any>(null)
  const previousFocusRef = useRef<any>(null)

  useEffect(() => {
    let raf = 0
    let timeout: any
    if (visible) {
      setMounted(true)
      // Defer to the next frame so the transition starts from the initial
      // (translateY: 300, opacity: 0) state.
      raf = requestAnimationFrame(() => setAnimateIn(true))
    } else if (mounted) {
      setAnimateIn(false)
      timeout = setTimeout(() => setMounted(false), 260)
    }
    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (timeout) clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // ESC + focus management. Only active when actually mounted on web.
  useEffect(() => {
    if (!mounted) return
    if (typeof window === 'undefined') return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)

    // Capture and shift focus into the dialog. The DOM node behind the
    // RN Web `View` exposes `focus()` once we add `tabIndex`.
    const doc: any = (typeof document !== 'undefined' ? document : null) as any
    previousFocusRef.current = doc?.activeElement ?? null
    const node = containerRef.current
    if (node && typeof node.focus === 'function') {
      try {
        node.focus()
      } catch {
        // some browsers throw if not focusable yet — harmless
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKey)
      const prev = previousFocusRef.current
      if (prev && typeof prev.focus === 'function') {
        try {
          prev.focus()
        } catch {
          // ignore
        }
      }
    }
  }, [mounted, onClose])

  const handleSave = useCallback(() => {
    onSave?.()
    onClose()
  }, [onSave, onClose])

  const saveButtonRadius = theme.radius?.saveButton ?? 12
  const modalRadius = theme.radius?.modal ?? 0
  const saveFontSize = theme.fontSize?.saveButton ?? 16

  if (!mounted) return null

  // CSS transition values — driven by `animateIn` rather than RN Animated.
  const overlayOpacity = animateIn ? 1 : 0
  const containerTranslateY = animateIn ? 0 : 300

  // RN Web maps unknown style props through to inline CSS — `position: fixed`
  // is a documented escape hatch. We type-cast to ViewStyle to keep TS happy
  // since `fixed` isn't in the RN ViewStyle union.
  const fixedOverlayStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    // @ts-expect-error — RN Web specific
    inset: 0,
  }
  // Cast through unknown to attach `position: 'fixed'` (RN Web only).
  ;(fixedOverlayStyle as any).position = 'fixed'

  // Web-only inline CSS transitions. RN Web forwards unknown style keys
  // straight to the DOM, so `transition` works as expected.
  const overlayTransitionStyle: any = {
    transition: 'opacity 240ms ease-out',
  }
  const containerTransitionStyle: any = {
    transition: 'transform 250ms ease-out, opacity 250ms ease-out',
  }

  return (
    <View
      // RN Web maps accessibilityRole to ARIA role on the DOM node.
      accessibilityRole={'dialog' as any}
      aria-modal={true}
      style={[fixedOverlayStyle, { opacity: overlayOpacity }, overlayTransitionStyle, overlayStyle]}>
      {/* Backdrop click → close. Stop propagation on the inner container
          so taps inside the dialog don't bubble up and dismiss it. */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
      />

      <View
        ref={containerRef as any}
        // tabIndex makes the container focusable so we can move focus to it
        // on open. RN Web forwards this to the DOM.
        // @ts-expect-error — RN Web specific prop
        tabIndex={-1}
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom,
            transform: [{ translateY: containerTranslateY }],
            opacity: animateIn ? 1 : 0,
            borderTopLeftRadius: modalRadius,
            borderTopRightRadius: modalRadius,
          },
          containerTransitionStyle,
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
              style={closeButtonStyle}
              accessibilityLabel="Close">
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
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    // On web, anchor to the bottom of the viewport like a slide-up sheet.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
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

// Silence the unused Platform import on builds that strip side-effect-free imports.
// We keep it imported so the file's runtime shape stays parallel to the native
// sibling and any future Platform-conditional logic is easy to drop in.
void Platform

export default memo(DatePickerModalWeb)
