// BottomNav.js — bottom tab bar.
//  • iOS 26: a single Liquid Glass pill (one GlassView) holding the tabs in a
//    row; the active tab sits inside its own tinted glass capsule (white label).
//    Pure glass — no CSS surface, no border, just the material + content.
//  • Android / older iOS: the original frosted bar, untouched.
import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Glass, isLiquidGlass } from './Glass';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function BottomNav({ tab, onTab, bottomInset = 0 }) {
  const t = useTheme();
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'profile', icon: 'user', label: 'You' },
  ];
  const bottom = Math.max(18, bottomInset);

  // ---- iOS 26: single glass pill tab bar ----
  if (isLiquidGlass()) {
    return (
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute', left: 16, right: 16, bottom, height: 66, zIndex: 30,
          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 36, shadowOffset: { width: 0, height: 12 },
        }}
      >
        <Glass radius={33} clear interactive dark={!!t.dark} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 }}>
          {tabs.map((tb) => {
            const on = tab === tb.id;
            const content = (
              <View style={{ alignItems: 'center', gap: 3, paddingHorizontal: 18, paddingVertical: 7 }}>
                <Icon name={tb.icon} size={22} sw={on ? 2 : 1.7} stroke={on ? t.onAccent : t.ink} />
                <Text style={{ fontFamily: t.fonts.sans, fontSize: 11, fontWeight: '600', letterSpacing: 0.2, color: on ? t.onAccent : t.ink }}>
                  {tb.label}
                </Text>
              </View>
            );
            return (
              <Pressable key={tb.id} onPress={() => onTab(tb.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                {on ? (
                  <Glass radius={22} tint={t.accent} clear={false} interactive={false} dark={!!t.dark}>
                    {content}
                  </Glass>
                ) : (
                  content
                )}
              </Pressable>
            );
          })}
        </Glass>
      </View>
    );
  }

  // ---- Android / older iOS: original frosted bar ----
  return (
    <View
      style={{
        position: 'absolute', left: 16, right: 16, bottom, height: 62, zIndex: 30,
        borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: t.line,
        shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 40, shadowOffset: { width: 0, height: 10 }, elevation: 12,
      }}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 80}
        tint={t.dark ? 'dark' : 'light'}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: t.navBg }}
      >
        {tabs.map((tb) => {
          const on = tab === tb.id;
          return (
            <Pressable key={tb.id} onPress={() => onTab(tb.id)} style={{ alignItems: 'center', gap: 4, paddingHorizontal: 26, paddingVertical: 6 }}>
              <Icon name={tb.icon} size={23} sw={on ? 2 : 1.6} stroke={on ? t.accentB : t.inkFaint} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 11, fontWeight: '600', letterSpacing: 0.2, color: on ? t.accentB : t.inkFaint }}>
                {tb.label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}
