// TabsHost.ios.js — iOS uses the REAL native UITabBar (react-native-bottom-tabs).
// On iOS 26 this gets Apple's Liquid Glass automatically — no custom drawing.
// If the native module isn't installed yet, it safely falls back to JSTabs so
// the app still boots.
//
// To enable the native glass tab bar:
//   npx expo install react-native-bottom-tabs
//   npx expo prebuild -p ios --clean && npx expo run:ios
import React from 'react';
import JSTabs from './JSTabs';
import { useTheme } from '../theme/ThemeContext';

let RNBT = null;
try { RNBT = require('react-native-bottom-tabs'); } catch (e) { RNBT = null; }

export default function TabsHost(props) {
  const t = useTheme();
  const TabView = RNBT && (RNBT.default || RNBT.TabView);

  // Not installed → use the JS bottom nav so nothing breaks.
  if (!TabView) return <JSTabs {...props} />;

  const { activeTab, onTabChange, dashboard, profile } = props;
  const index = activeTab === 'you' ? 1 : 0;

  const routes = [
    { key: 'home', title: 'Home', focusedIcon: { sfSymbol: 'house.fill' }, unfocusedIcon: { sfSymbol: 'house' } },
    { key: 'you', title: 'You', focusedIcon: { sfSymbol: 'person.crop.circle.fill' }, unfocusedIcon: { sfSymbol: 'person.crop.circle' } },
  ];

  const renderScene = ({ route }) => (route.key === 'you' ? profile : dashboard);

  return (
    <TabView
      navigationState={{ index, routes }}
      onIndexChange={(i) => onTabChange(i === 1 ? 'you' : 'home')}
      renderScene={renderScene}
      labeled
      // You said no scroll-minimize — keep the bar fixed.
      minimizeBehavior="never"
      tabBarActiveTintColor={t.accent}
      tabBarInactiveTintColor={t.inkDim}
    />
  );
}
