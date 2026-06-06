// BottomNav.js — floating glass tab bar (Home / You).
// Surface renders through <Glass>: real Liquid Glass on iOS 26, blur elsewhere.
import React from 'react';
import { View, Pressable, Text, Platform } from 'react-native';
import { Glass } from './Glass';
import { useTheme } from '../theme/ThemeContext';
import Icon from './Icon';

export default function BottomNav({ tab, onTab, bottomInset = 0 }) {
  const t = useTheme();
  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'profile', icon: 'user', label: 'You' },
  ];

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(18, bottomInset),
        height: 62,
        zIndex: 30,
        borderRadius: 26,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: t.line,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      <Glass
        radius={26}
        dark={!!t.dark}
        intensity={Platform.OS === 'ios' ? 40 : 80}
        isInteractive
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}
      >
        {tabs.map((tb) => {
          const on = tab === tb.id;
          return (
            <Pressable
              key={tb.id}
              onPress={() => onTab(tb.id)}
              style={{ alignItems: 'center', gap: 4, paddingHorizontal: 26, paddingVertical: 6 }}
            >
              <Icon name={tb.icon} size={23} sw={on ? 2 : 1.6} stroke={on ? t.accentB : t.inkFaint} />
              <Text style={{ fontFamily: t.fonts.sans, fontSize: 11, fontWeight: '600', letterSpacing: 0.2, color: on ? t.accentB : t.inkFaint }}>
                {tb.label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}
