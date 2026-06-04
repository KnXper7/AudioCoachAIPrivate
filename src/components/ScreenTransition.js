// ScreenTransition.js — the design's `screenIn` animation: each screen fades in
// and rises slightly (opacity 0→1, translateY 10→0) on mount. Give it a `key`
// that changes per screen so it re-runs on every navigation.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export default function ScreenTransition({ children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 420,
      easing: Easing.bezier(0.2, 0.7, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
