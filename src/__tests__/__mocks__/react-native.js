const React = require('react')

const View = ({ children, style, ...props }) =>
  React.createElement('View', { style, ...props }, children)

const Text = ({ children, style, ...props }) =>
  React.createElement('Text', { style, ...props }, children)

const TouchableOpacity = ({ children, onPress, disabled, style, ...props }) =>
  React.createElement(
    'TouchableOpacity',
    {
      onClick: disabled ? undefined : onPress,
      onPress: disabled ? undefined : onPress,
      disabled,
      style,
      ...props,
    },
    children
  )

const FlatList = ({ data, renderItem, keyExtractor, ListHeaderComponent, ...props }) => {
  const items = (data || []).map((item, index) => {
    const key = keyExtractor ? keyExtractor(item, index) : String(index)
    return React.createElement(
      React.Fragment,
      { key },
      renderItem({ item, index })
    )
  })
  return React.createElement(
    View,
    props,
    ListHeaderComponent || null,
    ...items
  )
}

const Modal = ({ children, visible, ...props }) => {
  if (!visible) return null
  return React.createElement('Modal', props, children)
}

const Alert = {
  alert: jest.fn(),
}

const makeInterpolation = () => ({
  interpolate: () => 0,
})

const Animated = {
  View: View,
  Value: class {
    constructor(val) { this._value = val }
    setValue(val) { this._value = val }
    interpolate() { return 0 }
  },
  timing: () => ({ start: (cb) => cb && cb() }),
  spring: () => ({ start: (cb) => cb && cb() }),
  parallel: (anims) => ({ start: (cb) => cb && cb() }),
  multiply: (a, b) => makeInterpolation(),
  subtract: (a, b) => makeInterpolation(),
  add: (a, b) => makeInterpolation(),
  divide: (a, b) => makeInterpolation(),
}

const Easing = {
  out: (fn) => fn,
  in: (fn) => fn,
  inOut: (fn) => fn,
  quad: (t) => t,
  cubic: (t) => t,
  linear: (t) => t,
  bezier: () => (t) => t,
  ease: (t) => t,
}

const StatusBar = {
  currentHeight: 0,
}

const ScrollView = ({ children, style, ...props }) =>
  React.createElement('ScrollView', { style, ...props }, children)

const StyleSheet = {
  create: (styles) => styles,
  hairlineWidth: 0.5,
  flatten: (style) => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean))
    }
    return style || {}
  },
}

const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
}

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
}

module.exports = {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Dimensions,
  Platform,
}
