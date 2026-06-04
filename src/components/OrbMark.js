// OrbMark.js — the AudioCoach mic/orb mark. Replaces the old drawn AuraOrb.
// Transparent PNG (no outline/border), blends on dark and light backgrounds.
// Pass `animate` for a subtle breathing pulse (used on the analyzing screen).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const ORB = require('../../assets/orb-mark.png');

export default function OrbMark({ size = 200, animate = false, style }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Animated.Image
      source={ORB}
      resizeMode="contain"
      style={[
        { width: size, height: size },
        animate ? { transform: [{ scale }], opacity } : null,
        style,
      ]}
    />
  );
}
