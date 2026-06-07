// JSTabs.js — the JS tab host used on Android (and as an iOS fallback if the
// native tab module isn't installed). Renders the active screen with the
// existing custom BottomNav — i.e. your current, good Android design, untouched.
import React from 'react';
import { View } from 'react-native';
import BottomNav from './BottomNav';

export default function JSTabs({ activeTab, onTabChange, dashboard, profile, insets }) {
  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'you' ? profile : dashboard}
      <BottomNav
        tab={activeTab === 'you' ? 'profile' : 'home'}
        onTab={(id) => onTabChange(id === 'profile' ? 'you' : 'home')}
        bottomInset={(insets && insets.bottom) || 0}
      />
    </View>
  );
}
